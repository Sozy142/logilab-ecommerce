import type { Request, Response } from "express";
import * as heroBannersService from "../services/hero-banners.service.js";

export async function list(_req: Request, res: Response) {
  res.json({ items: await heroBannersService.listPublicBanners() });
}
