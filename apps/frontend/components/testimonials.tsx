import { Star, BadgeCheck } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Minh Tuấn",
    rating: 5,
    content:
      "Đặt module ESP32 và cảm biến DHT22 buổi sáng, chiều đã nhận hàng. Linh kiện đóng gói chống ẩm cẩn thận, đúng thông số trong datasheet.",
  },
  {
    name: "Hoài Thương",
    rating: 5,
    content:
      "Mình làm đồ án IoT cần gấp board STM32 và relay module, shop tư vấn rất nhiệt tình, còn gợi ý thêm linh kiện thay thế khi hết hàng.",
  },
  {
    name: "Đức Anh",
    rating: 4,
    content:
      "Camera giám sát và bộ điều khiển Smart Home mua ở đây hoạt động ổn định, app điều khiển dễ dùng. Giao hàng nhanh hơn dự kiến.",
  },
  {
    name: "Ngọc Hà",
    rating: 5,
    content:
      "Raspberry Pi 4 và phụ kiện đi kèm đầy đủ, giá hợp lý so với mặt bằng chung. Sẽ tiếp tục ủng hộ shop cho các dự án sau.",
  },
  {
    name: "Quang Huy",
    rating: 5,
    content:
      "Tư vấn chọn cảm biến phù hợp cho hệ thống nhà kính tự động rất chi tiết, có cả hướng dẫn đấu nối. Rất đáng tin cậy cho dân kỹ thuật.",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 sm:mb-14">
        <h2 className="text-center text-[32px] font-extrabold uppercase tracking-tight text-neutral-950 sm:text-5xl">
          Khách hàng nói gì về Logilab
        </h2>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:overflow-visible">
        {TESTIMONIALS.map((testimonial) => (
          <div
            key={testimonial.name}
            className="flex min-w-[280px] max-w-[320px] flex-1 shrink-0 snap-start flex-col rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-7 lg:min-w-0"
          >
            <div className="mb-3 flex items-center gap-1 sm:mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 sm:size-5 ${
                    i < testimonial.rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-neutral-200 text-neutral-200"
                  }`}
                />
              ))}
            </div>
            <div className="mb-2 flex items-center gap-1.5 sm:mb-3">
              <strong className="text-sm font-semibold text-neutral-950 sm:text-base">
                {testimonial.name}
              </strong>
              <BadgeCheck className="size-4 text-emerald-500 sm:size-5" />
            </div>
            <p className="text-sm text-neutral-500 sm:text-base">{testimonial.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
