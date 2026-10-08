import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import * as controller from "../controllers/addresses.controller.js";

export const addressesRouter = Router();

addressesRouter.use(requireAuth);
addressesRouter.get("/", asyncHandler(controller.list));
addressesRouter.post("/", asyncHandler(controller.create));
addressesRouter.put("/:id", asyncHandler(controller.update));
addressesRouter.delete("/:id", asyncHandler(controller.remove));
