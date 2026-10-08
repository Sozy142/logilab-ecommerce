import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import * as controller from "../controllers/products.controller.js";

export const productsRouter = Router();

productsRouter.get("/", asyncHandler(controller.list));
productsRouter.get("/featured", asyncHandler(controller.featured));
productsRouter.get("/best-sellers", asyncHandler(controller.bestSellers));
productsRouter.get("/developer", asyncHandler(controller.listDeveloper));
productsRouter.get("/by-category/:slug", asyncHandler(controller.listByCategory));
productsRouter.get("/:slug", asyncHandler(controller.getBySlug));
