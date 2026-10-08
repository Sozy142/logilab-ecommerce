import type { Request, Response } from "express";
import * as checkoutService from "../services/checkout.service.js";

export async function checkout(req: Request, res: Response) {
  const input = checkoutService.checkoutSchema.parse(req.body);
  const order = await checkoutService.checkout(req.userId!, input);
  res.status(201).json({ order });
}
