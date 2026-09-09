import { apiRequest } from "./client";
import type { UploadResponse } from "./types";

export function uploadFormPdf(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<UploadResponse>("/uploads/forms", {
    method: "POST",
    body: formData
  });
}

export function uploadSampleData(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<UploadResponse>("/uploads/sample-data", {
    method: "POST",
    body: formData
  });
}
