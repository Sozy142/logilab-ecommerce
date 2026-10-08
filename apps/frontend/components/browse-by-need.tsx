import Link from "next/link";
import Image from "next/image";

// Nhóm theo nhu cầu/persona (rộng hơn "Khám phá theo kịch bản" ở trên, vốn
// đi theo từng danh mục sản phẩm cụ thể). Trỏ thẳng tới danh mục thật đang có
// hàng để tránh dẫn tới trang trống.
const NEEDS = [
  {
    title: "Học tập & Giáo dục",
    description: "Arduino, board phát triển và kit học tập cho sinh viên, người mới bắt đầu.",
    slug: "dev-board",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    className: "sm:max-w-[360px]",
  },
  {
    title: "Dự án chuyên nghiệp",
    description: "Module công nghiệp, cảm biến GNSS và gateway LoRaWAN cho kỹ sư, doanh nghiệp.",
    slug: "aiot",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80",
    className: "sm:flex-1",
  },
  {
    title: "Sáng tạo & Giải trí",
    description: "Case nhôm, đèn LED module và phụ kiện DIY cho các dự án sáng tạo.",
    slug: "diy-workshop",
    image:
      "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=1400&q=80",
    className: "sm:flex-1",
  },
  {
    title: "Tự động hoá & Điều khiển",
    description: "Servo, động cơ và cánh tay robot cho ứng dụng điều khiển tự động.",
    slug: "robotics",
    image:
      "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80",
    className: "sm:max-w-[360px]",
  },
];

export function BrowseByNeed() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-[40px] bg-neutral-100 px-6 py-10 sm:p-12">
        <h2 className="mb-8 text-center text-[32px] font-extrabold uppercase tracking-tight text-neutral-950 sm:mb-14 sm:text-5xl">
          Khám phá theo nhu cầu
        </h2>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
          {NEEDS.slice(0, 2).map((need) => (
            <NeedCard key={need.slug} need={need} />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:gap-5">
          {NEEDS.slice(2, 4).map((need) => (
            <NeedCard key={need.slug} need={need} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NeedCard({ need }: { need: (typeof NEEDS)[number] }) {
  return (
    <Link
      href={`/categories/${need.slug}`}
      className={`group relative flex h-[220px] w-full items-end overflow-hidden rounded-2xl sm:h-[280px] ${need.className}`}
    >
      <Image
        src={need.image}
        alt={need.title}
        fill
        sizes="(max-width: 640px) 100vw, 50vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="relative z-10 p-5 sm:p-6">
        <h3 className="text-xl font-extrabold text-white sm:text-2xl">{need.title}</h3>
        <p className="mt-1 max-w-xs text-sm text-white/80">{need.description}</p>
      </div>
    </Link>
  );
}
