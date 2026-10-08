import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as controller from "../controllers/admin-users.controller.js";

export const adminUsersRouter = Router();

// Quản lý nhân sự/quyền hạn chặt hơn các resource khác — chỉ admin, không
// phải staff.
adminUsersRouter.use(requireAuth, requireRole("admin"));

adminUsersRouter.get("/", asyncHandler(controller.list));
adminUsersRouter.post("/", asyncHandler(controller.create));
adminUsersRouter.put("/:id/role", asyncHandler(controller.updateRole));
