import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import * as controller from "../controllers/orders.controller.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);
ordersRouter.get("/", asyncHandler(controller.list));
ordersRouter.get("/:id", asyncHandler(controller.getById));
