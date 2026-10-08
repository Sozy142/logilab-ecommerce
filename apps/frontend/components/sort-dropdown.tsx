"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; href: string };

export function SortDropdown({ options, current }: { options: Option[]; current: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const currentOption = options.find((o) => o.value === current) ?? options[0];

  return (
    <div ref={ref} className="relative flex items-center gap-2 text-sm">
      <span className="text-neutral-500">Sắp xếp:</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50"
      >
        {currentOption.label}
        <ChevronDown className={cn("size-4 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 min-w-[200px] rounded-xl border border-neutral-100 bg-white p-1.5 shadow-lg">
          {options.map((opt) => (
            <Link
              key={opt.value}
              href={opt.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              {opt.label}
              {opt.value === current && <Check className="size-4 text-neutral-950" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
