import type { CampaignConfig, CreatorCandidate } from "./types.js";
import { scoreCreator } from "./scoring.js";

const sampleCreators: CreatorCandidate[] = [
  {
    handle: "@prepwithmaya",
    displayName: "Maya",
    platform: "TikTok",
    followers: 48200,
    country: "United States",
    language: "English",
    engagementLevel: "high",
    topics: ["meal prep", "high protein meals", "grocery hauls"],
    audienceSignals: ["busy professionals", "fitness beginners", "people who cook at home"],
    recentPostsLast30Days: 9,
    hasPublicEmail: true,
    brandSafetyFlags: [],
    contentReference: "weekly high-protein meal prep videos",
    specificContentAngle: "weekly high-protein meal prep"
  },
  {
    handle: "@budgetstudentbites",
    displayName: "Jordan",
    platform: "YouTube",
    followers: 13200,
    country: "Australia",
    language: "English",
    engagementLevel: "medium",
    topics: ["student meals", "budget meals", "grocery hauls"],
    audienceSignals: ["students", "people trying to eat healthier"],
    recentPostsLast30Days: 6,
    hasPublicEmail: false,
    brandSafetyFlags: [],
    contentReference: "budget grocery meal plans",
    specificContentAngle: "budget grocery meal plans"
  },
  {
    handle: "@luxuryplateclub",
    displayName: "Ari",
    platform: "YouTube",
    followers: 214000,
    country: "United States",
    language: "English",
    engagementLevel: "low",
    topics: ["restaurant reviews", "unrelated luxury lifestyle"],
    audienceSignals: ["restaurant fans"],
    recentPostsLast30Days: 2,
    hasPublicEmail: true,
    brandSafetyFlags: [],
    contentReference: "restaurant review channel",
    specificContentAngle: "restaurant reviews"
  }
];

export function runAgent(campaign: CampaignConfig): void {
  console.log(`Campaign: ${campaign.app.name}`);
  console.log(`Partner page: ${campaign.app.partnerPageUrl}`);
  console.log(`Sender: ${campaign.outreach.senderName}`);
  console.log(`Outreach sender: ${campaign.outreach.senderEmail}`);
  console.log(`Approval required: ${campaign.outreach.requiresApprovalBeforeEveryMessage ? "yes" : "no"}`);
  console.log(`Daily contact limit: ${campaign.outreach.maxCreatorsContactedPerDay}`);
  console.log("");

  const scoredCreators = sampleCreators.map((creator) => ({
    creator,
    score: scoreCreator(creator, campaign)
  }));

  for (const result of scoredCreators.sort((a, b) => b.score.total - a.score.total)) {
    console.log(`${result.creator.displayName} ${result.creator.handle}`);
    console.log(`Platform: ${result.creator.platform}`);
    console.log(`Followers: ${result.creator.followers.toLocaleString()}`);
    console.log(`Score: ${result.score.total}/100`);
    console.log(`Recommendation: ${result.score.recommendation}`);
    console.log(`Message angle: ${result.creator.specificContentAngle}`);
    console.log(`Why: ${result.score.reasons.join("; ")}`);
    console.log("");
  }
}
