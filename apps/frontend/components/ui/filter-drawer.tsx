"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterDrawer({
  activeCount = 0,
  children,
}: {
  activeCount?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Đóng sheet ngay khi bấm vào 1 link filter bất kỳ bên trong — tránh phải
  // tự tay đóng lại sau mỗi lần chọn.
  function onContentClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("a")) setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50"
      >
        <SlidersHorizontal className="size-4" />
        Bộ lọc
        {activeCount > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-200",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl transition-transform duration-300",
            open ? "translate-y-0" : "translate-y-full"
          )}
          onClick={onContentClick}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-950">Bộ lọc</h2>
            <button
              type="button"
              aria-label="Đóng bộ lọc"
              onClick={() => setOpen(false)}
              className="flex size-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
            >
              <X className="size-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
