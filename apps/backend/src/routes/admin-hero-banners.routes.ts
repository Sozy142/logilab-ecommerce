import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as controller from "../controllers/admin-hero-banners.controller.js";

export const adminHeroBannersRouter = Router();

adminHeroBannersRouter.use(requireAuth, requireRole("staff"));

adminHeroBannersRouter.get("/", asyncHandler(controller.list));
adminHeroBannersRouter.post("/", asyncHandler(controller.create));
adminHeroBannersRouter.get("/:id", asyncHandler(controller.getById));
adminHeroBannersRouter.put("/:id", asyncHandler(controller.update));
adminHeroBannersRouter.delete("/:id", asyncHandler(controller.remove));
