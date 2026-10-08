"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEVELOPER_CATEGORY_SLUGS, type CategoryNode } from "@/lib/categories-shared";
import { selectTotalQuantity, useCartStore } from "@/lib/cart-store";
import { useMounted } from "@/lib/use-mounted";
import { HeaderSearch } from "@/components/layout/header-search";
import { getMe } from "@/lib/auth-client";

export function Header({
  categories,
  devBoardBrands,
}: {
  categories: CategoryNode[];
  devBoardBrands: { name: string; slug: string }[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [hoveredDevCategory, setHoveredDevCategory] = useState<string | null>(null);

  const developerCategories = categories.filter((c) => DEVELOPER_CATEGORY_SLUGS.includes(c.slug));
  const otherCategories = categories.filter((c) => !DEVELOPER_CATEGORY_SLUGS.includes(c.slug));

  // Cart is persisted to localStorage — only read it after mount to keep
  // the first client render in sync with the server-rendered HTML.
  const mounted = useMounted();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = mounted ? selectTotalQuantity(cartItems) : 0;

  // Header là component dùng chung trong layout, không bị remount khi
  // điều hướng client-side — phải theo dõi pathname để re-check trạng thái
  // đăng nhập mỗi khi chuyển trang (vd sau khi login/logout redirect).
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    getMe()
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-black/5 bg-white/80 backdrop-blur-xl shadow-sm"
          : "border-transparent bg-white"
      )}
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 sm:px-6 md:flex xl:gap-6">
        {/* Mobile menu button — cột trái. Dưới md dùng grid 3 vùng đều nhau
            (trái/giữa/phải) để logo luôn canh đúng giữa màn hình bất kể 2 bên
            rộng khác nhau; từ md trở lên quay lại flex thường và ẩn hẳn từ lg
            (đã có nav đầy đủ thay thế). */}
        <div className="justify-self-start lg:hidden">
          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex size-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="justify-self-center text-xl font-extrabold uppercase tracking-tight text-neutral-950 sm:text-2xl"
        >
          LOGILAB
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {developerCategories.length > 0 && (
            <div
              className="group relative h-16 flex items-center"
              onMouseLeave={() => setHoveredDevCategory(null)}
            >
              <Link
                href="/developer"
                className="flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 xl:px-4"
              >
                Developer
                <ChevronDown className="size-3.5 text-neutral-400 transition-transform duration-200 group-hover:rotate-180 group-hover:text-neutral-700" />
              </Link>

              <div className="invisible absolute left-0 top-full -translate-y-1 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="flex rounded-2xl border border-black/5 bg-white p-2 shadow-xl">
                  <ul className="flex w-52 flex-col gap-0.5 p-2">
                    {developerCategories.map((category) => (
                      <li key={category.id} onMouseEnter={() => setHoveredDevCategory(category.id)}>
                        <Link
                          href={`/categories/${category.slug}`}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            hoveredDevCategory === category.id
                              ? "bg-neutral-100 text-neutral-950"
                              : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                          )}
                        >
                          {category.name}
                          {category.children.length > 0 && (
                            <ChevronRight className="size-3.5 text-neutral-400" />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {(() => {
                    const active = developerCategories.find(
                      (c) => c.id === hoveredDevCategory && c.children.length > 0
                    );
                    if (!active) return null;

                    // Dev Board có 2 chiều duyệt song song: theo loại chip
                    // (đã có sẵn children) và theo hãng sản xuất — hiện 2
                    // cột riêng để người dùng chọn theo cái nào tiện hơn.
                    if (active.slug === "dev-board" && devBoardBrands.length > 0) {
                      return (
                        <div className="flex border-l border-neutral-100 p-5">
                          <div className="min-w-[170px]">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                              Loại
                            </span>
                            <ul className="mt-4 flex flex-col items-start gap-3">
                              {active.children.map((child) => (
                                <li key={child.id}>
                                  <Link
                                    href={`/categories/${active.slug}?category=${child.slug}`}
                                    className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-950"
                                  >
                                    {child.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Khoảng trắng rộng giữa 2 cột, tách biệt hẳn
                              khỏi đường kẻ — để mắt có chỗ nghỉ thay vì 2
                              cột dính sát đường kẻ trông rối. */}
                          <div className="mx-8 w-px shrink-0 bg-neutral-100" />

                          <div className="min-w-[140px]">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                              Hãng
                            </span>
                            <ul className="mt-4 flex flex-col items-start gap-3">
                              {devBoardBrands.map((brand) => (
                                <li key={brand.slug}>
                                  <Link
                                    href={`/categories/${active.slug}?brand=${brand.slug}`}
                                    className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-950"
                                  >
                                    {brand.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="w-56 border-l border-neutral-100 p-5">
                        <ul className="flex flex-col items-start gap-3">
                          {active.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/categories/${active.slug}?category=${child.slug}`}
                                className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-950"
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {otherCategories.map((category) => (
            <div key={category.id} className="group relative h-16 flex items-center">
              <Link
                href={`/categories/${category.slug}`}
                className="flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 xl:px-4"
              >
                {category.name}
                {category.children.length > 0 && (
                  <ChevronDown className="size-3.5 text-neutral-400 transition-transform duration-200 group-hover:rotate-180 group-hover:text-neutral-700" />
                )}
              </Link>

              {category.children.length > 0 && (
                <div className="invisible absolute left-0 top-full -translate-y-1 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="min-w-[260px] rounded-2xl border border-black/5 bg-white p-6 shadow-xl">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      {category.name}
                    </span>
                    <ul className="mt-4 flex flex-col items-start gap-3">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/categories/${child.slug}`}
                            className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-950"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}

          <Link
            href="/blog"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 xl:px-4"
          >
            Blog
            <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              Mới
            </span>
          </Link>
        </nav>

        {/* Search */}
        <HeaderSearch className="hidden md:block md:min-w-[220px] md:max-w-sm md:flex-1" />

        {/* Right icons */}
        <div className="flex items-center gap-1 justify-self-end">
          <Link
            href="/search"
            aria-label="Tìm kiếm"
            className="flex size-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 md:hidden"
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            className="relative flex size-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-bold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            aria-label={isLoggedIn ? "Tài khoản" : "Đăng nhập"}
            className="flex size-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
          >
            <User className="size-5" />
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden border-t border-black/5 bg-white transition-[max-height] duration-300 ease-in-out",
          mobileOpen ? "max-h-[80vh] overflow-y-auto" : "max-h-0"
        )}
      >
        <HeaderSearch className="px-4 pt-4 md:hidden" onNavigate={() => setMobileOpen(false)} />
        <nav className="flex flex-col gap-1 px-4 py-4">
          {developerCategories.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <Link
                  href="/developer"
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-base font-medium text-neutral-900"
                >
                  Developer
                </Link>
                <button
                  type="button"
                  aria-label="Mở danh mục Developer"
                  onClick={() => setMobileExpanded((cur) => (cur === "developer" ? null : "developer"))}
                  className="flex size-9 items-center justify-center text-neutral-500"
                >
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      mobileExpanded === "developer" && "rotate-180"
                    )}
                  />
                </button>
              </div>
              <div
                className={cn(
                  "grid overflow-hidden transition-all duration-200",
                  mobileExpanded === "developer" ? "grid-rows-[1fr] pb-3 opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="flex flex-col gap-1 overflow-hidden pl-2">
                  {developerCategories.map((category) =>
                    category.children.length > 0 ? (
                      <div key={category.id} className="py-1">
                        <Link
                          href={`/categories/${category.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm font-semibold text-neutral-900"
                        >
                          {category.name}
                        </Link>
                        <div className="flex flex-col gap-1 pl-3">
                          {category.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/categories/${category.slug}?category=${child.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                      >
                        {category.name}
                      </Link>
                    )
                  )}
                </div>
              </div>
              <div className="border-b border-black/5" />
            </div>
          )}

          {otherCategories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center justify-between">
                <Link
                  href={`/categories/${category.slug}`}
                  className="block py-3 text-base font-medium text-neutral-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {category.name}
                </Link>
                {category.children.length > 0 && (
                  <button
                    type="button"
                    aria-label={`Mở danh mục ${category.name}`}
                    onClick={() =>
                      setMobileExpanded((cur) =>
                        cur === category.id ? null : category.id
                      )
                    }
                    className="flex size-9 items-center justify-center text-neutral-500"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        mobileExpanded === category.id && "rotate-180"
                      )}
                    />
                  </button>
                )}
              </div>
              {category.children.length > 0 && (
                <div
                  className={cn(
                    "grid overflow-hidden transition-all duration-200",
                    mobileExpanded === category.id
                      ? "grid-rows-[1fr] pb-3 opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="flex flex-col gap-1 overflow-hidden pl-2">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-b border-black/5 last:border-0" />
            </div>
          ))}

          <Link
            href="/blog"
            className="flex items-center gap-1.5 py-3 text-base font-medium text-neutral-900"
            onClick={() => setMobileOpen(false)}
          >
            Blog
            <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              Mới
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
