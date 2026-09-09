import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: error.issues,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      error: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(
      error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
    ).json({
      error: error.message,
      code: error.code,
    });
    return;
  }

  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  if (error?.type === "entity.too.large") {
    res.status(413).json({ error: "Request body too large" });
    return;
  }

  console.error("Unhandled server error:", error);

  res.status(500).json({
    error: "Internal server error",
  });
};
