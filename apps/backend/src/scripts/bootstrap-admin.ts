import "dotenv/config";
import { pool } from "../lib/db.js";

// Chạy 1 lần duy nhất để tạo admin đầu tiên — sau đó quản lý role hoàn toàn
// qua UI (apps/admin/staff). Không dùng migration hardcode email vì migration
// sẽ no-op nếu email đó chưa từng đăng ký (fresh DB, CI...).
//
// Cách dùng: đăng ký tài khoản thường qua storefront trước, rồi chạy:
//   npm run bootstrap-admin --workspace=apps/backend -- <email>
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Thiếu email. Dùng: bootstrap-admin <email>");
    process.exitCode = 1;
    return;
  }

  const { rows } = await pool.query(
    "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, email, role",
    [email]
  );

  if (rows.length === 0) {
    console.error(`Không tìm thấy user với email "${email}". Đăng ký tài khoản qua storefront trước rồi chạy lại.`);
    process.exitCode = 1;
    return;
  }

  console.log("Đã cấp quyền admin:", rows[0]);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
