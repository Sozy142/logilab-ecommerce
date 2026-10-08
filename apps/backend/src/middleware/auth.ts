import type { NextFunction, Request, Response } from "express";
import type { Role } from "@logilab/shared-types";
import { verifyToken } from "../lib/jwt.js";
import { forbidden, unauthorized } from "../lib/app-error.js";
import { env } from "../lib/env.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: Role;
    }
  }
}

const ROLE_RANK: Record<Role, number> = { customer: 0, staff: 1, admin: 2 };

// Dùng sau requireAuth (route.use(requireAuth) rồi route.use(requireRole(...)))
// — requireAuth đã lo phần 401 (chưa đăng nhập), requireRole chỉ cần lo 403
// (đăng nhập rồi nhưng không đủ quyền). Rank-based nên admin tự thoả mọi
// requireRole("staff") mà không cần liệt kê "admin" ở từng route.
export function requireRole(minRole: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userRole || ROLE_RANK[req.userRole] < ROLE_RANK[minRole]) return next(forbidden());
    next();
  };
}

function tokenFromRequest(req: Request): string | undefined {
  const cookieToken = req.cookies?.[env.cookieName];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return undefined;
}

// Bắt buộc đăng nhập — dùng cho /checkout, /orders, /addresses.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = tokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return next(unauthorized());
  req.userId = payload.sub;
  req.userEmail = payload.email;
  req.userRole = payload.role;
  next();
}

// Không bắt buộc — gắn userId nếu có token hợp lệ, không lỗi nếu không có.
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = tokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;
  if (payload) {
    req.userId = payload.sub;
    req.userEmail = payload.email;
    req.userRole = payload.role;
  }
  next();
}
