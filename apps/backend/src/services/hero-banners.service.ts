import { z } from "zod";
import * as repo from "../repositories/hero-banners.repository.js";
import { notFound } from "../lib/app-error.js";

export async function listPublicBanners() {
  return repo.listActiveBanners();
}

// ---- Admin CRUD ----

export const bannerCreateSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().min(1).optional(),
  ctaLabel: z.string().min(1).optional(),
  ctaUrl: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  badgeText: z.string().min(1).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export const bannerUpdateSchema = bannerCreateSchema.partial();

export async function listBannersAdmin() {
  return repo.listAllBanners();
}

export async function getBannerAdmin(id: string) {
  const banner = await repo.getBannerById(id);
  if (!banner) throw notFound("Không tìm thấy banner");
  return banner;
}

export async function createBannerAdmin(input: z.infer<typeof bannerCreateSchema>) {
  return repo.createBanner(input);
}

export async function updateBannerAdmin(id: string, input: z.infer<typeof bannerUpdateSchema>) {
  const updated = await repo.updateBanner(id, input);
  if (!updated) throw notFound("Không tìm thấy banner");
  return updated;
}

export async function deleteBannerAdmin(id: string) {
  const ok = await repo.deleteBanner(id);
  if (!ok) throw notFound("Không tìm thấy banner");
}
