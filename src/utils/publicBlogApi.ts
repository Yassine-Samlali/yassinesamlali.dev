import { languages } from "./languages";

export interface BlogAuthor {
  name: string;
  username?: string;
  profileImage?: string;
  profileUrl?: string;
}

export interface PublicBlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  originalUrl?: string;
  date: string;
  tags: string[];
  languages: string[];
  image: {
    url: string;
    alt: string;
  };
  author: BlogAuthor;
  source: "devto" | "local";
}

export interface PublicBlogPostDetail extends PublicBlogPost {
  contentHtml: string;
  readingTimeMinutes?: number;
}

interface DevToUser {
  name?: string;
  username?: string;
  profile_image_90?: string;
  profile_image?: string;
}

interface DevToArticle {
  id: number;
  title: string;
  description?: string;
  slug?: string;
  url?: string;
  canonical_url?: string;
  path?: string;
  cover_image?: string | null;
  social_image?: string | null;
  published_at?: string;
  published_timestamp?: string;
  reading_time_minutes?: number;
  tag_list?: string[];
  tags?: string;
  body_html?: string;
  body_markdown?: string;
  user?: DevToUser;
}

interface MarkdownPostLike {
  url?: string;
  frontmatter: {
    title?: string;
    description?: string;
    pubDate?: string;
    author?: string;
    tags?: string[];
    languages?: string[];
    image?:
      | {
          url?: string;
          alt?: string;
        }
      | string;
  };
}

const DEVTO_API_URL = "https://dev.to/api/articles?tag=webdev&per_page=24";
const DEVTO_ARTICLE_URL = (postId: string) =>
  `https://dev.to/api/articles/${postId}`;
const FALLBACK_IMAGE = "/images/blogimage.png";
const VALID_LANGUAGE_KEYS = new Set(Object.keys(languages));
const REQUEST_TIMEOUT_MS = 6000;

let cachedPosts: PublicBlogPost[] | null = null;
let inFlightRequest: Promise<PublicBlogPost[]> | null = null;

const cachedDetails = new Map<string, PublicBlogPostDetail>();
const inFlightDetails = new Map<string, Promise<PublicBlogPostDetail | null>>();

const LANGUAGE_ALIASES: Record<string, string> = {
  react: "javascript",
  reactjs: "javascript",
  nextjs: "javascript",
  "next.js": "javascript",
  nodejs: "node",
  "node.js": "node",
  mongodb: "mongo",
  tailwindcss: "tailwind",
  typescript: "ts",
};

const normalizeToken = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9.+-]/g, "");

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const unique = (items: string[]) => [...new Set(items)];

const sanitizeTags = (items: string[]) =>
  unique(items.map((item) => item.trim()).filter(Boolean));

const toLanguageKey = (value: string): string | null => {
  const normalized = normalizeToken(value);
  const resolvedKey = LANGUAGE_ALIASES[normalized] ?? normalized;
  return VALID_LANGUAGE_KEYS.has(resolvedKey) ? resolvedKey : null;
};

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const mapDevToArticle = (article: DevToArticle): PublicBlogPost => {
  const rawTags = Array.isArray(article.tag_list)
    ? article.tag_list
    : typeof article.tags === "string"
      ? article.tags.split(",")
      : [];

  const tags = sanitizeTags(rawTags);
  const mappedLanguages = unique(
    tags.map((tag) => toLanguageKey(tag)).filter((tag): tag is string => !!tag),
  );

  const postId = article.id.toString();
  const slugPart = article.slug || slugify(article.title) || postId;
  const postSlug = `${postId}-${slugPart}`;

  const originalUrl =
    article.url ||
    article.canonical_url ||
    (article.path ? `https://dev.to${article.path}` : "");

  const authorName = article.user?.name || article.user?.username || "Unknown Author";
  const authorUsername = article.user?.username;

  return {
    id: postId,
    slug: postSlug,
    title: article.title,
    description: article.description || "Read this article from DEV Community.",
    url: `/blog/posts/api/${postSlug}`,
    originalUrl,
    date:
      article.published_at || article.published_timestamp || new Date().toISOString(),
    tags,
    languages: mappedLanguages,
    image: {
      url: article.cover_image || article.social_image || FALLBACK_IMAGE,
      alt: article.title,
    },
    author: {
      name: authorName,
      username: authorUsername,
      profileImage: article.user?.profile_image_90 || article.user?.profile_image,
      profileUrl: authorUsername ? `https://dev.to/${authorUsername}` : undefined,
    },
    source: "devto",
  };
};

