import type { Request, Response } from "express";
import * as ordersService from "../services/orders.service.js";

export async function list(req: Request, res: Response) {
  res.json({ orders: await ordersService.listMyOrders(req.userId!) });
}

export async function getById(req: Request, res: Response) {
  res.json(await ordersService.getMyOrderDetail(req.params.id, req.userId!));
}
