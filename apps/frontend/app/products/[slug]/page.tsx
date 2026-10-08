import { notFound } from "next/navigation";
import { apiFetchOrNull } from "@/lib/api-client";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProductDetail } from "@/components/product-detail";
import { ProductCarousel } from "@/components/product-carousel";
import { ProductTabs } from "@/components/product-tabs";
import { withMockGallery } from "@/lib/mock-images";
import type { ProductDetailResponse } from "@logilab/shared-types";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const detail = await apiFetchOrNull<ProductDetailResponse>(`/products/${slug}`);
  if (!detail) notFound();
  const { product, category, related } = detail;

  const sortedImages = [...(product.product_images ?? [])].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  const images = withMockGallery(sortedImages, product.id);
  const variants = [...(product.product_variants ?? [])].sort(
    (a, b) => Number(a.price) - Number(b.price)
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          ...(category ? [{ label: category.name, href: `/categories/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6">
        <ProductDetail product={product} images={images} variants={variants} />
      </div>

      <section className="mt-12">
        <ProductTabs
          description={product.description}
          specs={product.specs ?? []}
          productId={product.id}
          datasheetUrl={product.datasheet_url}
          libraryUrl={product.library_url}
        />
      </section>

      {related && related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-extrabold tracking-tight text-neutral-950">Sản phẩm liên quan</h2>
          <ProductCarousel products={related} />
        </section>
      )}
    </main>
  );
}
