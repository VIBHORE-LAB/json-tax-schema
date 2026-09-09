import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { sequelize } from "../database.js";

import {
  Template,
  AnnotationVersion,
} from "../models/index.js";

import { AppError } from "../middleware/errors.js";
import { annotationSchema } from "../lib/annotation.js";

import {
  inspectPdf,
  fingerprint,
  validateBounds,
  renderPdf,
} from "../lib/pdf.js";

import {
  saveSource,
  removeSource,
} from "../lib/storage.js";

const idSchema = z.string().uuid();

const uploadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  taxYear: z.coerce.number().int().min(1900).max(2200),
}).strict();

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const saveSchema = z.object({
  expectedRevision: z.number().int().min(0),
  annotation: annotationSchema,
}).strict();

const renderSchema = z.object({
  revision: z.number().int().positive(),
  data: z.record(z.unknown()),
}).strict();

function publicTemplate(template: Template) {
  return {
    id: template.id,
    name: template.name,
    taxYear: template.taxYear,
    sourceSha256: template.sourceSha256,
    pages: template.pages,
  };
}

async function findTemplate(id: string): Promise<Template> {
  const template = await Template.findByPk(id);

  if (!template) {
    throw new AppError(404, "Template not found");
  }

  return template;
}

export async function createTemplate(req: Request, res: Response) {
  const body = uploadSchema.parse(req.body);

  if (!req.file) {
    throw new AppError(400, "PDF file is required");
  }

  const { pages } = await inspectPdf(req.file.buffer);

  const id = randomUUID();
  const sourceKey = `${id}.pdf`;
  const sourceSha256 = fingerprint(req.file.buffer);

  await saveSource(sourceKey, req.file.buffer);

  let template: Template;

  try {
    template = await Template.create({
      id,
      name: body.name,
      taxYear: body.taxYear,
      sourceKey,
      sourceSha256,
      sourceBytes: req.file.buffer,
      pages,
    });
  } catch (error) {
    await removeSource(sourceKey).catch((cleanupError) => {
      console.error("Source cleanup failed:", cleanupError);
    });

    throw error;
  }

  res.status(201).json(publicTemplate(template));
}

export async function listTemplates(req: Request, res: Response) {
  const { limit, offset } = paginationSchema.parse(req.query);

  const result = await Template.findAndCountAll({
    limit,
    offset,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
  });

  res.json({
    items: result.rows.map(publicTemplate),
    total: result.count,
    limit,
    offset,
  });
}

export async function getTemplate(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);
  const template = await findTemplate(id);

  res.json(publicTemplate(template));
}

export async function getSource(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);
  const template = await findTemplate(id);
  const bytes = template.sourceBytes;

  if (fingerprint(bytes) !== template.sourceSha256) {
    throw new AppError(409, "Stored source PDF has changed");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${template.id}.pdf"`,
  );

  res.send(bytes);
}

export async function saveAnnotation(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);
  const body = saveSchema.parse(req.body);

  const version = await sequelize.transaction(async (transaction) => {
    const template = await Template.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!template) {
      throw new AppError(404, "Template not found");
    }

    if (
      body.annotation.sourceSha256 !== template.sourceSha256
    ) {
      throw new AppError(409, "Annotation references a different PDF");
    }

    validateBounds(body.annotation, template.pages);

    const latest = await AnnotationVersion.findOne({
      where: { templateId: id },
      order: [["revision", "DESC"]],
      transaction,
    });

    const currentRevision = latest?.revision ?? 0;

    if (body.expectedRevision !== currentRevision) {
      throw new AppError(
        409,
        "Annotation changed; reload before saving",
        { currentRevision },
      );
    }

    return AnnotationVersion.create(
      {
        templateId: id,
        revision: currentRevision + 1,
        annotation: body.annotation,
      },
      { transaction },
    );
  });

  res.status(201).json(version);
}

export async function getLatestAnnotation(
  req: Request,
  res: Response,
) {
  const id = idSchema.parse(req.params.id);

  await findTemplate(id);

  const version = await AnnotationVersion.findOne({
    where: { templateId: id },
    order: [["revision", "DESC"]],
  });

  if (!version) {
    throw new AppError(404, "No annotation has been saved");
  }

  res.json(version);
}

export async function getAnnotationRevision(
  req: Request,
  res: Response,
) {
  const id = idSchema.parse(req.params.id);

  const revision = z.coerce.number()
    .int()
    .positive()
    .parse(req.params.revision);

  const version = await AnnotationVersion.findOne({
    where: {
      templateId: id,
      revision,
    },
  });

  if (!version) {
    throw new AppError(404, "Annotation revision not found");
  }

  res.json(version);
}

export async function renderTemplate(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);
  const body = renderSchema.parse(req.body);

  const template = await findTemplate(id);

  const version = await AnnotationVersion.findOne({
    where: {
      templateId: id,
      revision: body.revision,
    },
  });

  if (!version) {
    throw new AppError(404, "Annotation revision not found");
  }

  const source = template.sourceBytes;

  // Validate stored annotation before using it.
  const annotation = annotationSchema.parse(version.annotation);

  const bytes = await renderPdf(
    source,
    annotation,
    body.data,
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Cache-Control", "no-store");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="filled-${id}-r${body.revision}.pdf"`,
  );

  res.send(Buffer.from(bytes));
}
