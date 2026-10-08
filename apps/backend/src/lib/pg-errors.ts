// Vài FK trong schema là RESTRICT (không CASCADE): order_items.variant_id,
// categories.parent_id, products.category_id — xoá bản ghi đang bị tham
// chiếu sẽ throw lỗi Postgres 23503 (foreign_key_violation). Helper này để
// mọi hàm delete/update bắt đúng lỗi đó và biến thành conflict() (409) thay
// vì rơi xuống lỗi 500 chung chung.
export function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "23503";
}

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "23505";
}
