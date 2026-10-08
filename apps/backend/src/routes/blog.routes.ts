import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import * as controller from "../controllers/blog.controller.js";

export const blogRouter = Router();

blogRouter.get("/", asyncHandler(controller.list));
blogRouter.get("/:slug", asyncHandler(controller.getBySlug));
