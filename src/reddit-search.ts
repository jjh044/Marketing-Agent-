import { loadCampaign, writeJsonFile } from "./data.js";
import { requestRedditJson } from "./reddit-api.js";
import type { RedditOpportunity } from "./types.js";
import { pathToFileURL } from "node:url";

interface RapidApiPost {
  id?: string;
  title?: string;
  subreddit?: string;
  permalink?: string;
  url?: string;
  selftext?: string;
  score?: number;
  num_comments?: number;
  created_utc?: number;
  data?: RapidApiPost;
}

interface RapidApiResponse {
  data?: RapidApiPost[] | { posts?: RapidApiPost[]; data?: RapidApiPost[]; results?: RapidApiPost[] };
  posts?: RapidApiPost[];
  results?: RapidApiPost[];
  body?: RapidApiPost[] | { data?: RapidApiPost[]; posts?: RapidApiPost[]; results?: RapidApiPost[] };
  [key: string]: unknown;
}

function postsFromResponse(response: RapidApiResponse): RapidApiPost[] {
  if (Array.isArray(response.data)) return response.data.map((post) => post.data ?? post);
  if (response.data && typeof response.data === "object") {
    const data = response.data as RapidApiResponse;
    if (Array.isArray(data.posts)) return data.posts.map((post) => post.data ?? post);
    if (Array.isArray(data.data)) return data.data.map((post) => post.data ?? post);
    if (Array.isArray(data.results)) return data.results.map((post) => post.data ?? post);
  }
  if (Array.isArray(response.posts)) return response.posts;
  if (Array.isArray(response.results)) return response.results;
  if (Array.isArray(response.body)) return response.body;
  if (response.body && typeof response.body === "object") {
    const body = response.body as RapidApiResponse;
    if (Array.isArray(body.data)) return body.data;
    if (Array.isArray(body.posts)) return body.posts;
    if (Array.isArray(body.results)) return body.results;
  }

  const nestedArray = Object.values(response).find((value) => Array.isArray(value));
  return Array.isArray(nestedArray)
    ? (nestedArray as RapidApiPost[]).map((post) => post.data ?? post)
    : [];
}

function postUrl(post: RapidApiPost): string {
  if (post.permalink?.startsWith("http")) {
    return post.permalink;
  }

  if (post.permalink) {
    return `https://www.reddit.com${post.permalink}`;
  }

  return post.url ?? "https://www.reddit.com";
}

function classifyIntent(query: string): string {
  const normalized = query.toLowerCase();
  if (normalized.includes("hate meal prep")) return "hates meal prep";
  if (normalized.includes("what to cook") || normalized.includes("make for dinner")) {
    return "does not know what to cook";
  }
  if (normalized.includes("searching")) return "tired of searching for meals";
  if (normalized.includes("budget")) return "needs budget meal ideas";
  if (normalized.includes("overwhelming")) return "meal prep feels overwhelming";
  return "meal planning pain point";
}

function opportunityFromPost(post: RapidApiPost, query: string): RedditOpportunity {
  const title = post.title ?? "Untitled Reddit post";
  const subreddit = post.subreddit ?? "unknown";
  const score = post.score ?? 0;
  const comments = post.num_comments ?? 0;
  const relevance = score + comments >= 20 ? "high" : score + comments >= 5 ? "medium" : "low";

  return {
    id: `reddit:${post.id ?? `${subreddit}:${title}`}`.toLowerCase().replace(/\s+/g, "-"),
    subreddit,
    postTitle: title,
    postUrl: postUrl(post),
    intent: classifyIntent(query),
    painPoint: `The post matched the search phrase "${query}".`,
    relevance,
    shouldMentionApp: relevance !== "low",
    helpfulAngle: "start with a small repeatable meal formula instead of planning an entire week"
  };
}

export async function scanReddit(): Promise<RedditOpportunity[]> {
  const campaign = await loadCampaign();
  const opportunities = new Map<string, RedditOpportunity>();

  for (const query of campaign.reddit.scanQueries) {
    const response = await requestRedditJson<RapidApiResponse>(
      `/getSearchPosts?query=${encodeURIComponent(query)}`
    );

    for (const post of postsFromResponse(response).slice(0, 10)) {
      const opportunity = opportunityFromPost(post, query);
      opportunities.set(opportunity.id, opportunity);
    }
  }

  const results = [...opportunities.values()];
  await writeJsonFile("data/reddit-opportunities.json", results);
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await scanReddit();
  console.log(`Saved ${results.length} Reddit opportunities to data/reddit-opportunities.json`);
}
