import jwt from "jsonwebtoken";
import type { Role } from "@logilab/shared-types";
import { env } from "./env.js";

export const TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7; // 7 ngày

export type TokenPayload = { sub: string; email: string; role: Role };

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_EXPIRES_IN_SECONDS });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
}
