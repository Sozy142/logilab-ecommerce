import { pool } from "../lib/db.js";

export type OrderRow = {
  id: string;
  customer_id: string;
  status: string;
  total: number;
  shipping_address: string;
  phone: string;
  created_at: string;
};

export type CheckoutItem = { variant_id: string; quantity: number };

export type OrderItemRow = {
  id: string;
  quantity: number;
  price: number;
  product_variants: {
    variant_name: string;
    products: { name: string; slug: string } | null;
  } | null;
};

export async function createOrder(
  customerId: string,
  shippingAddress: string,
  phone: string,
  items: CheckoutItem[]
): Promise<OrderRow> {
  // create_order() là hàm PL/pgSQL thuần (không phải riêng của Supabase) —
  // giữ nguyên logic transaction/khoá dòng, chỉ đổi cách gọi từ rpc() sang SQL.
  const { rows } = await pool.query<OrderRow>("SELECT * FROM create_order($1, $2, $3, $4)", [
    customerId,
    shippingAddress,
    phone,
    JSON.stringify(items),
  ]);
  return rows[0];
}

export async function listOrdersForCustomer(customerId: string): Promise<OrderRow[]> {
  const { rows } = await pool.query<OrderRow>(
    "SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC",
    [customerId]
  );
  return rows;
}

export async function getOrderById(id: string, customerId: string): Promise<OrderRow | null> {
  const { rows } = await pool.query<OrderRow>(
    "SELECT * FROM orders WHERE id = $1 AND customer_id = $2",
    [id, customerId]
  );
  return rows[0] ?? null;
}

export type AdminOrderRow = OrderRow & { customer_name: string | null; customer_email: string | null };

export async function listAllOrders(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: AdminOrderRow[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (params.status) {
    values.push(params.status);
    conditions.push(`o.status = $${values.length}`);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const pageSize = params.pageSize ?? 20;
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);

  const { rows } = await pool.query<AdminOrderRow & { total_count: string }>(
    `SELECT o.*, c.full_name AS customer_name, u.email AS customer_email, COUNT(*) OVER() AS total_count
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN users u ON u.id = o.customer_id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { items: rows.map(({ total_count, ...row }) => row), total };
}

export async function getOrderByIdAdmin(id: string): Promise<AdminOrderRow | null> {
  const { rows } = await pool.query<AdminOrderRow>(
    `SELECT o.*, c.full_name AS customer_name, u.email AS customer_email
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN users u ON u.id = o.customer_id
     WHERE o.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateOrderStatus(id: string, status: string): Promise<OrderRow | null> {
  const { rows } = await pool.query<OrderRow>(
    "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return rows[0] ?? null;
}

export async function getOrderItems(orderId: string): Promise<OrderItemRow[]> {
  // Thay cho .select("...product_variants(variant_name, products(name, slug))")
  // của supabase-js (embed tự động qua FK) — JOIN tay rồi tự dựng lại đúng
  // shape lồng nhau mà frontend đang đọc (giữ nguyên contract, không sửa FE).
  const { rows } = await pool.query<{
    id: string;
    quantity: number;
    price: number;
    variant_name: string | null;
    product_name: string | null;
    product_slug: string | null;
  }>(
    `SELECT oi.id, oi.quantity, oi.price,
            pv.variant_name,
            p.name AS product_name, p.slug AS product_slug
     FROM order_items oi
     LEFT JOIN product_variants pv ON pv.id = oi.variant_id
     LEFT JOIN products p ON p.id = pv.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  return rows.map((row) => ({
    id: row.id,
    quantity: row.quantity,
    price: row.price,
    product_variants: row.variant_name
      ? {
          variant_name: row.variant_name,
          products: row.product_name && row.product_slug ? { name: row.product_name, slug: row.product_slug } : null,
        }
      : null,
  }));
}
