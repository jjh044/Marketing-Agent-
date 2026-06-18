import type { CampaignConfig, CreatorCandidate, RedditOpportunity } from "./types.js";

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

export function redditOpportunityId(opportunity: RedditOpportunity): string {
  return opportunity.id.toLowerCase();
}

export function renderRedditComment(
  opportunity: RedditOpportunity,
  campaign: CampaignConfig
): string {
  const advice = [
    `I get this. ${opportunity.painPoint} The part that usually makes it harder is trying to solve the whole week at once.`,
    "",
    `One thing that helps is to make it smaller: ${opportunity.helpfulAngle}. That gives you a starting point without turning dinner into a research project.`,
    "",
    "A simple formula that works for a lot of people is protein + carb + vegetable + sauce. Keep 2-3 default combinations around, then swap the sauce or side when you get bored."
  ];

  if (!opportunity.shouldMentionApp) {
    return [
      ...advice,
      "",
      "That usually beats searching from scratch every time, at least for getting through a normal week."
    ].join("\n");
  }

  return [
    ...advice,
    "",
    `Since this is directly related, I should be upfront that I am connected to ${campaign.app.name}. It is built around this exact problem: turning \"I have no idea what to cook\" into a simple meal plan and grocery list without digging through recipes forever.`,
    "",
    "Not trying to hard sell it, but it may be useful if the planning part is what keeps getting in your way. Either way, I would start with a small rotation before trying to build a full meal-prep system."
  ].join("\n");
}
