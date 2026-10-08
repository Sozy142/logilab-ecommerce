import { z } from "zod";
import bcrypt from "bcryptjs";
import * as usersRepo from "../repositories/users.repository.js";
import { badRequest, conflict, notFound } from "../lib/app-error.js";

export const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  role: z.enum(["staff", "admin"]),
});

export const updateRoleSchema = z.object({ role: z.enum(["customer", "staff", "admin"]) });

export async function listUsersAdmin() {
  const users = await usersRepo.listUsers();
  return users.map(({ password_hash, ...rest }) => rest);
}

export async function createStaffAccount(input: z.infer<typeof createStaffSchema>) {
  const existing = await usersRepo.getUserByEmail(input.email);
  if (existing) throw badRequest("Email đã được sử dụng");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await usersRepo.createUser(input.email, passwordHash, input.role);
  const { password_hash, ...rest } = user;
  return rest;
}

export async function updateUserRole(targetId: string, role: z.infer<typeof updateRoleSchema>["role"]) {
  const target = await usersRepo.getUserById(targetId);
  if (!target) throw notFound("Không tìm thấy người dùng");

  if (target.role === "admin" && role !== "admin") {
    const adminCount = await usersRepo.countAdmins();
    if (adminCount <= 1) throw conflict("Không thể hạ quyền admin cuối cùng");
  }

  const updated = await usersRepo.updateUserRole(targetId, role);
  if (!updated) throw notFound("Không tìm thấy người dùng");
  const { password_hash, ...rest } = updated;
  return rest;
}
