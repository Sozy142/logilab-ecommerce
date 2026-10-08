"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TOOLTIP_WIDTH = 220;
const VIEWPORT_MARGIN = 12;

// Chỉ hiện tooltip khi tên bị line-clamp-3 cắt bớt thật sự (so sánh
// scrollHeight vs clientHeight sau khi render), không hiện tràn lan cho mọi
// sản phẩm. Đo lại khi resize vì số dòng bị cắt phụ thuộc độ rộng card.
//
// Tooltip vẫn nằm trong layout ngay cả khi ẩn (chỉ opacity-0, không
// display:none) nên nếu neo cứng bên trái, nó có thể lòi khỏi viewport ở
// những card sát mép phải — tạo vùng cuộn ngang ảo cho cả trang. Vì vậy
// phải tự đo vị trí để quyết định neo trái/phải, và giới hạn max-width
// theo chính viewport chứ không chỉ theo con số cố định.
export function ProductTitleTooltip({ name }: { name: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setTruncated(el.scrollHeight > el.clientHeight + 1);
      const rect = el.getBoundingClientRect();
      setAlignRight(rect.left + TOOLTIP_WIDTH > window.innerWidth - VIEWPORT_MARGIN);
    };
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    window.addEventListener("resize", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [name]);

  return (
    <>
      <h3
        ref={ref}
        className="line-clamp-3 min-h-[2.8rem] text-xs font-semibold leading-tight text-neutral-900 group-hover/title:text-neutral-600 sm:min-h-[3.3rem] sm:text-sm"
      >
        {name}
      </h3>
      {truncated && (
        <span
          className={cn(
            "pointer-events-none absolute top-[calc(100%+4px)] z-20 w-max max-w-[min(220px,calc(100vw-1.5rem))] rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs leading-snug text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover/title:opacity-100",
            alignRight ? "right-0" : "left-0"
          )}
        >
          {name}
        </span>
      )}
    </>
  );
}
