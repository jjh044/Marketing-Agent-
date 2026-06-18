import { readJsonFile, writeJsonFile } from "./data.js";
import { loadLocalEnv } from "./env.js";
import { fetchChannelDetails } from "./youtube-channel-details.js";
import { fetchChannelVideos } from "./youtube-channel-videos.js";
import type { CreatorCandidate } from "./types.js";
import { pathToFileURL } from "node:url";

interface ChannelSeed {
  channelId: string;
  platform: "YouTube";
  handle?: string;
  country?: string;
  language?: string;
  notes?: string;
}

interface YouTubeCreatorCandidate extends CreatorCandidate {
  channelId: string;
  channelUrl: string;
  averageViews: number | null;
  sourceNotes?: string;
}

function estimateEngagement(averageViews: number | null, followers: number): "low" | "medium" | "high" {
  if (!averageViews || followers <= 0) {
    return "medium";
  }

  const viewRate = averageViews / followers;
  if (viewRate >= 0.35) return "high";
  if (viewRate >= 0.1) return "medium";
  return "low";
}

function topicFromTitle(title: string): string[] {
  const lower = title.toLowerCase();
  const topics = new Set<string>();
  if (lower.includes("meal prep")) topics.add("meal prep");
  if (lower.includes("budget") || lower.includes("cheap")) topics.add("budget meals");
  if (lower.includes("protein")) topics.add("high protein meals");
  if (lower.includes("grocery")) topics.add("grocery hauls");
  if (lower.includes("weight loss") || lower.includes("fat loss")) topics.add("weight loss");
  if (lower.includes("family") || lower.includes("mom")) topics.add("busy parent meals");
  return [...topics];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanText(value: string): string {
  return value
    .replaceAll("\\u0026", "&")
    .replaceAll('\\"', '"')
    .replaceAll("\\/", "/")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseViews(value: string): number | null {
  const normalized = value.toLowerCase().replace(/views?/g, "").replace(/,/g, "").trim();
  const match = normalized.match(/^([\d.]+)\s*([km])?$/i);
  if (!match) {
    const raw = Number(normalized);
    return Number.isFinite(raw) ? raw : null;
  }

  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  if (match[2] === "m") return Math.round(base * 1_000_000);
  if (match[2] === "k") return Math.round(base * 1_000);
  return Math.round(base);
}

async function fetchPublicChannelVideos(handle: string) {
  const html = await fetch(`https://www.youtube.com/${handle}/videos`, {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"
    }
  }).then((response) => response.text());

  const videos: Array<{
    id: string;
    title: string;
    views: number | null;
    viewText: string;
    published: string;
    url: string;
  }> = [];
  const regex =
    /"lockupMetadataViewModel":\{"title":\{"content":"([^"]+)"\}.*?"metadataParts":\[\{"text":\{"content":"([^"]+ views)"\}/gs;
  let match;
  while ((match = regex.exec(html)) && videos.length < 20) {
    const title = cleanText(match[1]);
    const viewText = cleanText(match[2]);
    if (!videos.some((video) => video.title === title)) {
      videos.push({
        id: `public:${videos.length}`,
        title,
        views: parseViews(viewText),
        viewText,
        published: "",
        url: `https://www.youtube.com/${handle}/videos`
      });
    }
  }

  return videos;
}

export async function importYouTubeCreators(): Promise<YouTubeCreatorCandidate[]> {
  loadLocalEnv();

  const seeds = await readJsonFile<ChannelSeed[]>("data/youtube-channel-ids.json");
  const candidates: YouTubeCreatorCandidate[] = [];

  for (const seed of seeds) {
    const details = await fetchChannelDetails(seed.channelId);
    await sleep(1_500);
    let videos = await fetchChannelVideos(seed.channelId);
    if (videos.length === 0 && seed.handle) {
      videos = await fetchPublicChannelVideos(seed.handle);
    }
    await sleep(1_500);

    const normalized = details.normalized as {
      title?: string;
      subscribers?: number | null;
      country?: string;
    };
    const videosWithViews = videos.filter((video) => video.views !== null);
    const averageViews =
      videosWithViews.length > 0
        ? Math.round(
            videosWithViews.reduce((sum, video) => sum + (video.views ?? 0), 0) /
              videosWithViews.length
          )
        : null;
    const recentTitles = videos.slice(0, 8).map((video) => cleanText(video.title));
    const topics = [...new Set(recentTitles.flatMap(topicFromTitle))];
    const contentReference =
      recentTitles.find((title) => title.toLowerCase().includes("meal prep")) ??
      recentTitles[0] ??
      "recent food and meal planning videos";
    const followers = normalized.subscribers ?? 0;

    candidates.push({
      channelId: seed.channelId,
      channelUrl: `https://www.youtube.com/channel/${seed.channelId}`,
      handle: seed.channelId,
      displayName: normalized.title ?? seed.channelId,
      platform: "YouTube",
      followers,
      country: seed.country ?? normalized.country ?? "United States",
      language: seed.language ?? "English",
      engagementLevel: estimateEngagement(averageViews, followers),
      topics: topics.length > 0 ? topics : ["meal prep"],
      audienceSignals: ["people trying to eat healthier", "people who cook at home"],
      recentPostsLast30Days: videos.length,
      hasPublicEmail: false,
      brandSafetyFlags: [],
      contentReference,
      specificContentAngle: contentReference,
      averageViews,
      sourceNotes: seed.notes
    });
  }

  await writeJsonFile("data/youtube-creator-candidates.json", candidates);
  return candidates;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const candidates = await importYouTubeCreators();
  console.log(`Saved ${candidates.length} YouTube creator candidates to data/youtube-creator-candidates.json`);
}
