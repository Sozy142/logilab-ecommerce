import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { loginRateLimit, signupRateLimit } from "../middleware/rate-limit.js";
import * as controller from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/signup", signupRateLimit, asyncHandler(controller.signup));
authRouter.post("/login", loginRateLimit, asyncHandler(controller.login));
authRouter.post("/logout", asyncHandler(controller.logout));
authRouter.get("/me", requireAuth, asyncHandler(controller.me));
authRouter.put("/password", requireAuth, asyncHandler(controller.changePassword));
