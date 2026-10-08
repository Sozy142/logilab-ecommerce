import { pool } from "../lib/db.js";

export type Customer = { id: string; full_name: string | null; phone: string | null; created_at: string };

export async function upsertCustomer(id: string, fullName?: string, phone?: string): Promise<Customer> {
  const { rows } = await pool.query<Customer>(
    `INSERT INTO customers (id, full_name, phone) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone
     RETURNING *`,
    [id, fullName ?? null, phone ?? null]
  );
  return rows[0];
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { rows } = await pool.query<Customer>("SELECT * FROM customers WHERE id = $1", [id]);
  return rows[0] ?? null;
}
