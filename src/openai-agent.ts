import { loadLocalEnv } from "./env.js";
import type { CampaignConfig, CreatorScore } from "./types.js";

type Recommendation = CreatorScore["recommendation"];

interface CandidateForAi {
  id: string;
  type: "creator" | "reddit";
  summary: unknown;
  score: {
    total: number;
    recommendation: Recommendation | "review" | "skip";
    reasons: string[];
  };
  drafts: Record<string, string>;
}

interface AiCandidateResult {
  id: string;
  score?: {
    total?: number;
    recommendation?: Recommendation;
    reasons?: string[];
  };
  drafts?: Record<string, string>;
}

interface OpenAiResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
}

function openAiApiKey(): string | null {
  loadLocalEnv();
  return process.env.OPENAI_API_KEY || null;
}

function parseOpenAiText(response: OpenAiResponse): string {
  if (response.output_text) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include text output.");
}

function clampScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function validRecommendation(value: unknown): Recommendation | null {
  return value === "outreach" || value === "review" || value === "skip" ? value : null;
}

function mergeAiResult(candidate: CandidateForAi, result: AiCandidateResult): CandidateForAi {
  const total = clampScore(result.score?.total);
  const recommendation = validRecommendation(result.score?.recommendation);
  const reasons = Array.isArray(result.score?.reasons)
    ? result.score.reasons.filter((reason) => typeof reason === "string").slice(0, 5)
    : null;

  const drafts =
    result.drafts && typeof result.drafts === "object"
      ? Object.fromEntries(
          Object.entries(result.drafts).filter(([, value]) => typeof value === "string")
        )
      : {};

  return {
    ...candidate,
    score: {
      ...candidate.score,
      ...(total === null ? {} : { total }),
      ...(recommendation === null ? {} : { recommendation }),
      ...(reasons && reasons.length > 0 ? { reasons } : {})
    },
    drafts: {
      ...candidate.drafts,
      ...drafts
    }
  };
}

export async function enhanceCandidatesWithOpenAi(
  candidates: CandidateForAi[],
  campaign: CampaignConfig
): Promise<CandidateForAi[]> {
  const apiKey = openAiApiKey();
  if (!apiKey || candidates.length === 0) {
    return candidates;
  }

  const limit = Number(process.env.OPENAI_DASHBOARD_LIMIT ?? 1);
  const selected = candidates.slice(0, Number.isFinite(limit) && limit > 0 ? limit : 1);
  const remaining = candidates.slice(selected.length);
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(12000),
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "You score creator outreach and Reddit opportunity candidates for an app founder. Return concise, practical JSON only. Keep outreach approval-first, helpful, and transparent. Do not imply messages are already sent."
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                "Improve scoring and drafts. Return JSON with an items array. Each item needs id, score.total 0-100, score.recommendation outreach|review|skip, score.reasons 3-5 strings, and drafts. Creator drafts should include email and dm. Reddit drafts should include reddit. Keep drafts specific to the candidate and app.",
              app: campaign.app,
              outreach: campaign.outreach,
              creatorProfile: campaign.creatorProfile,
              redditRules: campaign.reddit.rules,
              candidates: selected
            })
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "candidate_enrichment",
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["items"],
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["id", "score", "drafts"],
                    properties: {
                      id: { type: "string" },
                      score: {
                        type: "object",
                        additionalProperties: false,
                        required: ["total", "recommendation", "reasons"],
                        properties: {
                          total: { type: "number" },
                          recommendation: {
                            type: "string",
                            enum: ["outreach", "review", "skip"]
                          },
                          reasons: {
                            type: "array",
                            items: { type: "string" }
                          }
                        }
                      },
                      drafts: {
                        type: "object",
                        additionalProperties: false,
                        required: ["email", "dm", "reddit"],
                        properties: {
                          email: { type: "string" },
                          dm: { type: "string" },
                          reddit: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
    });

    const body = (await response.json()) as OpenAiResponse & { error?: { message?: string } };
    if (!response.ok) {
      throw new Error(body.error?.message ?? `OpenAI request failed with ${response.status}`);
    }

    const parsed = JSON.parse(parseOpenAiText(body)) as { items?: AiCandidateResult[] };
    const results = new Map((parsed.items ?? []).map((item) => [item.id, item]));
    const enhanced = selected.map((candidate) => {
      const result = results.get(candidate.id);
      return result ? mergeAiResult(candidate, result) : candidate;
    });

    return [...enhanced, ...remaining];
  } catch (error) {
    console.warn(
      `OpenAI enhancement skipped: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return candidates;
  }
}
