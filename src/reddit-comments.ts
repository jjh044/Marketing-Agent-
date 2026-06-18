import { writeJsonFile } from "./data.js";
import { requestRedditJson } from "./reddit-api.js";
import { pathToFileURL } from "node:url";

interface RapidApiComment {
  id?: string;
  author?: string;
  body?: string;
  score?: number;
  created_utc?: number;
  permalink?: string;
  replies?: RapidApiComment[] | { data?: RapidApiComment[] };
}

interface RapidApiCommentsResponse {
  data?: RapidApiComment[];
  comments?: RapidApiComment[];
  results?: RapidApiComment[];
}

interface SavedRedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  url?: string;
}

function commentsFromResponse(response: RapidApiCommentsResponse): RapidApiComment[] {
  return response.data ?? response.comments ?? response.results ?? [];
}

function flattenComments(comments: RapidApiComment[], output: SavedRedditComment[] = []): SavedRedditComment[] {
  for (const comment of comments) {
    if (comment.body) {
      output.push({
        id: comment.id ?? `comment:${output.length}`,
        author: comment.author ?? "unknown",
        body: comment.body,
        score: comment.score ?? 0,
        url: comment.permalink?.startsWith("http")
          ? comment.permalink
          : comment.permalink
            ? `https://www.reddit.com${comment.permalink}`
            : undefined
      });
    }

    if (Array.isArray(comment.replies)) {
      flattenComments(comment.replies, output);
    } else if (comment.replies?.data) {
      flattenComments(comment.replies.data, output);
    }
  }

  return output;
}

export async function fetchRedditComments(postUrl: string): Promise<SavedRedditComment[]> {
  const response = await requestRedditJson<RapidApiCommentsResponse>(
    `/getPostComments?post_url=${encodeURIComponent(postUrl)}`
  );
  return flattenComments(commentsFromResponse(response));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const postUrl = process.argv[2];
  if (!postUrl) {
    throw new Error("Usage: npm run reddit:comments -- <reddit-post-url>");
  }

  const comments = await fetchRedditComments(postUrl);
  await writeJsonFile("data/reddit-comments-latest.json", {
    postUrl,
    fetchedAt: new Date().toISOString(),
    comments
  });
  console.log(`Saved ${comments.length} comments to data/reddit-comments-latest.json`);
}
