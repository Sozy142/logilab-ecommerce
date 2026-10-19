import Link from "next/link";
import {
  Headset,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { ProductCarousel } from "@/components/product-carousel";
import { HeroCarousel } from "@/components/hero-carousel";
import { Testimonials } from "@/components/testimonials";
import { ExploreByScenario } from "@/components/explore-by-scenario";
import { BrowseByNeed } from "@/components/browse-by-need";
import type { HeroBanner, Product } from "@logilab/shared-types";

const STATS = [
  { value: "200+", label: "Sản phẩm" },
  { value: "2000+", label: "Khách hàng" },
  { value: "15+", label: "Hãng phân phối" },
];

const BRANDS = ["ESPRESSIF", "RASPBERRY PI", "ARDUINO", "STMICROELECTRONICS", "XIAOMI"];

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Chính hãng, đầy đủ datasheet",
    description: "Linh kiện có nguồn gốc rõ ràng, kèm tài liệu kỹ thuật chi tiết.",
  },
  {
    icon: Truck,
    title: "Giao nhanh toàn quốc",
    description: "Đóng gói chống tĩnh điện, giao trong 24-48h tại các thành phố lớn.",
  },
  {
    icon: Headset,
    title: "Hỗ trợ kỹ thuật",
    description: "Đội ngũ kỹ sư tư vấn chọn linh kiện, hỗ trợ debug khi cần.",
  },
  {
    icon: RotateCcw,
    title: "Đổi trả trong 7 ngày",
    description: "Đổi trả miễn phí nếu sản phẩm lỗi do nhà sản xuất.",
  },
];

export default async function Home() {
  // "Bán chạy" chưa có dữ liệu đơn hàng thật để tính số lượng bán thực tế,
  // nên backend lấy theo giá thấp trước (proxy hợp lý, và khác hẳn "nổi bật"
  // giá cao trước thay vì trùng lặp danh sách).
  const [{ items: products }, { items: bestSellers }, { items: banners }] = await Promise.all([
    apiFetch<{ items: Product[] }>("/products/featured"),
    apiFetch<{ items: Product[] }>("/products/best-sellers"),
    apiFetch<{ items: HeroBanner[] }>("/hero-banners"),
  ]);

  return (
    <main>
      {/* BANNER THÔNG BÁO */}
      <div className="bg-neutral-950 px-4 py-2.5 text-center text-xs font-medium text-white">
        <span className="inline-flex items-center gap-2">
          <Truck className="size-3.5" />
          Miễn phí vận chuyển cho đơn từ 500.000đ
        </span>
      </div>

      {/* HERO */}
      <HeroCarousel banners={banners}>
        <div className="mt-10 hidden grid-cols-3 gap-4 border-t border-neutral-200 pt-8 sm:grid sm:gap-6">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-extrabold text-neutral-950 sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-neutral-500 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </HeroCarousel>

      {/* DẢI THƯƠNG HIỆU */}
      <div className="bg-neutral-950">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-5 sm:justify-between sm:px-6 sm:py-6">
          {BRANDS.map((brand) => (
            <span
              key={brand}
              className="text-sm font-semibold tracking-widest text-white sm:text-base"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>

      {/* VÌ SAO CHỌN LOGILAB */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:pt-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {VALUE_PROPS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <div className="flex size-11 items-center justify-center self-center rounded-xl bg-neutral-950 text-white sm:size-12 sm:self-start">
                <item.icon className="size-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-bold text-neutral-950">{item.title}</h3>
              <p className="text-xs leading-relaxed text-neutral-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SẢN PHẨM NỔI BẬT */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 sm:mb-14">
          <h2 className="text-center text-[32px] font-extrabold uppercase tracking-tight text-neutral-950 sm:text-5xl">
            Sản phẩm nổi bật 456
          </h2>
        </div>

        {products && products.length > 0 ? (
          <ProductCarousel products={products} />
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-sm font-medium text-neutral-400">
            Chưa có sản phẩm nào trong Database.
          </div>
        )}

        {products && products.length > 0 && (
          <div className="mt-10 text-center sm:mt-14">
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-neutral-200 px-12 text-sm font-semibold text-neutral-950 hover:bg-neutral-950 hover:text-white"
            >
              <Link href="/products">Xem tất cả</Link>
            </Button>
          </div>
        )}
      </section>

      {/* KHÁM PHÁ THEO KỊCH BẢN */}
      <ExploreByScenario />

      {/* SẢN PHẨM BÁN CHẠY */}
      {bestSellers && bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-8 sm:mb-14">
            <h2 className="text-center text-[32px] font-extrabold uppercase tracking-tight text-neutral-950 sm:text-5xl">
              Sản phẩm bán chạy
            </h2>
          </div>
          <ProductCarousel products={bestSellers} />
        </section>
      )}

      {/* KHÁM PHÁ THEO NHU CẦU */}
      <BrowseByNeed />

      {/* TESTIMONIALS */}
      <Testimonials />
    </main>
  );
}
