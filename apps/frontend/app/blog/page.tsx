import Link from "next/link";
import Image from "next/image";
import { Clock, Newspaper } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Breadcrumb } from "@/components/breadcrumb";
import { cn } from "@/lib/utils";
import { BlogPostCard, formatPostDate } from "@/components/blog-post-card";
import type { BlogListResponse } from "@logilab/shared-types";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;

  const qs = new URLSearchParams();
  if (tag) qs.set("tag", tag);

  const { posts, featured, tags } = await apiFetch<BlogListResponse>(`/blog?${qs.toString()}`);
  const activeTag = tag && tags.includes(tag) ? tag : undefined;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Blog" }]} />

      {/* HERO */}
      <div className="mt-6 sm:mt-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-4xl">
          Blog kỹ thuật Logilab
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500 sm:text-base">
          Hướng dẫn, so sánh linh kiện và dự án DIY dành cho dân kỹ thuật — cập nhật hàng tuần.
        </p>
      </div>

      {/* TAG FILTER */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href="/blog"
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            !activeTag ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          )}
        >
          Tất cả
        </Link>
        {tags.map((t) => (
          <Link
            key={t}
            href={`/blog?tag=${encodeURIComponent(t)}`}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              activeTag === t ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {t}
          </Link>
        ))}
      </div>

      {posts.length === 0 && !featured ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 p-16 text-center">
          <Newspaper className="size-10 text-neutral-300" strokeWidth={1.25} />
          <p className="text-sm font-medium text-neutral-400">Chưa có bài viết nào ở mục này.</p>
        </div>
      ) : (
        <>
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group mt-8 flex flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm transition-all hover:shadow-md lg:flex-row"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100 lg:aspect-auto lg:w-1/2">
                <Image
                  src={featured.cover_image}
                  alt={featured.title}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-8">
                <span className="w-fit rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  {featured.tag}
                </span>
                <h2 className="text-xl font-extrabold leading-snug text-neutral-950 sm:text-2xl">
                  {featured.title}
                </h2>
                <p className="text-sm leading-relaxed text-neutral-500 sm:text-base">{featured.excerpt}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
                  <span className="font-medium text-neutral-600">{featured.author_name}</span>
                  <span>{formatPostDate(featured.published_at)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {featured.read_minutes} phút đọc
                  </span>
                </div>
              </div>
            </Link>
          )}

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