async function fetchPublicBlogPosts(): Promise<PublicBlogPost[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(DEVTO_API_URL, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as DevToArticle[];
    const mappedPosts = payload
      .map(mapDevToArticle)
      .filter((post) => post.title && post.url && post.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return mappedPosts;
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getPublicBlogPosts(limit = 24): Promise<PublicBlogPost[]> {
  if (cachedPosts) {
    return cachedPosts.slice(0, limit);
  }

  if (!inFlightRequest) {
    inFlightRequest = fetchPublicBlogPosts();
  }

  const posts = await inFlightRequest;
  cachedPosts = posts;
  inFlightRequest = null;

  return posts.slice(0, limit);
}

export function getPostIdFromSlug(slug: string): string {
  return slug.split("-")[0] || slug;
}

async function fetchPublicBlogPostDetail(
  postId: string,
): Promise<PublicBlogPostDetail | null> {
  const summaryPosts = await getPublicBlogPosts(100);
  const summary = summaryPosts.find((post) => post.id === postId);

  if (!summary) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(DEVTO_ARTICLE_URL(postId), {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ...summary,
        contentHtml: `<p>${escapeHtml(summary.description)}</p>`,
      };
    }

    const payload = (await response.json()) as DevToArticle;
    const mapped = mapDevToArticle(payload);

    const contentHtml =
      payload.body_html ||
      `<p>${escapeHtml(payload.description || summary.description)}</p>`;

    return {
      ...summary,
      ...mapped,
      contentHtml,
      readingTimeMinutes: payload.reading_time_minutes,
    };
  } catch {
    return {
      ...summary,
      contentHtml: `<p>${escapeHtml(summary.description)}</p>`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getPublicBlogPostDetailBySlug(
  slug: string,
): Promise<PublicBlogPostDetail | null> {
  const postId = getPostIdFromSlug(slug);

  if (cachedDetails.has(postId)) {
    return cachedDetails.get(postId) || null;
  }

  if (!inFlightDetails.has(postId)) {
    inFlightDetails.set(postId, fetchPublicBlogPostDetail(postId));
  }

  const detail = await inFlightDetails.get(postId)!;
  inFlightDetails.delete(postId);

  if (detail) {
    cachedDetails.set(postId, detail);
  }

  return detail;
}

export function mapMarkdownPosts(posts: MarkdownPostLike[]): PublicBlogPost[] {
  return posts.map((post, index) => {
    const imageValue = post.frontmatter.image;
    const imageUrl =
      typeof imageValue === "string"
        ? imageValue
        : imageValue?.url || FALLBACK_IMAGE;
    const imageAlt =
      typeof imageValue === "string"
        ? post.frontmatter.title || "Blog image"
        : imageValue?.alt || post.frontmatter.title || "Blog image";

    const localUrl = post.url || "#";
    const localSlug =
      localUrl.replace("/blog/posts/", "").replace(/\/$/, "") ||
      `local-${index}`;

    return {
      id: `local-${index}`,
      slug: localSlug,
      title: post.frontmatter.title || "Untitled post",
      description: post.frontmatter.description || "",
      url: localUrl,
      date: post.frontmatter.pubDate || new Date().toISOString(),
      tags: sanitizeTags(post.frontmatter.tags || []),
      languages: unique((post.frontmatter.languages || []).filter(Boolean)),
      image: {
        url: imageUrl,
        alt: imageAlt,
      },
      author: {
        name: post.frontmatter.author || "Yassine Samlali",
      },
      source: "local",
    };
  });
}