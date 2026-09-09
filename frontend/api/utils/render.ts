import { apiBlob } from "./client";
import type { RenderPayload } from "./types";

export function renderFilledPdf(templateId: string, payload: RenderPayload) {
  return apiBlob(`/templates/${templateId}/render`, {
    method: "POST",
    body: payload
  });
}

export function previewTemplate(templateId: string, payload: RenderPayload) {
  return renderFilledPdf(templateId, payload);
}
