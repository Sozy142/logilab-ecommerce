"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@logilab/shared-types";
import { ProductCard } from "@/components/product-card";

// Dải sản phẩm trượt ngang dùng chung cho mọi nơi cần show nhiều sản phẩm
// (trang chủ, trang chi tiết sản phẩm...) — không phụ thuộc thư viện carousel
// ngoài nào (không Swiper/Embla), chỉ React ref + rAF thuần, ~140 dòng, để
// không kéo nặng bundle khi dùng lại ở nhiều trang. Không tự vẽ tiêu đề —
// trang gọi tự render heading theo style riêng rồi đặt component này bên dưới.
const DRAG_MULTIPLIER = 1.4;
const FRICTION = 0.94;
const MIN_VELOCITY = 0.02;

export function ProductCarousel({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, moved: false, startX: 0, startScrollLeft: 0 });
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  function stopMomentum() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function runMomentum() {
    const el = scrollRef.current;
    if (!el) return;
    let velocity = velocityRef.current; // px/ms

    function step() {
      if (!el || Math.abs(velocity) < MIN_VELOCITY) {
        rafRef.current = null;
        // Chỉ bật lại scroll-snap khi đã trôi hẳn xong — bật lại ngay lúc
        // buông chuột sẽ khiến trình duyệt giật/kéo lệch vị trí đang kéo về
        // điểm snap gần nhất giữa chừng, cảm giác "khựng" chứ không mượt.
        el?.style.removeProperty("scroll-snap-type");
        return;
      }
      el.scrollLeft += velocity * 16;
      velocity *= FRICTION;
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
  }

  function scrollByAmount(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    stopMomentum();
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  // Kéo bằng chuột dùng mousedown/mousemove/mouseup gắn trên window (thay vì
  // Pointer Capture API) — setPointerCapture từng khiến sự kiện click trên
  // link sản phẩm bên trong không bắn ra được, kể cả khi không hề kéo.
  function onMouseMove(e: MouseEvent) {
    const el = scrollRef.current;
    const state = dragState.current;
    if (!el || !state.dragging) return;
    const delta = (e.clientX - state.startX) * DRAG_MULTIPLIER;
    if (Math.abs(delta) > 3) state.moved = true;
    el.scrollLeft = state.startScrollLeft - delta;

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = ((lastXRef.current - e.clientX) * DRAG_MULTIPLIER) / dt;
    }
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;
  }

  function onMouseUp() {
    dragState.current.dragging = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    runMomentum();
  }

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el) return;
    // preventDefault để chặn hành vi kéo-ảnh / bôi đen văn bản mặc định của
    // trình duyệt — nếu không, thao tác kéo sẽ bị "nuốt" thành thao tác đó
    // thay vì cuộn ngang.
    e.preventDefault();
    stopMomentum();
    el.style.scrollSnapType = "none";
    dragState.current = { dragging: true, moved: false, startX: e.clientX, startScrollLeft: el.scrollLeft };
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    // Chặn click điều hướng sang trang sản phẩm nếu người dùng vừa kéo qua.
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  }

  return (
    <div className="relative">
      {/* Nút trước/sau lấn nửa ra ngoài rìa card (translate-x-1/2) — chỉ hợp lý
          trên desktop có chuột. Trên mobile ẩn đi vì: (1) vuốt tay đã cuộn
          được sẵn qua overflow-x-auto, (2) nút lấn nửa ra ngoài từng gây
          tràn ngang ẩn ~2px ở rìa phải màn hình hẹp. */}
      <button
        type="button"
        onClick={() => scrollByAmount(-1)}
        aria-label="Xem sản phẩm trước"
        className="absolute left-0 top-1/2 z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md transition-colors hover:bg-neutral-100 sm:flex sm:size-10"
      >
        <ChevronLeft className="size-4 sm:size-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollByAmount(1)}
        aria-label="Xem thêm sản phẩm"
        className="absolute right-0 top-1/2 z-10 hidden size-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md transition-colors hover:bg-neutral-100 sm:flex sm:size-10"
      >
        <ChevronRight className="size-4 sm:size-5" />
      </button>

      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
        className="flex select-none cursor-grab snap-x snap-proximity gap-3 overflow-x-auto pb-2 active:cursor-grabbing sm:gap-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p, i) => (
          <div key={p.id} className="w-[44%] shrink-0 snap-start sm:w-[31%] lg:w-[23%] xl:w-[15.5%]">
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
