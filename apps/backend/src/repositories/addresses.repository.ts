import { pool } from "../lib/db.js";

export type AddressRow = {
  id: string;
  customer_id: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  is_default: boolean;
};

export type AddressInput = {
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  isDefault?: boolean;
};

export async function listAddresses(customerId: string): Promise<AddressRow[]> {
  const { rows } = await pool.query<AddressRow>(
    "SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC",
    [customerId]
  );
  return rows;
}

export async function createAddress(customerId: string, input: AddressInput): Promise<AddressRow> {
  const { rows } = await pool.query<AddressRow>(
    `INSERT INTO customer_addresses (customer_id, recipient_name, phone, address_line, city, is_default)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [customerId, input.recipientName, input.phone, input.addressLine, input.city, input.isDefault ?? false]
  );
  return rows[0];
}

export async function updateAddress(id: string, customerId: string, input: Partial<AddressInput>): Promise<AddressRow | null> {
  const columns: Record<keyof AddressInput, string> = {
    recipientName: "recipient_name",
    phone: "phone",
    addressLine: "address_line",
    city: "city",
    isDefault: "is_default",
  };

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(columns) as [keyof AddressInput, string][]) {
    if (input[key] === undefined) continue;
    values.push(input[key]);
    sets.push(`${column} = $${values.length}`);
  }
  if (sets.length === 0) return getAddress(id, customerId);

  values.push(id, customerId);
  const { rows } = await pool.query<AddressRow>(
    `UPDATE customer_addresses SET ${sets.join(", ")}
     WHERE id = $${values.length - 1} AND customer_id = $${values.length}
     RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

async function getAddress(id: string, customerId: string): Promise<AddressRow | null> {
  const { rows } = await pool.query<AddressRow>(
    "SELECT * FROM customer_addresses WHERE id = $1 AND customer_id = $2",
    [id, customerId]
  );
  return rows[0] ?? null;
}

export async function deleteAddress(id: string, customerId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2",
    [id, customerId]
  );
  return (rowCount ?? 0) > 0;
}
