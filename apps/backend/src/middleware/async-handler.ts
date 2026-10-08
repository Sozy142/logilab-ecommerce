import type { NextFunction, Request, Response } from "express";

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express 4 không tự bắt lỗi từ async handler — bọc lại để lỗi luôn rơi vào
// error-handler.ts thay vì làm crash process hoặc treo request.
export function asyncHandler(fn: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
