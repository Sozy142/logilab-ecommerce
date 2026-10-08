"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroBanner } from "@logilab/shared-types";
import { Button } from "@/components/ui/button";

const AUTOPLAY_MS = 6000;

// Banner quản lý qua trang admin (bảng hero_banners) thay vì viết cứng, để
// đổi nội dung không cần sửa code/deploy lại. Không dùng thư viện carousel
// ngoài — cùng chủ trương với components/product-carousel.tsx.
export function HeroCarousel({ banners, children }: { banners: HeroBanner[]; children?: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length, paused]);

  if (banners.length === 0) return null;

  const banner = banners[index % banners.length];

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
            {banner.headline}
          </h1>
          {banner.subheadline && (
            <p className="mt-5 max-w-lg text-sm text-neutral-500 sm:text-base">{banner.subheadline}</p>
          )}
          {banner.cta_label && banner.cta_url && (
            <div className="mt-8 flex items-center gap-4">
              <Button asChild className="h-12 rounded-full bg-neutral-950 px-8 text-sm font-semibold text-white hover:bg-neutral-800">
                <Link href={banner.cta_url}>
                  {banner.cta_label}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}

          {children}

          {banners.length > 1 && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-label={`Chuyển tới banner ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === index ? "w-6 bg-neutral-950" : "w-2 bg-neutral-300"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Banner trước"
                  onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
                  className="flex size-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Banner sau"
                  onClick={() => setIndex((i) => (i + 1) % banners.length)}
                  className="flex size-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative hidden aspect-square items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-orange-100 via-amber-50 to-neutral-100 sm:flex sm:aspect-[4/3] lg:aspect-square">
          {banner.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- ảnh admin dán URL ngoài, không qua next/image loader
            <img src={banner.image_url} alt={banner.headline} className="size-full object-cover" />
          ) : (
            <Boxes className="size-24 text-orange-400 sm:size-32" strokeWidth={1.25} />
          )}
          {banner.badge_text && (
            <span className="absolute right-6 top-6 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white sm:right-8 sm:top-8">
              {banner.badge_text}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
