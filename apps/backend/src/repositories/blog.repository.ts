import { pool } from "../lib/db.js";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  tag: string;
  author_name: string;
  read_minutes: number;
  published_at: string;
};

export async function listPosts(): Promise<BlogPost[]> {
  const { rows } = await pool.query<BlogPost>(
    "SELECT * FROM blog_posts ORDER BY published_at DESC"
  );
  return rows;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { rows } = await pool.query<BlogPost>(
    "SELECT * FROM blog_posts WHERE slug = $1",
    [slug]
  );
  return rows[0] ?? null;
}

export async function getRelatedPosts(tag: string, excludeSlug: string, limit = 3): Promise<BlogPost[]> {
  const { rows } = await pool.query<BlogPost>(
    "SELECT * FROM blog_posts WHERE tag = $1 AND slug != $2 ORDER BY published_at DESC LIMIT $3",
    [tag, excludeSlug, limit]
  );
  return rows;
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const { rows } = await pool.query<BlogPost>("SELECT * FROM blog_posts WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tag: string;
  authorName: string;
  readMinutes?: number;
};

export async function createPost(input: BlogPostInput): Promise<BlogPost> {
  const { rows } = await pool.query<BlogPost>(
    `INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, tag, author_name, read_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      input.title,
      input.slug,
      input.excerpt,
      input.content,
      input.coverImage,
      input.tag,
      input.authorName,
      input.readMinutes ?? 5,
    ]
  );
  return rows[0];
}

const BLOG_POST_COLUMNS: Record<keyof BlogPostInput, string> = {
  title: "title",
  slug: "slug",
  excerpt: "excerpt",
  content: "content",
  coverImage: "cover_image",
  tag: "tag",
  authorName: "author_name",
  readMinutes: "read_minutes",
};

export async function updatePost(id: string, input: Partial<BlogPostInput>): Promise<BlogPost | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(BLOG_POST_COLUMNS) as [keyof BlogPostInput, string][]) {
    if (input[key] === undefined) continue;
    values.push(input[key]);
    sets.push(`${column} = $${values.length}`);
  }
  if (sets.length === 0) return getPostById(id);

  values.push(id);
  const { rows } = await pool.query<BlogPost>(
    `UPDATE blog_posts SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deletePost(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM blog_posts WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
