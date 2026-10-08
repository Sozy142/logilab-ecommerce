import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as controller from "../controllers/admin-orders.controller.js";

export const adminOrdersRouter = Router();

adminOrdersRouter.use(requireAuth, requireRole("staff"));

adminOrdersRouter.get("/", asyncHandler(controller.list));
adminOrdersRouter.get("/:id", asyncHandler(controller.getById));
adminOrdersRouter.patch("/:id/status", asyncHandler(controller.updateStatus));
