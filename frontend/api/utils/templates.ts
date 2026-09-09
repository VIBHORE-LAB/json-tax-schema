import { apiRequest } from "./client";
import type { AnnotationVersion, CreateTemplatePayload, SaveAnnotationPayload, TaxFormTemplate, TemplateListResponse } from "./types";

export function listTemplates(signal?: AbortSignal) {
  return apiRequest<TemplateListResponse>("/templates", { signal });
}

export function getTemplate(templateId: string, signal?: AbortSignal) {
  return apiRequest<TaxFormTemplate>(`/templates/${templateId}`, { signal });
}

export function createTemplate(payload: CreateTemplatePayload) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("taxYear", String(payload.taxYear));
  formData.append("file", payload.file);

  return apiRequest<TaxFormTemplate>("/templates", {
    method: "POST",
    body: formData
  });
}

export function saveAnnotation(templateId: string, payload: SaveAnnotationPayload) {
  return apiRequest<AnnotationVersion>(`/templates/${templateId}/annotations`, {
    method: "POST",
    body: payload
  });
}

export function getLatestAnnotation(templateId: string, signal?: AbortSignal) {
  return apiRequest<AnnotationVersion>(`/templates/${templateId}/annotations/latest`, { signal });
}
