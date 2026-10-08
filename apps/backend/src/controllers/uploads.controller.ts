import type { Request, Response } from "express";
import { processAndUploadImage } from "../lib/image-upload.js";
import { badRequest } from "../lib/app-error.js";

export async function uploadImage(req: Request, res: Response) {
  if (!req.file) throw badRequest("Thiếu file ảnh");
  const url = await processAndUploadImage(req.file.buffer, req.file.mimetype);
  res.status(201).json({ url });
}
