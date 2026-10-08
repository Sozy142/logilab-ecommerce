import type { Request, Response } from "express";
import * as heroBannersService from "../services/hero-banners.service.js";

export async function list(_req: Request, res: Response) {
  res.json({ banners: await heroBannersService.listBannersAdmin() });
}

export async function getById(req: Request, res: Response) {
  res.json(await heroBannersService.getBannerAdmin(req.params.id));
}

export async function create(req: Request, res: Response) {
  const input = heroBannersService.bannerCreateSchema.parse(req.body);
  res.status(201).json(await heroBannersService.createBannerAdmin(input));
}

export async function update(req: Request, res: Response) {
  const input = heroBannersService.bannerUpdateSchema.parse(req.body);
  res.json(await heroBannersService.updateBannerAdmin(req.params.id, input));
}

export async function remove(req: Request, res: Response) {
  await heroBannersService.deleteBannerAdmin(req.params.id);
  res.status(204).end();
}
