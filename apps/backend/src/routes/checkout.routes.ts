import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import * as controller from "../controllers/checkout.controller.js";

export const checkoutRouter = Router();

checkoutRouter.post("/", requireAuth, asyncHandler(controller.checkout));
