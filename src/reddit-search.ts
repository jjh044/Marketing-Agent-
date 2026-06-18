import https from "node:https";
import { loadCampaign, writeJsonFile } from "./data.js";
import type { RedditOpportunity } from "./types.js";

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
}

interface RapidApiResponse {
  data?: RapidApiPost[];
  posts?: RapidApiPost[];
  results?: RapidApiPost[];
}

function requestJson<T>(path: string, apiKey: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        method: "GET",
        hostname: "reddit34.p.rapidapi.com",
        path,
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "reddit34.p.rapidapi.com",
          "Content-Type": "application/json"
        }
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (!response.statusCode || response.statusCode >= 400) {
            reject(new Error(`RapidAPI Reddit request failed: ${response.statusCode} ${body}`));
            return;
          }

          resolve(JSON.parse(body) as T);
        });
      }
    );

    request.on("error", reject);
    request.end();
  });
}

function postsFromResponse(response: RapidApiResponse): RapidApiPost[] {
  return response.data ?? response.posts ?? response.results ?? [];
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
  const apiKey = process.env.RAPIDAPI_REDDIT_KEY;
  if (!apiKey) {
    throw new Error("Missing RAPIDAPI_REDDIT_KEY environment variable.");
  }

  const campaign = await loadCampaign();
  const opportunities = new Map<string, RedditOpportunity>();

  for (const query of campaign.reddit.scanQueries) {
    const response = await requestJson<RapidApiResponse>(
      `/getSearchPosts?query=${encodeURIComponent(query)}`,
      apiKey
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

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) {
  const results = await scanReddit();
  console.log(`Saved ${results.length} Reddit opportunities to data/reddit-opportunities.json`);
}
