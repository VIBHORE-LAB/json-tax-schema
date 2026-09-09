export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type NormalizedBox = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FieldFormat = {
  type: "text" | "number" | "currency" | "date" | "checkbox" | "ssn" | "ein" | "phone";
  fontSize?: number;
  align?: "left" | "center" | "right";
  multiline?: boolean;
  overflow?: "shrink" | "truncate" | "wrap";
  emptyValue?: string;
  negativeStyle?: "minus" | "parentheses";
  rounding?: "none" | "nearest-dollar" | "cents";
};

export type AnnotationField = {
  id: string;
  label: string;
  box: NormalizedBox;
  dataPath?: string;
  expression?: string;
  format: FieldFormat;
};

export type TaxFormTemplate = {
  id: string;
  name: string;
  taxYear: number;
  formVersion: string;
  pages: number;
  fields: AnnotationField[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTemplatePayload = Omit<TaxFormTemplate, "id" | "createdAt" | "updatedAt">;

export type UpdateTemplatePayload = Partial<CreateTemplatePayload>;

export type RenderPayload = {
  templateId: string;
  data: Record<string, unknown>;
};

export type RenderResponse = {
  fileName: string;
  url: string;
};

export type UploadResponse = {
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
};
