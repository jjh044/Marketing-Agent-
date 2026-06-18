import { writeJsonFile } from "./data.js";
import { requestYouTubeJson } from "./youtube-api.js";
import { pathToFileURL } from "node:url";

interface RapidApiChannelDetailsResponse {
  channelId?: string;
  id?: string;
  title?: string;
  description?: string;
  subscriberCount?: string | number;
  subscriberCountText?: string;
  videoCount?: string | number;
  viewCount?: string | number;
  stats?: {
    subscribers?: string | number;
    subscribersText?: string;
    videos?: string | number;
    views?: string | number;
  };
  country?: string;
  joinedDateText?: string;
  avatar?: unknown;
  banner?: unknown;
  [key: string]: unknown;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .toLowerCase()
    .replace(/subscribers?/g, "")
    .replace(/videos?/g, "")
    .replace(/views?/g, "")
    .replace(/,/g, "")
    .trim();
  const match = normalized.match(/^([\d.]+)\s*([km])?$/i);

  if (!match) {
    const raw = Number(normalized);
    return Number.isFinite(raw) ? raw : null;
  }

  const base = Number(match[1]);
  const suffix = match[2];
  if (!Number.isFinite(base)) {
    return null;
  }

  if (suffix === "m") return Math.round(base * 1_000_000);
  if (suffix === "k") return Math.round(base * 1_000);
  return Math.round(base);
}

export async function fetchChannelDetails(
  channelId: string
): Promise<RapidApiChannelDetailsResponse & { normalized: Record<string, unknown> }> {
  const response = await requestYouTubeJson<RapidApiChannelDetailsResponse>(
    `/channel/details/?id=${encodeURIComponent(channelId)}&hl=en&gl=US`
  );

  return {
    ...response,
    normalized: {
      channelId: response.channelId ?? response.id ?? channelId,
      title: response.title ?? "",
      subscribers: parseNumber(
        response.subscriberCount ?? response.subscriberCountText ?? response.stats?.subscribers
      ),
      videos: parseNumber(response.videoCount ?? response.stats?.videos),
      views: parseNumber(response.viewCount ?? response.stats?.views),
      country: response.country ?? "",
      joined: response.joinedDateText ?? ""
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const channelId = process.argv[2];
  if (!channelId) {
    throw new Error("Usage: npm run youtube:details -- <youtube-channel-id>");
  }

  const details = await fetchChannelDetails(channelId);
  await writeJsonFile("data/youtube-channel-details-latest.json", {
    channelId,
    fetchedAt: new Date().toISOString(),
    details
  });

  console.log("Saved channel details to data/youtube-channel-details-latest.json");
}
