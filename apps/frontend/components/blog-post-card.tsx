import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";

export type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string;
  tag: string;
  author_name: string;
  read_minutes: number;
  published_at: string;
};

export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function BlogPostCard({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        <Image
          src={post.cover_image}
          alt={post.title}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <span className="w-fit rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-600">
          {post.tag}
        </span>
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-neutral-950 group-hover:text-neutral-600">
          {post.title}
        </h3>
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-500">{post.excerpt}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
          <span className="font-medium text-neutral-600">{post.author_name}</span>
          <span>{formatPostDate(post.published_at)}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {post.read_minutes} phút đọc
          </span>
        </div>
      </div>
    </Link>
  );
}
