export type Role = "customer" | "staff" | "admin";

export type Customer = { id: string; full_name: string | null; phone: string | null };
export type MeResponse = { user: { id: string; email?: string; role: Role }; customer: Customer | null };

export type ProductSpec = { label: string; value: string };

export type Variant = {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string;
  price: number;
  stock: number;
};

export type ProductImage = { id: string; product_id: string; image_url: string; display_order: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  brand: string | null;
  specs: ProductSpec[] | null;
  datasheet_url: string | null;
  library_url: string | null;
  created_at: string;
  cheapest_price: number | null;
  total_stock: number;
  product_variants: Variant[];
  product_images: ProductImage[];
};

export type Brand = { name: string; slug: string };
// Dùng riêng cho sidebar filter sản phẩm (kèm số lượng khớp) — dropdown hãng
// ở header (getDevBoardBrands) không cần đếm nên vẫn dùng Brand thường.
export type BrandFacet = Brand & { count: number };

export type HeroBanner = {
  id: string;
  headline: string;
  subheadline: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string | null;
  badge_text: string | null;
  display_order: number;
  is_active: boolean;
};

export type CategoryNode = { id: string; name: string; slug: string; children: CategoryNode[] };

export type CategoryDetail = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent: { name: string; slug: string } | null;
  // Đệ quy (không chỉ con trực tiếp) để sidebar filter hiện được phân cấp
  // đầy đủ bên dưới danh mục hiện tại.
  children: CategoryNode[];
  descendantCategoryIds: string[];
};

type ProductListCore = {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
};

// Số lượng sản phẩm khớp mỗi lựa chọn filter (tính theo các filter KHÁC đang
// áp dụng) — hiện "Arduino (12)" trong sidebar. categoryCounts khoá theo
// category id (khớp với CategoryNode/CategoryDetail.children[].id).
export type FilterFacets = {
  categoryCounts: Record<string, number>;
  priceBucketCounts: Record<string, number>;
};

export type ProductListResponse = ProductListCore & { brands: BrandFacet[] } & FilterFacets;

export type CategoryProductListResponse = ProductListResponse & { category: CategoryDetail };

// Trước đây /products/developer không có filter hãng riêng — giờ dùng chung
// ProductFilterPanel với 2 trang kia nên cũng cần brands + facet counts.
export type DeveloperProductListResponse = ProductListCore & {
  devCategories: CategoryNode[];
  activeCategory: { id: string; name: string; slug: string } | null;
  brands: BrandFacet[];
} & FilterFacets;

export type SearchResponse = { items: Product[]; total: number; page: number; totalPages: number };

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  tag: string;
  author_name: string;
  read_minutes: number;
  published_at: string;
};

export type BlogListResponse = { posts: BlogPost[]; featured: BlogPost | null; tags: string[] };
export type BlogDetailResponse = { post: BlogPost; related: BlogPost[] };

export type ProductDetailResponse = {
  product: Product;
  category: { id: string; name: string; slug: string } | null;
  related: Product[];
};
