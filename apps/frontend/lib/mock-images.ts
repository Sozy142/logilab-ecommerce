// Ảnh placeholder chủ đề linh kiện điện tử, dùng khi product_images chưa đủ ảnh để demo gallery.
const MOCK_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1610812387871-806d3db9f5aa?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1591405351990-4726e331f141?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1621136429581-bf0890d5ac22?w=600&h=600&fit=crop",
];

export type GalleryImage = { id: string; image_url: string };

export function withMockGallery(
  images: GalleryImage[],
  productId: string,
  minCount = 4
): GalleryImage[] {
  if (images.length >= minCount) return images;

  const existingUrls = new Set(images.map((img) => img.image_url));
  const result = [...images];

  let offset = 0;
  for (let i = 0; i < productId.length; i++) offset += productId.charCodeAt(i);

  for (let i = 0; result.length < minCount && i < MOCK_GALLERY_IMAGES.length; i++) {
    const url = MOCK_GALLERY_IMAGES[(offset + i) % MOCK_GALLERY_IMAGES.length];
    if (existingUrls.has(url)) continue;
    existingUrls.add(url);
    result.push({ id: `mock-${productId}-${i}`, image_url: url });
  }

  return result;
}
