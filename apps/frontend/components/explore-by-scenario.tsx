import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

type Scenario = {
  tag: string;
  title: string;
  description: string;
  href: string;
  image: string;
  size: "lg" | "sm";
};

// Mỗi kịch bản trỏ tới 1 bài blog giới thiệu đúng chủ đề (thay vì thẳng ra
// trang danh mục) — từ bài viết, người đọc mới đi tiếp sang trang sản phẩm
// liên quan. Slug khớp với các bài đã seed trong blog_posts (migration
// 20260714000000_add_blog_posts.sql và 20260719000000_add_scenario_blog_posts.sql).
const SCENARIOS: Scenario[] = [
  {
    tag: "Robotics",
    title: "Chế tạo robot từ linh kiện đến bộ kit hoàn chỉnh",
    description: "Servo, cánh tay robot, mạch điều khiển và robot lắp sẵn cho mọi cấp độ dự án.",
    href: "/blog/cam-nang-bat-dau-du-an-robotics-tu-linh-kien-den-robot-hoan-chinh",
    image: "https://images.unsplash.com/photo-1716191299980-a6e8827ba10b?auto=format&fit=crop&w=1600&q=80",
    size: "lg",
  },
  {
    tag: "AIOT",
    title: "Giám sát & tự động hoá với module AIoT",
    description: "Camera AI, cảm biến GNSS và gateway LoRaWAN cho ứng dụng giám sát thông minh.",
    href: "/blog/aiot-la-gi-giam-sat-tu-dong-hoa-thong-minh-voi-module-aiot",
    image: "https://images.unsplash.com/photo-1753039495488-434a2fe53e41?auto=format&fit=crop&w=1600&q=80",
    size: "lg",
  },
  {
    tag: "Dev Board",
    title: "Bắt đầu dự án nhúng với board phát triển",
    description: "ESP32, RP2350, Raspberry Pi CM5 và board công nghiệp mạnh mẽ.",
    href: "/blog/cach-chon-board-phat-trien-phu-hop-cho-du-an-iot-dau-tay",
    image: "https://images.unsplash.com/photo-1592659762303-90081d34b277?auto=format&fit=crop&w=1200&q=80",
    size: "sm",
  },
  {
    tag: "Drone",
    title: "Chế tạo & nâng cấp drone của riêng bạn",
    description: "Flight controller, động cơ, GPS và khung sườn cho drone FPV.",
    href: "/blog/bat-dau-che-tao-drone-fpv-flight-controller-dong-co-khung-suon",
    image: "https://images.unsplash.com/photo-1512078674698-18572e3e0d6b?auto=format&fit=crop&w=1200&q=80",
    size: "sm",
  },
  {
    tag: "Display",
    title: "Thêm giao diện trực quan cho thiết bị",
    description: "Màn hình cảm ứng, e-ink và LCD độ phân giải cao cho mọi dự án.",
    href: "/blog/chon-man-hinh-hien-thi-cho-du-an-nhung-lcd-oled-e-ink-cam-ung",
    image: "https://images.unsplash.com/photo-1781390200500-ee4a3f379d66?auto=format&fit=crop&w=1200&q=80",
    size: "sm",
  },
  {
    tag: "DIY & Workshop",
    title: "Trang bị xưởng chế tạo chuyên nghiệp",
    description: "Case nhôm, nguồn, phụ kiện kết nối cho dân DIY và kỹ sư.",
    href: "/blog/trang-bi-xuong-che-tao-diy-tai-nha-dung-cu-va-phu-kien-can-co",
    image: "https://images.unsplash.com/photo-1767448068187-5be3cbc848c7?auto=format&fit=crop&w=1200&q=80",
    size: "sm",
  },
  {
    tag: "Cánh tay & Kẹp gắp",
    title: "Cánh tay robot & kẹp gắp chính xác",
    description: "Robot gripper và cánh tay điều khiển cho ứng dụng gắp - đặt tự động.",
    href: "/blog/canh-tay-robot-va-gripper-nguyen-ly-hoat-dong-va-cach-chon-linh-kien",
    image: "https://images.unsplash.com/photo-1752614671144-7eee784abf74?auto=format&fit=crop&w=1200&q=80",
    size: "sm",
  },
  {
    tag: "Servo & Động cơ",
    title: "Servo & động cơ cho mọi chuyển động",
    description: "Actuator, servo TTL và driver động cơ chính xác cao.",
    href: "/blog/servo-dong-co-dc-hay-dong-co-buoc-chon-dung-loai-chuyen-dong",
    image: "https://images.unsplash.com/photo-1779680057959-11adee4dbc9e?auto=format&fit=crop&w=1200&q=80",
    size: "sm",
  },
];

export function ExploreByScenario() {
  const [big1, big2, ...rest] = SCENARIOS;
  const row2 = rest.slice(0, 3);
  const row3 = rest.slice(3, 6);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 grid grid-cols-1 gap-6 sm:mb-10 lg:grid-cols-2 lg:items-center lg:gap-10">
        <div>
          <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
            Khám phá theo kịch bản
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-neutral-950 sm:text-4xl lg:text-[42px]">
            Xây dựng dự án thông minh hơn với gợi ý trọn gói theo nhu cầu
          </h2>
        </div>
        <div className="relative rounded-2xl border border-neutral-100 bg-neutral-50 py-5 pl-6 pr-5 shadow-sm">
          <span className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-orange-500" />
          <p className="text-sm leading-relaxed text-neutral-600 sm:text-base">
            Linh kiện được tuyển chọn, hướng dẫn kỹ thuật và combo gợi ý cho từng ứng dụng thực tế
            — từ AIoT, robot, drone đến workshop chế tạo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <ScenarioCard scenario={big1} />
        <ScenarioCard scenario={big2} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:mt-5 lg:gap-5">
        {row2.map((s) => (
          <ScenarioCard key={s.tag} scenario={s} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:mt-5 lg:gap-5">
        {row3.map((s) => (
          <ScenarioCard key={s.tag} scenario={s} />
        ))}
      </div>
    </section>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const height =
    scenario.size === "lg" ? "h-[280px] sm:h-[340px]" : "h-[240px] sm:h-[280px]";

  return (
    <Link
      href={scenario.href}
      className={`group relative flex w-full flex-col justify-end overflow-hidden rounded-2xl ${height}`}
    >
      <Image
        src={scenario.image}
        alt={scenario.title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      <span className="absolute left-5 top-5 z-10 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
        {scenario.tag}
      </span>
      <div className="relative z-10 p-5 sm:p-6">
        <h3 className="text-lg font-extrabold leading-snug text-white sm:text-xl">
          {scenario.title}
        </h3>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/75 sm:text-sm">
          {scenario.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-950 transition-colors group-hover:bg-orange-500 group-hover:text-white">
          Khám phá {scenario.tag}
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
