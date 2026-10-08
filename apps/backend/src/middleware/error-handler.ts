import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import * as Sentry from "@sentry/node";
import { AppError } from "../lib/app-error.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: "validation_error", message: "Dữ liệu gửi lên không hợp lệ", issues: err.issues },
    });
  }
  if (err instanceof MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File quá lớn (tối đa 10MB)" : err.message;
    return res.status(400).json({ error: { code: "upload_error", message } });
  }
  // Only report genuinely unexpected errors — the branches above are
  // expected/handled error paths (validation, business rules), not bugs.
  Sentry.captureException(err);
  console.error(err);
  return res.status(500).json({ error: { code: "internal_error", message: "Có lỗi xảy ra ở server" } });
}
