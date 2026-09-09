import { createHash } from "node:crypto";

import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import {
  formatValue,
  resolvePointer,
  type Annotation,
} from "./annotation.js";

import type { PageInfo } from "../models/index.js";
import { AppError } from "../middleware/errors.js";

export function fingerprint(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function inspectPdf(bytes: Uint8Array) {
  let document: PDFDocument;

  try {
    document = await PDFDocument.load(bytes, {
      updateMetadata: false,
    });
  } catch {
    throw new AppError(
      400,
      "Cannot read PDF; upload a valid, unencrypted PDF",
    );
  }

  if (
    document.getPageCount() === 0 ||
    document.getPageCount() > 100
  ) {
    throw new AppError(400, "PDF must contain 1–100 pages");
  }

  const pages: PageInfo[] = document.getPages().map((page, index) => {
    const media = page.getMediaBox();
    const crop = page.getCropBox();

    if (
      page.getRotation().angle % 360 !== 0 ||
      media.x !== 0 ||
      media.y !== 0 ||
      crop.x !== media.x ||
      crop.y !== media.y ||
      crop.width !== media.width ||
      crop.height !== media.height
    ) {
      throw new AppError(
        400,
        "Rotated or cropped PDF pages are not supported in this version",
        { page: index + 1 },
      );
    }

    if (
      !Number.isFinite(media.width) ||
      !Number.isFinite(media.height) ||
      media.width <= 0 ||
      media.height <= 0
    ) {
      throw new AppError(400, "Invalid PDF page dimensions");
    }

    return {
      page: index + 1,
      width: media.width,
      height: media.height,
    };
  });

  return { document, pages };
}

export function validateBounds(
  annotation: Annotation,
  pages: PageInfo[],
): void {
  for (const field of annotation.fields) {
    const page = pages[field.page - 1];

    if (!page) {
      throw new AppError(400, "Field references an invalid page", {
        fieldId: field.id,
      });
    }

    const { x, y, width, height } = field.box;

    if (
      x + width > page.width ||
      y + height > page.height
    ) {
      throw new AppError(400, "Field extends beyond page bounds", {
        fieldId: field.id,
      });
    }
  }
}

export async function renderPdf(
  source: Uint8Array,
  annotation: Annotation,
  data: unknown,
): Promise<Uint8Array> {
  if (fingerprint(source) !== annotation.sourceSha256) {
    throw new AppError(409, "Source PDF fingerprint mismatch");
  }

  const { document, pages } = await inspectPdf(source);

  validateBounds(annotation, pages);

  const font = await document.embedFont(StandardFonts.Helvetica);
  let drawnFields = 0;

  for (const field of annotation.fields) {
    const value = resolvePointer(data, field.pointer);
    const text = formatValue(field, value);

    if (text === "") continue;

    const { box, style } = field;

    const availableWidth = box.width - style.padding * 2;
    const availableHeight = box.height - style.padding * 2;

    let widthAtOne: number;

    try {
      widthAtOne = font.widthOfTextAtSize(text, 1);
    } catch {
      throw new AppError(
        422,
        "Text contains characters unsupported by the configured font",
        { fieldId: field.id },
      );
    }

    const heightAtOne = font.heightAtSize(1);
    const ascentAtOne = font.heightAtSize(1, { descender: false });
    const descentAtOne = heightAtOne - ascentAtOne;

    const fitSize = Math.min(
      availableWidth / Math.max(widthAtOne, Number.EPSILON),
      availableHeight / heightAtOne,
    );

    let fontSize = style.fontSize;

    if (fontSize > fitSize) {
      if (style.overflow === "error") {
        throw new AppError(422, "Value does not fit in its box", {
          fieldId: field.id,
        });
      }

      fontSize = Math.min(fontSize, fitSize);

      if (fontSize < style.minFontSize) {
        throw new AppError(
          422,
          "Value cannot fit at the minimum font size",
          { fieldId: field.id },
        );
      }
    }

    const textWidth = widthAtOne * fontSize;
    const textHeight = heightAtOne * fontSize;

    let x = box.x + style.padding;

    if (style.align === "center") {
      x += (availableWidth - textWidth) / 2;
    }

    if (style.align === "right") {
      x += availableWidth - textWidth;
    }

    const page = document.getPage(field.page - 1);
    const pageHeight = pages[field.page - 1].height;

    const boxBottom = pageHeight - box.y - box.height;

    const y =
      boxBottom +
      style.padding +
      (availableHeight - textHeight) / 2 +
      descentAtOne * fontSize;

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    drawnFields += 1;
  }

  if (annotation.fields.length > 0 && drawnFields === 0) {
    throw new AppError(422, "No printable values were resolved from the provided data", {
      fieldCount: annotation.fields.length,
    });
  }

  return document.save();
}
