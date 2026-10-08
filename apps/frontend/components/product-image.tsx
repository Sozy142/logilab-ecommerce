"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Ảnh sản phẩm lấy từ URL ngoài (Shopify CDN...) hoặc admin tự paste — domain
// không cố định nên dùng `unoptimized` thay vì khai báo remotePatterns (không
// có danh sách domain cố định để allowlist). Không kiểm soát được, có thể
// chết bất cứ lúc nào (404). Tự chuyển sang icon fallback khi load lỗi thay
// vì hiện icon ảnh vỡ của trình duyệt.
export function ProductImage({
  src,
  alt,
  className,
  iconClassName,
  icon: Icon = ShoppingBag,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  iconClassName?: string;
  icon?: LucideIcon;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex size-full items-center justify-center">
        <Icon className={cn("text-neutral-300", iconClassName)} strokeWidth={1.25} />
      </div>
    );
  }

  return (
    <div className="relative size-full">
      <Image src={src} alt={alt} fill unoptimized className={className} onError={() => setFailed(true)} />
    </div>
  );
}
