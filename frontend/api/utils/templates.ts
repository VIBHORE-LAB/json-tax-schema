import { apiRequest } from "./client";
import type { CreateTemplatePayload, TaxFormTemplate, UpdateTemplatePayload } from "./types";

export function listTemplates(signal?: AbortSignal) {
  return apiRequest<TaxFormTemplate[]>("/templates", { signal });
}

export function getTemplate(templateId: string, signal?: AbortSignal) {
  return apiRequest<TaxFormTemplate>(`/templates/${templateId}`, { signal });
}

export function createTemplate(payload: CreateTemplatePayload) {
  return apiRequest<TaxFormTemplate>("/templates", {
    method: "POST",
    body: payload
  });
}

export function updateTemplate(templateId: string, payload: UpdateTemplatePayload) {
  return apiRequest<TaxFormTemplate>(`/templates/${templateId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteTemplate(templateId: string) {
  return apiRequest<{ success: boolean }>(`/templates/${templateId}`, {
    method: "DELETE"
  });
}
