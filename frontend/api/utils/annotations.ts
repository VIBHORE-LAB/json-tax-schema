import { apiRequest } from "./client";
import type { AnnotationField } from "./types";

export function validateAnnotations(fields: AnnotationField[]) {
  return apiRequest<{ valid: boolean; errors: string[] }>("/annotations/validate", {
    method: "POST",
    body: { fields }
  });
}

export function resolveAnnotationValues(templateId: string, data: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>("/annotations/resolve", {
    method: "POST",
    body: { templateId, data }
  });
}
