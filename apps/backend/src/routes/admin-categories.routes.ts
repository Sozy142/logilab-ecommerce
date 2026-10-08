import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as controller from "../controllers/admin-categories.controller.js";

export const adminCategoriesRouter = Router();

adminCategoriesRouter.use(requireAuth, requireRole("staff"));

adminCategoriesRouter.get("/", asyncHandler(controller.list));
adminCategoriesRouter.post("/", asyncHandler(controller.create));
adminCategoriesRouter.put("/:id", asyncHandler(controller.update));
adminCategoriesRouter.delete("/:id", asyncHandler(controller.remove));
