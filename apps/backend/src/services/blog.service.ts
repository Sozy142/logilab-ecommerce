import { z } from "zod";
import * as repo from "../repositories/blog.repository.js";
import { BLOG_TAGS } from "../lib/constants.js";
import { slugify } from "../lib/slugify.js";
import { conflict, notFound } from "../lib/app-error.js";
import { isUniqueViolation } from "../lib/pg-errors.js";

export async function listBlog(tag?: string) {
  const activeTag = tag && BLOG_TAGS.includes(tag) ? tag : undefined;
  const all = await repo.listPosts();
  const filtered = activeTag ? all.filter((p) => p.tag === activeTag) : all;

  const featured = !activeTag ? (filtered[0] ?? null) : null;
  const rest = featured ? filtered.slice(1) : filtered;

  return { posts: rest, featured, tags: BLOG_TAGS };
}

export async function getBlogPostDetail(slug: string) {
  const post = await repo.getPostBySlug(slug);
  if (!post) throw notFound("Không tìm thấy bài viết");
  const related = await repo.getRelatedPosts(post.tag, post.slug, 3);
  return { post, related };
}

// ---- Admin CRUD ----

export const blogPostCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  coverImage: z.string().url(),
  tag: z.string().min(1),
  authorName: z.string().min(1),
  readMinutes: z.number().int().positive().optional(),
});
export const blogPostUpdateSchema = blogPostCreateSchema.partial();

export async function listPostsAdmin() {
  return repo.listPosts();
}

export async function getPostAdmin(id: string) {
  const post = await repo.getPostById(id);
  if (!post) throw notFound("Không tìm thấy bài viết");
  return post;
}

export async function createPostAdmin(input: z.infer<typeof blogPostCreateSchema>) {
  const slug = input.slug?.trim() || slugify(input.title);
  try {
    return await repo.createPost({ ...input, slug });
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("Slug bài viết đã tồn tại");
    throw err;
  }
}

export async function updatePostAdmin(id: string, input: z.infer<typeof blogPostUpdateSchema>) {
  try {
    const updated = await repo.updatePost(id, input);
    if (!updated) throw notFound("Không tìm thấy bài viết");
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("Slug bài viết đã tồn tại");
    throw err;
  }
}

export async function deletePostAdmin(id: string) {
  const ok = await repo.deletePost(id);
  if (!ok) throw notFound("Không tìm thấy bài viết");
}
