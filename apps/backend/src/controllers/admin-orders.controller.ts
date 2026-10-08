import type { Request, Response } from "express";
import * as ordersService from "../services/orders.service.js";

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function list(req: Request, res: Response) {
  res.json(await ordersService.listOrdersAdmin(asString(req.query.status), asString(req.query.page)));
}

export async function getById(req: Request, res: Response) {
  res.json(await ordersService.getOrderDetailAdmin(req.params.id));
}

export async function updateStatus(req: Request, res: Response) {
  const { status } = ordersService.orderStatusSchema.parse(req.body);
  res.json(await ordersService.updateOrderStatusAdmin(req.params.id, status));
}
