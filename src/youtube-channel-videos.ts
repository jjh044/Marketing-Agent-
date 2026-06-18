import { writeJsonFile } from "./data.js";
import { requestYouTubeJson } from "./youtube-api.js";
import { pathToFileURL } from "node:url";

interface RapidApiVideo {
  videoId?: string;
  video_id?: string;
  title?: string;
  publishedTimeText?: string;
  publishedTime?: string;
  viewCountText?: string;
  viewCount?: string | number;
  stats?: {
    views?: string | number;
  };
}

interface RapidApiChannelVideosResponse {
  contents?: RapidApiVideo[];
  data?: RapidApiVideo[];
  videos?: RapidApiVideo[];
  continuation?: string;
}

interface SavedYouTubeVideo {
  id: string;
  title: string;
  views: number | null;
  viewText: string;
  published: string;
  url: string;
}

function videosFromResponse(response: RapidApiChannelVideosResponse): RapidApiVideo[] {
  return response.contents ?? response.data ?? response.videos ?? [];
}

function parseViews(value: unknown): number | null {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toLowerCase().replace(/views?/g, "").replace(/,/g, "").trim();
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

function normalizeVideo(video: RapidApiVideo): SavedYouTubeVideo {
  const id = video.videoId ?? video.video_id ?? "unknown";
  const viewText =
    video.viewCountText ??
    (video.viewCount ? `${video.viewCount}` : undefined) ??
    (video.stats?.views ? `${video.stats.views}` : undefined) ??
    "";

  return {
    id,
    title: video.title ?? "Untitled video",
    views: parseViews(video.viewCount ?? video.viewCountText ?? video.stats?.views),
    viewText,
    published: video.publishedTimeText ?? video.publishedTime ?? "",
    url: id === "unknown" ? "https://www.youtube.com" : `https://www.youtube.com/watch?v=${id}`
  };
}

export async function fetchChannelVideos(channelId: string): Promise<SavedYouTubeVideo[]> {
  const response = await requestYouTubeJson<RapidApiChannelVideosResponse>(
    `/channel/videos/?id=${encodeURIComponent(channelId)}&filter=videos_latest&hl=en&gl=US`
  );
  return videosFromResponse(response).map(normalizeVideo);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const channelId = process.argv[2];
  if (!channelId) {
    throw new Error("Usage: npm run youtube:channel -- <youtube-channel-id>");
  }

  const videos = await fetchChannelVideos(channelId);
  const videosWithViews = videos.filter((video) => video.views !== null);
  const averageViews =
    videosWithViews.length > 0
      ? Math.round(
          videosWithViews.reduce((sum, video) => sum + (video.views ?? 0), 0) /
            videosWithViews.length
        )
      : null;

  await writeJsonFile("data/youtube-channel-videos-latest.json", {
    channelId,
    fetchedAt: new Date().toISOString(),
    averageViews,
    videos
  });

  console.log(
    `Saved ${videos.length} videos to data/youtube-channel-videos-latest.json` +
      (averageViews === null ? "" : `; average views: ${averageViews.toLocaleString()}`)
  );
}
