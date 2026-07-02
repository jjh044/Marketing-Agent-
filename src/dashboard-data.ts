import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import {
  loadCampaign,
  loadCreatorCandidates,
  loadRedditOpportunities,
  projectPath,
  readJsonFile,
  writeJsonFile
} from "./data.js";
import {
  creatorId,
  redditOpportunityId,
  renderDm,
  renderEmail,
  renderRedditComment
} from "./outreach.js";
import { enhanceCandidatesWithOpenAi } from "./openai-agent.js";
import { scoreCreator } from "./scoring.js";

export type DecisionStatus = "approved" | "rejected";

export interface ApprovalDecision {
  status: DecisionStatus;
  decidedAt: string;
}

type ApprovalDecisions = Record<string, ApprovalDecision>;

const decisionsPath = process.env.VERCEL
  ? resolve(tmpdir(), "approval-decisions.json")
  : projectPath("data/approval-decisions.json");

async function readDecisions(): Promise<ApprovalDecisions> {
  if (process.env.VERCEL && existsSync(decisionsPath)) {
    return JSON.parse(await readFile(decisionsPath, "utf8")) as ApprovalDecisions;
  }

  return readJsonFile<ApprovalDecisions>("data/approval-decisions.json");
}

async function writeDecisions(decisions: ApprovalDecisions): Promise<void> {
  if (process.env.VERCEL) {
    await mkdir(dirname(decisionsPath), { recursive: true });
    await writeFile(decisionsPath, `${JSON.stringify(decisions, null, 2)}\n`, "utf8");
    return;
  }

  await writeJsonFile("data/approval-decisions.json", decisions);
}

export async function writeDecision(
  id: string,
  status: DecisionStatus
): Promise<ApprovalDecisions> {
  const decisions = await readDecisions();
  decisions[id] = {
    status,
    decidedAt: new Date().toISOString()
  };
  await writeDecisions(decisions);
  return decisions;
}

export async function dashboardData(): Promise<unknown> {
  const [campaign, creators, redditOpportunities, decisions] = await Promise.all([
    loadCampaign(),
    loadCreatorCandidates(),
    loadRedditOpportunities(),
    readDecisions()
  ]);

  const creatorCandidates = creators
    .map((creator) => {
      const id = creatorId(creator);
      const score = scoreCreator(creator, campaign);
      return {
        id,
        type: "creator" as const,
        creator,
        summary: {
          displayName: creator.displayName,
          platform: creator.platform,
          handle: creator.handle,
          followers: creator.followers,
          country: creator.country,
          language: creator.language,
          engagementLevel: creator.engagementLevel,
          topics: creator.topics,
          audienceSignals: creator.audienceSignals,
          recentPostsLast30Days: creator.recentPostsLast30Days,
          hasPublicEmail: creator.hasPublicEmail,
          brandSafetyFlags: creator.brandSafetyFlags,
          specificContentAngle: creator.specificContentAngle
        },
        score,
        decision: decisions[id] ?? null,
        drafts: {
          email: renderEmail(creator, campaign),
          dm: renderDm(creator, campaign)
        }
      };
    })
    .sort((a, b) => b.score.total - a.score.total);

  const redditCandidates = redditOpportunities.map((opportunity) => {
    const id = redditOpportunityId(opportunity);
    const recommendation = opportunity.relevance === "low" ? "skip" : "review";
    const score = {
      total: opportunity.relevance === "high" ? 86 : opportunity.relevance === "medium" ? 70 : 45,
      recommendation: recommendation as "review" | "skip",
      reasons: [
        `post intent: ${opportunity.intent}`,
        `pain point: ${opportunity.painPoint}`,
        opportunity.shouldMentionApp
          ? "Meal Prep AI can be mentioned with disclosure"
          : "draft should stay advice-only without mentioning the app"
      ]
    };

    return {
      id,
      type: "reddit" as const,
      reddit: opportunity,
      summary: {
        subreddit: opportunity.subreddit,
        postTitle: opportunity.postTitle,
        intent: opportunity.intent,
        painPoint: opportunity.painPoint,
        relevance: opportunity.relevance,
        shouldMentionApp: opportunity.shouldMentionApp,
        helpfulAngle: opportunity.helpfulAngle
      },
      score,
      decision: decisions[id] ?? null,
      drafts: {
        reddit: renderRedditComment(opportunity, campaign)
      }
    };
  });

  const candidates = await enhanceCandidatesWithOpenAi(
    [...creatorCandidates, ...redditCandidates],
    campaign
  );

  return { campaign, candidates };
}
