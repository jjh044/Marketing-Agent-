import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { CampaignConfig } from "./types.js";
import { runAgent } from "./agent.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const campaignPath = resolve(currentDir, "../campaigns/meal-prep-ai.json");
const campaign = JSON.parse(await readFile(campaignPath, "utf8")) as CampaignConfig;

runAgent(campaign);
