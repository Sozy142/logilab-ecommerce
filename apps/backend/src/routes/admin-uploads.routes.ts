import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as controller from "../controllers/uploads.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const adminUploadsRouter = Router();

adminUploadsRouter.use(requireAuth, requireRole("staff"));

adminUploadsRouter.post("/", upload.single("file"), asyncHandler(controller.uploadImage));
