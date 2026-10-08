import pg from "pg";
import { env } from "./env.js";

// Pool duy nhất dùng chung cho mọi query — không còn phân biệt
// admin/anon client như trước (không còn RLS để phân quyền theo key nữa,
// mọi kiểm tra quyền sở hữu nằm ở service layer).
export const pool = new pg.Pool({ connectionString: env.databaseUrl });
