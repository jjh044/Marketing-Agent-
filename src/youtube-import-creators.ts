import { readJsonFile, writeJsonFile } from "./data.js";
import { loadLocalEnv } from "./env.js";
import { fetchChannelDetails } from "./youtube-channel-details.js";
import { fetchChannelVideos } from "./youtube-channel-videos.js";
import type { CreatorCandidate } from "./types.js";

interface ChannelSeed {
  channelId: string;
  platform: "YouTube";
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

export async function importYouTubeCreators(): Promise<YouTubeCreatorCandidate[]> {
  loadLocalEnv();

  const seeds = await readJsonFile<ChannelSeed[]>("data/youtube-channel-ids.json");
  const candidates: YouTubeCreatorCandidate[] = [];

  for (const seed of seeds) {
    const [details, videos] = await Promise.all([
      fetchChannelDetails(seed.channelId),
      fetchChannelVideos(seed.channelId)
    ]);

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
    const recentTitles = videos.slice(0, 8).map((video) => video.title);
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

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) {
  const candidates = await importYouTubeCreators();
  console.log(`Saved ${candidates.length} YouTube creator candidates to data/youtube-creator-candidates.json`);
}
