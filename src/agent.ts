import type { CampaignConfig, CreatorCandidate } from "./types.js";
import { scoreCreator } from "./scoring.js";

export function runAgent(campaign: CampaignConfig, creators: CreatorCandidate[]): void {
  console.log(`Campaign: ${campaign.app.name}`);
  console.log(`Partner page: ${campaign.app.partnerPageUrl}`);
  console.log(`Sender: ${campaign.outreach.senderName}`);
  console.log(`Outreach sender: ${campaign.outreach.senderEmail}`);
  console.log(`Approval required: ${campaign.outreach.requiresApprovalBeforeEveryMessage ? "yes" : "no"}`);
  console.log(`Daily contact limit: ${campaign.outreach.maxCreatorsContactedPerDay}`);
  console.log("");

  const scoredCreators = creators.map((creator) => ({
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
