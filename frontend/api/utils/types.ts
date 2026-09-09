export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type NormalizedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FieldFormat = {
  type: "text" | "decimal" | "checkbox";
  decimals?: number;
  grouping?: boolean;
  negative?: "minus" | "parentheses";
};

export type FieldStyle = {
  fontSize: number;
  minFontSize: number;
  padding: number;
  align?: "left" | "center" | "right";
  overflow?: "error" | "shrink";
};

export type AnnotationField = {
  id: string;
  page: number;
  box: NormalizedBox;
  pointer: string;
  format: FieldFormat;
  style: FieldStyle;
  missing: "blank" | "error";
  label?: string;
};

export type TaxFormTemplate = {
  id: string;
  name: string;
  taxYear: number;
  sourceSha256: string;
  pages: Array<{
    page: number;
    width: number;
    height: number;
  }>;
};

export type TemplateListResponse = {
  items: TaxFormTemplate[];
  total: number;
  limit: number;
  offset: number;
};

export type Annotation = {
  specVersion: "1.0.0";
  units: "pt";
  origin: "top-left";
  sourceSha256: string;
  fields: AnnotationField[];
};

export type AnnotationVersion = {
  id: string;
  templateId: string;
  revision: number;
  annotation: Annotation;
};

export type CreateTemplatePayload = {
  name: string;
  taxYear: number;
  file: File;
};

export type SaveAnnotationPayload = {
  expectedRevision: number;
  annotation: Annotation;
};

export type RenderPayload = {
  revision: number;
  data: Record<string, unknown>;
};

export type UploadResponse = {
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
};
