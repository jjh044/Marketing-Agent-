import type { CampaignConfig, CreatorCandidate } from "./types.js";

export function creatorId(creator: CreatorCandidate): string {
  return `${creator.platform}:${creator.handle}`.toLowerCase();
}

export function renderEmail(creator: CreatorCandidate, campaign: CampaignConfig): string {
  return [
    "Subject: Quick Meal Prep AI partner idea",
    "",
    `Hey ${creator.displayName},`,
    "",
    `I am reaching out because your content around ${creator.specificContentAngle} feels really aligned with what we are building at Meal Prep AI.`,
    "",
    "It helps people plan meals, prep smarter, and make cooking feel less chaotic, especially for busy families, fitness-focused folks, and anyone trying to eat well without overthinking it.",
    "",
    "We are starting a small creator partner program built around rev share, not paid sponsorships, and I thought your audience might be a strong fit.",
    "",
    "Here is the quick overview:",
    campaign.app.partnerPageUrl,
    "",
    "No pressure at all, but if it seems interesting, I would be happy to send over details or find a time to talk.",
    "",
    "Thanks,",
    campaign.outreach.senderName,
    "Meal Prep AI"
  ].join("\n");
}

export function renderDm(creator: CreatorCandidate, campaign: CampaignConfig): string {
  return [
    `Hey ${creator.displayName}, I am reaching out because your content around ${creator.specificContentAngle} feels really aligned with what we are building at Meal Prep AI.`,
    "",
    "It helps people plan meals, prep smarter, and make cooking feel less chaotic, especially for busy families, fitness-focused folks, and anyone trying to eat well without overthinking it.",
    "",
    "We are starting a small creator partner program built around rev share, not paid sponsorships, and I thought your audience might be a strong fit.",
    "",
    "Here is the quick overview:",
    campaign.app.partnerPageUrl,
    "",
    "No pressure at all, but if it seems interesting, I would be happy to send over details or find a time to talk."
  ].join("\n");
}
