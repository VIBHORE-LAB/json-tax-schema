import { z } from "zod";
import { Decimal } from "decimal.js";
import { AppError } from "../middleware/errors.js";

const formatSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
  }).strict(),

  z.object({
    type: z.literal("decimal"),
    decimals: z.number().int().min(0).max(6).default(0),
    grouping: z.boolean().default(false),
    negative: z.enum(["minus", "parentheses"]).default("minus"),
  }).strict(),

  z.object({
    type: z.literal("checkbox"),
  }).strict(),
]);
const styleSchema = z.object({
  fontSize: z.number().min(4).max(72).default(10),
  minFontSize: z.number().min(4).max(72).default(6),
  padding: z.number().min(0).max(20).default(1),

  align: z.enum(["left", "center", "right"]).default("left"),

  overflow: z.enum(["error", "shrink"]).default("error"),
}).strict().default({});


const fieldSchema = z.object({
  id: z.string().trim().min(1).max(100),
  page: z.number().int().min(1),
  box: z.object({
    x: z.number().finite().min(0),
    y: z.number().finite().min(0),
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
  }).strict(),

  pointer: z.string().max(1000).regex(
    /^(?:\/(?:[^~/]|~[01])*)*$/,
    "Invalid JSON Pointer",
  ),
  format: formatSchema,
  style: styleSchema,
  missing: z.enum(["blank", "error"]).default("error")
}).strict();



export const annotationSchema = z.object({
  specVersion: z.literal("1.0.0"),
  units: z.literal("pt"),
  origin: z.literal("top-left"),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  fields: z.array(fieldSchema).max(2000)
}).strict().superRefine((annotation, context) => {
  const ids = new Set<string>();
  annotation.fields.forEach((field, index) => {
    if (ids.has(field.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fields", index, "id"],
        message: "Duplicate field ID"
      })
    }
    ids.add(field.id);
    if (field.style.minFontSize > field.style.fontSize) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fields", index, "style", "minFontSize"],
        message: "minFontSize must be less than or equal to fontSize"
      })
    }

    if (field.style.padding * 2 >= field.box.width ||
      field.style.padding * 2 >= field.box.height
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fields", index, "style", "padding"],
        message: "padding must be less than half of the box width or height"
      })
    }

  })


});










export type Annotation = z.infer<typeof annotationSchema>;
export type Field = Annotation["fields"][number];




export function resolvePointer(
  data: unknown,
  pointer: string,
): unknown {
  if (!/^(?:\/(?:[^~/]|~[01])*)*$/.test(pointer)) {
     throw new AppError(400, "Invalid JSON Pointer");
  }

  if (pointer === "") return data;
  let current: unknown = data;
  for (const segment of pointer.slice(1).split("/")) {
    const key = segment.replace(/~1/g, "/").replace(/~0/g, "~");
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    if (Array.isArray(current) && !/^(0|[1-9]\d*)$/.test(key)) {
         return undefined;
       }
    if (!Object.hasOwn(current, key)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function formatValue(field: Field, value: unknown): string {
  if (value === undefined || value === null) {
    if (field.missing === "blank") return "";

    throw new AppError(422, "Required value is missing", {
      fieldId: field.id,
      pointer: field.pointer,
    });
  }

  if (field.format.type === "text") {
    if (typeof value !== "string") {
      throw new AppError(422, "Text field requires a string", {
        fieldId: field.id,
      });
    }

    if (/[\x00-\x1f\x7f]/.test(value)) {
      throw new AppError(422, "Text must be a single line", {
        fieldId: field.id,
      });
    }

    return value;
  }

  if (field.format.type === "checkbox") {
    if (typeof value !== "boolean") {
      throw new AppError(422, "Checkbox requires a boolean", {
        fieldId: field.id,
      });
    }

    return value ? "X" : "";
  }

  if (
    typeof value !== "string" ||
    value.length > 100 ||
    !/^-?\d+(?:\.\d+)?$/.test(value)
  ) {
    throw new AppError(422, "Decimal requires a decimal string", {
      fieldId: field.id,
      example: "1234.50",
    });
  }

  const amount = new Decimal(value).toDecimalPlaces(
    field.format.decimals,
    Decimal.ROUND_HALF_UP,
  );

  let [integer, fraction] = amount.abs()
    .toFixed(field.format.decimals)
    .split(".");

  if (field.format.grouping) {
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  let text = fraction === undefined
    ? integer
    : `${integer}.${fraction}`;

  if (amount.isNegative() && !amount.isZero()) {
    text = field.format.negative === "parentheses"
      ? `(${text})`
      : `-${text}`;
  }

  return text;
}
