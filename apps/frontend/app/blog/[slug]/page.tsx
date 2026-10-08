import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { apiFetchOrNull } from "@/lib/api-client";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { BlogPostCard, formatPostDate } from "@/components/blog-post-card";
import type { BlogDetailResponse } from "@logilab/shared-types";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const detail = await apiFetchOrNull<BlogDetailResponse>(`/blog/${slug}`);
  if (!detail) notFound();
  const { post, related } = detail;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />

      {/* HEADER */}
      <div className="mt-6">
        <Link
          href={`/blog?tag=${encodeURIComponent(post.tag)}`}
          className="w-fit rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-600 hover:bg-orange-100"
        >
          {post.tag}
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-neutral-950 sm:text-3xl">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-neutral-500">
          <span className="font-semibold text-neutral-800">{post.author_name}</span>
          <span>{formatPostDate(post.published_at)}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-4" />
            {post.read_minutes} phút đọc
          </span>
        </div>
      </div>

      {/* COVER IMAGE */}
      <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-100">
        <Image
          src={post.cover_image}
          alt={post.title}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      </div>

      {/* CONTENT */}
      <article className="mt-8 whitespace-pre-line text-[15px] leading-relaxed text-neutral-700 sm:text-base">
        {post.content}
      </article>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl bg-neutral-950 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h3 className="text-base font-bold text-white sm:text-lg">Sẵn sàng bắt tay vào dự án?</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Khám phá linh kiện, module và board phát triển chính hãng tại Logilab.
          </p>
        </div>
        <Button
          asChild
          className="h-11 shrink-0 rounded-full bg-white px-6 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
        >
          <Link href="/products">
            Mua sắm ngay
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {/* RELATED POSTS */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-5 text-xl font-extrabold tracking-tight text-neutral-950">Bài viết liên quan</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {related.map((p) => (
              <BlogPostCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
