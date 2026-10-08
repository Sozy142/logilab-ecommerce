import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCategoryTree, getDevBoardBrands } from "@/lib/categories";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Logilab Electronics Store",
  description: "Cửa hàng linh kiện điện tử và robotics chuyên nghiệp",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, devBoardBrands] = await Promise.all([getCategoryTree(), getDevBoardBrands()]);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased font-sans font-light text-neutral-900 min-h-screen flex flex-col">
        <Header categories={categories} devBoardBrands={devBoardBrands} />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
