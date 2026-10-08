import { z } from "zod";
import bcrypt from "bcryptjs";
import type { Role } from "@logilab/shared-types";
import { badRequest, unauthorized } from "../lib/app-error.js";
import { signToken } from "../lib/jwt.js";
import * as usersRepo from "../repositories/users.repository.js";
import * as customersRepo from "../repositories/customers.repository.js";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  fullName: z.string().min(1).optional(),
  phone: z.string().min(8).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export async function signup(input: z.infer<typeof signupSchema>) {
  const existing = await usersRepo.getUserByEmail(input.email);
  if (existing) throw badRequest("Email đã được sử dụng");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await usersRepo.createUser(input.email, passwordHash);
  const customer = await customersRepo.upsertCustomer(user.id, input.fullName, input.phone);
  const token = signToken({ sub: user.id, email: user.email, role: user.role });

  return { user: { id: user.id, email: user.email, role: user.role }, customer, token };
}

export async function login(input: z.infer<typeof loginSchema>) {
  const user = await usersRepo.getUserByEmail(input.email);
  if (!user) throw unauthorized("Email hoặc mật khẩu không đúng");

  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) throw unauthorized("Email hoặc mật khẩu không đúng");

  const customer = await customersRepo.getCustomer(user.id);
  const token = signToken({ sub: user.id, email: user.email, role: user.role });

  return { user: { id: user.id, email: user.email, role: user.role }, customer, token };
}

export async function getProfile(userId: string, email: string | undefined, role: Role) {
  const customer = await customersRepo.getCustomer(userId);
  return { user: { id: userId, email, role }, customer };
}

export async function changePassword(userId: string, input: z.infer<typeof changePasswordSchema>) {
  const user = await usersRepo.getUserById(userId);
  if (!user) throw unauthorized();

  const valid = await bcrypt.compare(input.currentPassword, user.password_hash);
  if (!valid) throw badRequest("Mật khẩu hiện tại không đúng");

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await usersRepo.updateUserPassword(userId, passwordHash);
}
