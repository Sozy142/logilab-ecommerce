import type { Request, Response } from "express";
import * as addressesService from "../services/addresses.service.js";

export async function list(req: Request, res: Response) {
  res.json({ addresses: await addressesService.list(req.userId!) });
}

export async function create(req: Request, res: Response) {
  const input = addressesService.addressSchema.parse(req.body);
  res.status(201).json(await addressesService.create(req.userId!, input));
}

export async function update(req: Request, res: Response) {
  const input = addressesService.addressUpdateSchema.parse(req.body);
  res.json(await addressesService.update(req.params.id, req.userId!, input));
}

export async function remove(req: Request, res: Response) {
  await addressesService.remove(req.params.id, req.userId!);
  res.status(204).end();
}
