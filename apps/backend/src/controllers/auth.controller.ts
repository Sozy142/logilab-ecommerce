import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { env } from "../lib/env.js";
import { TOKEN_EXPIRES_IN_SECONDS } from "../lib/jwt.js";
import { unauthorized } from "../lib/app-error.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  // env.cookieSecure bật qua COOKIE_SECURE=true khi đứng sau HTTPS (Caddy).
  // Local dev không set biến này nên mặc định false (vẫn HTTP).
  secure: env.cookieSecure,
  path: "/",
};

export async function signup(req: Request, res: Response) {
  const input = authService.signupSchema.parse(req.body);
  const result = await authService.signup(input);
  res.cookie(env.cookieName, result.token, { ...cookieOptions, maxAge: TOKEN_EXPIRES_IN_SECONDS * 1000 });
  res.status(201).json({ user: result.user, customer: result.customer });
}

export async function login(req: Request, res: Response) {
  const input = authService.loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.cookie(env.cookieName, result.token, { ...cookieOptions, maxAge: TOKEN_EXPIRES_IN_SECONDS * 1000 });
  res.json({ user: result.user, customer: result.customer });
}

export async function logout(_req: Request, res: Response) {
  // JWT tự ký là stateless — không có gì để revoke phía server, chỉ cần xoá
  // cookie phía client là đủ (khác trước: GoTrue cần gọi API revoke token).
  res.clearCookie(env.cookieName, { path: "/" });
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  if (!req.userId) throw unauthorized();
  res.json(await authService.getProfile(req.userId, req.userEmail, req.userRole!));
}

export async function changePassword(req: Request, res: Response) {
  if (!req.userId) throw unauthorized();
  const input = authService.changePasswordSchema.parse(req.body);
  await authService.changePassword(req.userId, input);
  res.status(204).end();
}
