"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, FileText, FolderGit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMockRating, RatingStars } from "@/components/product-detail";

type ProductSpec = { label: string; value: string };

const TABS = [
  { id: "description", label: "Mô tả" },
  { id: "specs", label: "Thông số kỹ thuật" },
  { id: "resources", label: "Datasheet & Library" },
  { id: "reviews", label: "Đánh giá" },
  { id: "faq", label: "Hỏi đáp" },
] as const;

const REVIEWS = [
  {
    name: "Minh Tuấn",
    rating: 5,
    date: "12/05/2026",
    content: "Hàng chính hãng, đóng gói cẩn thận, có đầy đủ tem chống giả. Mình đã test thử và hoạt động ổn định.",
  },
  {
    name: "Hoàng Anh",
    rating: 4.5,
    date: "03/05/2026",
    content: "Giao nhanh, đúng như mô tả. Module bắt WiFi khá nhạy, dùng cho dự án IoT rất ổn.",
  },
  {
    name: "Thảo Nguyên",
    rating: 5,
    date: "28/04/2026",
    content: "Đã mua nhiều lần ở shop, lần nào sản phẩm cũng dùng ổn định, ít lỗi vặt. Đáng tin cậy.",
  },
  {
    name: "Đức Phát",
    rating: 4,
    date: "15/04/2026",
    content: "Chất lượng tốt so với giá tiền, có hỗ trợ kỹ thuật khi cần lập trình firmware.",
  },
];

const FAQS = [
  {
    question: "Sản phẩm có được bảo hành không?",
    answer: "Sản phẩm được bảo hành 12 tháng do lỗi từ nhà sản xuất. Vui lòng giữ hóa đơn mua hàng để được hỗ trợ đổi trả nhanh chóng.",
  },
  {
    question: "Module này có tương thích với Arduino IDE / PlatformIO không?",
    answer: "Có. Sản phẩm hỗ trợ lập trình qua Arduino IDE, PlatformIO và ESP-IDF (nếu là dòng ESP). Driver USB-UART cần cài đặt thêm theo hướng dẫn đi kèm.",
  },
  {
    question: "Có cần mạch nạp rời để lập trình không?",
    answer: "Không. Board đã tích hợp sẵn mạch USB-to-Serial, chỉ cần cắm cáp USB vào máy tính là có thể nạp code trực tiếp.",
  },
];

export function ProductTabs({
  description,
  specs,
  productId,
  datasheetUrl,
  libraryUrl,
}: {
  description: string | null;
  specs: ProductSpec[];
  productId: string;
  datasheetUrl?: string | null;
  libraryUrl?: string | null;
}) {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("description");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const rating = getMockRating(productId);

  // Thanh tab cuộn ngang trên mobile (5 tab không đủ chỗ) nhưng trước đây
  // không có gợi ý nào cho biết còn tab phía sau — tab cuối bị cắt cứng
  // đúng mép màn hình. Theo dõi vị trí cuộn để hiện gradient mờ dần đúng
  // bên còn nội dung, ẩn đi khi đã cuộn hết.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => {
      setShowLeftFade(el.scrollLeft > 1);
      setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    check();

    el.addEventListener("scroll", check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      observer.disconnect();
    };
  }, []);

  return (
    <div>
      <div className="relative border-b border-neutral-100">
        <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto scroll-smooth">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors sm:px-6",
                active === tab.id
                  ? "border-neutral-950 text-neutral-950"
                  : "border-transparent text-neutral-400 hover:text-neutral-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent transition-opacity duration-150",
            showLeftFade ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent transition-opacity duration-150",
            showRightFade ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      <div className="pt-6">
        {active === "description" && (
          <div className="rounded-2xl border border-neutral-100 bg-white px-5 py-4">
            {description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">{description}</p>
            ) : (
              <div className="py-4 text-center text-sm text-neutral-400">
                Chưa có mô tả cho sản phẩm này.
              </div>
            )}
          </div>
        )}

        {active === "specs" && (
          <div className="overflow-hidden rounded-2xl border border-neutral-100">
            {specs.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-neutral-400">
                Chưa có thông số kỹ thuật cho sản phẩm này.
              </div>
            )}
            {specs.map((spec, i) => (
              <div
                key={spec.label}
                className={cn(
                  "grid grid-cols-2 px-5 py-3.5 text-sm",
                  i % 2 === 0 ? "bg-neutral-50" : "bg-white",
                  i !== 0 && "border-t border-neutral-100"
                )}
              >
                <span className="font-medium text-neutral-500">{spec.label}</span>
                <span className="font-semibold text-neutral-900">{spec.value}</span>
              </div>
            ))}
          </div>
        )}

        {active === "resources" && (
          <div className="flex flex-col gap-3 sm:flex-row">
            {datasheetUrl && (
              <a
                href={datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white">
                  <FileText className="size-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-neutral-950">Datasheet</div>
                  <div className="truncate text-xs text-neutral-500">Tài liệu kỹ thuật chính hãng</div>
                </div>
                <ExternalLink className="size-4 shrink-0 text-neutral-400" />
              </a>
            )}
            {libraryUrl && (
              <a
                href={libraryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white">
                  <FolderGit2 className="size-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-neutral-950">Library / Firmware</div>
                  <div className="truncate text-xs text-neutral-500">Mã nguồn, thư viện lập trình</div>
                </div>
                <ExternalLink className="size-4 shrink-0 text-neutral-400" />
              </a>
            )}
            {!datasheetUrl && !libraryUrl && (
              <div className="w-full rounded-2xl border border-neutral-100 bg-white px-5 py-8 text-center text-sm text-neutral-400">
                Chưa có datasheet hoặc thư viện cho sản phẩm này.
              </div>
            )}
          </div>
        )}

        {active === "reviews" && (
          <div>
            <div className="mb-5 flex items-center gap-2">
              <RatingStars rating={rating} />
              <span className="text-sm font-semibold text-neutral-900">{rating.toFixed(1)}/5</span>
              <span className="text-sm text-neutral-400">({REVIEWS.length} đánh giá)</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {REVIEWS.map((review) => (
                <div key={review.name} className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-neutral-950">{review.name}</span>
                    <span className="text-xs text-neutral-400">{review.date}</span>
                  </div>
                  <div className="mt-1.5">
                    <RatingStars rating={review.rating} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">{review.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === "faq" && (
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={faq.question} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-neutral-950"
                  >
                    {faq.question}
                    <ChevronDown className={cn("size-4 shrink-0 text-neutral-400 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-neutral-100 px-5 py-4">
                      <p className="text-sm leading-relaxed text-neutral-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
