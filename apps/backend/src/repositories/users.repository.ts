import type { Role } from "@logilab/shared-types";
import { pool } from "../lib/db.js";

export type UserRow = { id: string; email: string; password_hash: string; created_at: string; role: Role };

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function createUser(email: string, passwordHash: string, role: Role = "customer"): Promise<UserRow> {
  const { rows } = await pool.query<UserRow>(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *",
    [email, passwordHash, role]
  );
  return rows[0];
}

export async function listUsers(): Promise<UserRow[]> {
  const { rows } = await pool.query<UserRow>("SELECT * FROM users ORDER BY created_at DESC");
  return rows;
}

export async function countAdmins(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM users WHERE role = 'admin'");
  return Number(rows[0].count);
}

export async function updateUserRole(id: string, role: Role): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING *",
    [role, id]
  );
  return rows[0] ?? null;
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<void> {
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
}
