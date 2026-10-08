import { pool } from "../lib/db.js";

export type HeroBannerRow = {
  id: string;
  headline: string;
  subheadline: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string | null;
  badge_text: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export async function listActiveBanners(): Promise<HeroBannerRow[]> {
  const { rows } = await pool.query<HeroBannerRow>(
    "SELECT * FROM hero_banners WHERE is_active = true ORDER BY display_order"
  );
  return rows;
}

export async function listAllBanners(): Promise<HeroBannerRow[]> {
  const { rows } = await pool.query<HeroBannerRow>(
    "SELECT * FROM hero_banners ORDER BY display_order"
  );
  return rows;
}

export async function getBannerById(id: string): Promise<HeroBannerRow | null> {
  const { rows } = await pool.query<HeroBannerRow>("SELECT * FROM hero_banners WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export type HeroBannerInput = {
  headline: string;
  subheadline?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  badgeText?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

export async function createBanner(input: HeroBannerInput): Promise<HeroBannerRow> {
  const { rows } = await pool.query<HeroBannerRow>(
    `INSERT INTO hero_banners (headline, subheadline, cta_label, cta_url, image_url, badge_text, display_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      input.headline,
      input.subheadline ?? null,
      input.ctaLabel ?? null,
      input.ctaUrl ?? null,
      input.imageUrl ?? null,
      input.badgeText ?? null,
      input.displayOrder ?? 0,
      input.isActive ?? true,
    ]
  );
  return rows[0];
}

const HERO_BANNER_COLUMNS: Record<keyof HeroBannerInput, string> = {
  headline: "headline",
  subheadline: "subheadline",
  ctaLabel: "cta_label",
  ctaUrl: "cta_url",
  imageUrl: "image_url",
  badgeText: "badge_text",
  displayOrder: "display_order",
  isActive: "is_active",
};

export async function updateBanner(id: string, input: Partial<HeroBannerInput>): Promise<HeroBannerRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(HERO_BANNER_COLUMNS) as [keyof HeroBannerInput, string][]) {
    if (input[key] === undefined) continue;
    values.push(input[key]);
    sets.push(`${column} = $${values.length}`);
  }
  if (sets.length === 0) return getBannerById(id);

  values.push(id);
  const { rows } = await pool.query<HeroBannerRow>(
    `UPDATE hero_banners SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteBanner(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM hero_banners WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
