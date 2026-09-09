import { apiRequest } from "./client";
import type { RenderPayload, RenderResponse } from "./types";

export function renderFilledPdf(payload: RenderPayload) {
  return apiRequest<RenderResponse>("/render/pdf", {
    method: "POST",
    body: payload
  });
}

export function previewTemplate(payload: RenderPayload) {
  return apiRequest<RenderResponse>("/render/preview", {
    method: "POST",
    body: payload
  });
}
