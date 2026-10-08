"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  quantity,
  onChange,
  max,
  size = "default",
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  max?: number;
  size?: "default" | "sm";
}) {
  const atMax = typeof max === "number" && max > 0 && quantity >= max;
  const buttonSize = size === "sm" ? "size-8" : "size-10";
  const labelWidth = size === "sm" ? "w-8" : "w-10";

  return (
    <div className="inline-flex items-center rounded-full border border-neutral-200">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className={cn(
          "flex items-center justify-center text-neutral-600 transition-colors hover:text-neutral-950 disabled:opacity-40",
          buttonSize
        )}
      >
        <Minus className="size-4" />
      </button>
      <span className={cn("text-center text-sm font-semibold text-neutral-950", labelWidth)}>
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(typeof max === "number" && max > 0 ? Math.min(max, quantity + 1) : quantity + 1)}
        disabled={atMax}
        className={cn(
          "flex items-center justify-center text-neutral-600 transition-colors hover:text-neutral-950 disabled:opacity-40",
          buttonSize
        )}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
