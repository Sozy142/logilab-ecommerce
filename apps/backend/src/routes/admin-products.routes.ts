import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as controller from "../controllers/admin-products.controller.js";

export const adminProductsRouter = Router();

adminProductsRouter.use(requireAuth, requireRole("staff"));

adminProductsRouter.get("/", asyncHandler(controller.list));
adminProductsRouter.post("/", asyncHandler(controller.create));
adminProductsRouter.get("/:id", asyncHandler(controller.getById));
adminProductsRouter.put("/:id", asyncHandler(controller.update));
adminProductsRouter.delete("/:id", asyncHandler(controller.remove));

adminProductsRouter.post("/:id/variants", asyncHandler(controller.createVariant));
adminProductsRouter.put("/:id/variants/:variantId", asyncHandler(controller.updateVariant));
adminProductsRouter.delete("/:id/variants/:variantId", asyncHandler(controller.removeVariant));

adminProductsRouter.post("/:id/images", asyncHandler(controller.createImage));
adminProductsRouter.put("/:id/images/:imageId", asyncHandler(controller.updateImage));
adminProductsRouter.delete("/:id/images/:imageId", asyncHandler(controller.removeImage));
