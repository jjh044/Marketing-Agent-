import { readFile, writeFile } from "node:fs/promises";
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

export async function loadCampaign(): Promise<CampaignConfig> {
  return readJsonFile<CampaignConfig>("campaigns/meal-prep-ai.json");
}

export async function loadCreatorCandidates(): Promise<CreatorCandidate[]> {
  return readJsonFile<CreatorCandidate[]>("data/creator-candidates.json");
}

export async function loadRedditOpportunities(): Promise<RedditOpportunity[]> {
  return readJsonFile<RedditOpportunity[]>("data/reddit-opportunities.json");
}
