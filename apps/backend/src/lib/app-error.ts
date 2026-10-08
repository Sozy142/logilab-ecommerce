export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notFound = (message = "Không tìm thấy") => new AppError(404, "not_found", message);
export const badRequest = (message = "Yêu cầu không hợp lệ") => new AppError(400, "bad_request", message);
export const unauthorized = (message = "Chưa đăng nhập") => new AppError(401, "unauthorized", message);
export const forbidden = (message = "Không có quyền") => new AppError(403, "forbidden", message);
export const conflict = (message = "Dữ liệu xung đột") => new AppError(409, "conflict", message);
