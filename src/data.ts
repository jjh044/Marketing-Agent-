import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CampaignConfig, CreatorCandidate, RedditOpportunity } from "./types.js";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function projectPath(path: string): string {
  return resolve(rootDir, path);
}

export async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(projectPath(path), "utf8")) as T;
}

export async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await writeFile(projectPath(path), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export interface AppOption {
  id: string;
  name: string;
  category: string;
}

export async function listApps(): Promise<AppOption[]> {
  const files = (await readdir(projectPath("campaigns"))).filter((file) => file.endsWith(".json"));
  const apps = await Promise.all(
    files.map(async (file) => {
      const id = file.replace(/\.json$/, "");
      const campaign = await readJsonFile<CampaignConfig>(`campaigns/${file}`);
      return {
        id,
        name: campaign.app.name,
        category: campaign.app.category
      };
    })
  );

  return apps.sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadCampaign(appId = "meal-prep-ai"): Promise<CampaignConfig> {
  const safeAppId = appId.replace(/[^a-z0-9-]/gi, "");
  return readJsonFile<CampaignConfig>(`campaigns/${safeAppId || "meal-prep-ai"}.json`);
}

export async function loadCreatorCandidates(): Promise<CreatorCandidate[]> {
  const base = await readJsonFile<CreatorCandidate[]>("data/creator-candidates.json");
  const youtubeCandidatesPath = projectPath("data/youtube-creator-candidates.json");
  if (!existsSync(youtubeCandidatesPath)) {
    return base;
  }

  const youtubeCandidates = await readJsonFile<CreatorCandidate[]>(
    "data/youtube-creator-candidates.json"
  );
  return [...base, ...youtubeCandidates];
}

export async function loadRedditOpportunities(): Promise<RedditOpportunity[]> {
  return readJsonFile<RedditOpportunity[]>("data/reddit-opportunities.json");
}
