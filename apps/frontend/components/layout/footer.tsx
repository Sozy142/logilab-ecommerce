import Link from "next/link";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

const footerColumns: FooterColumn[] = [
  {
    title: "Công ty",
    links: [
      { label: "Về Logilab", href: "/about" },
      { label: "Tuyển dụng", href: "/careers" },
      { label: "Tin tức công nghệ", href: "/news" },
      { label: "Đối tác & Đại lý", href: "/partners" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm hỗ trợ", href: "/support" },
      { label: "Hướng dẫn lắp đặt & Datasheet", href: "/support/docs" },
      { label: "Vận chuyển & Giao nhận", href: "/support/shipping" },
      { label: "Đổi trả & Bảo hành", href: "/support/returns" },
      { label: "Câu hỏi thường gặp", href: "/support/faq" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Tài khoản của tôi", href: "/account" },
      { label: "Đơn hàng của tôi", href: "/account/orders" },
      { label: "Giỏ hàng", href: "/cart" },
      { label: "Sản phẩm yêu thích", href: "/account/wishlist" },
    ],
  },
  {
    title: "Liên hệ",
    links: [
      { label: "123 Đường Công Nghệ, Quận 1, TP.HCM", href: "#" },
      { label: "+84 28 1234 5678", href: "tel:+842812345678" },
      { label: "support@logilab.vn", href: "mailto:support@logilab.vn" },
      { label: "8:00 - 18:00, Thứ 2 - Thứ 7", href: "#" },
    ],
  },
];

const contactIcons = [MapPin, Phone, Mail, Clock];

const socialLinks = [
  { label: "Facebook", short: "f", href: "https://facebook.com" },
  { label: "Instagram", short: "ig", href: "https://instagram.com" },
  { label: "YouTube", short: "yt", href: "https://youtube.com" },
  { label: "LinkedIn", short: "in", href: "https://linkedin.com" },
];

const legalLinks = [
  { label: "Chính sách bảo mật", href: "/legal/privacy" },
  { label: "Điều khoản sử dụng", href: "/legal/terms" },
  { label: "Sơ đồ trang", href: "/sitemap" },
];

export function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-400">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="flex flex-col lg:col-span-3">
            <span className="text-2xl font-extrabold uppercase tracking-tight text-white">
              LOGILAB
            </span>
            <p className="mt-4 max-w-xs text-sm text-neutral-400">
              Linh kiện điện tử, module IoT và giải pháp Smart Home chính hãng -
              đồng hành cùng nhà phát triển và kỹ sư Việt Nam.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border border-white/10 text-xs font-medium text-neutral-300 transition-colors hover:bg-white hover:text-neutral-950"
                >
                  {social.short}
                </a>
              ))}
            </div>
          </div>

          {/* Columns */}
          {footerColumns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link, i) => (
                  <li key={link.label}>
                    {col.title === "Liên hệ" ? (
                      <a
                        href={link.href}
                        className="flex items-start gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
                      >
                        {(() => {
                          const Icon = contactIcons[i];
                          return <Icon className="mt-0.5 size-4 shrink-0 text-neutral-500" />;
                        })()}
                        <span>{link.label}</span>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-neutral-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col-reverse items-center justify-between gap-6 sm:flex-row">
            <p className="text-xs text-neutral-500">
              © {new Date().getFullYear()} Logilab. Đã đăng ký Bản quyền.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-neutral-500 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
