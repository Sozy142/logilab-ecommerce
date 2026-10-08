import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as controller from "../controllers/admin-blog.controller.js";

export const adminBlogRouter = Router();

adminBlogRouter.use(requireAuth, requireRole("staff"));

adminBlogRouter.get("/", asyncHandler(controller.list));
adminBlogRouter.post("/", asyncHandler(controller.create));
adminBlogRouter.get("/:id", asyncHandler(controller.getById));
adminBlogRouter.put("/:id", asyncHandler(controller.update));
adminBlogRouter.delete("/:id", asyncHandler(controller.remove));
