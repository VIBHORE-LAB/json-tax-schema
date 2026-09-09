import { Router } from "express";
import { upload } from "../middleware/upload.js";

import {
  createTemplate,
  listTemplates,
  getTemplate,
  getSource,
  saveAnnotation,
  getLatestAnnotation,
  getAnnotationRevision,
  renderTemplate,
} from "../controllers/template.controller.js";


export const templateRouter = Router();

templateRouter.post(
  "/",
  upload.single("file"),
  createTemplate
)

templateRouter.get("/", listTemplates);

templateRouter.get("/:id", getTemplate);

templateRouter.get("/:id/source", getSource);

templateRouter.post(
  "/:id/annotations",
  saveAnnotation,
);

templateRouter.get(
  "/:id/annotations/latest",
  getLatestAnnotation,
);

templateRouter.get(
  "/:id/annotations/:revision",
  getAnnotationRevision,
);

templateRouter.post(
  "/:id/render",
  renderTemplate,
);
