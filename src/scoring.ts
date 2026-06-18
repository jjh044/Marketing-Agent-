import type { CampaignConfig, CreatorCandidate, CreatorScore } from "./types.js";

function overlapScore(values: string[], targets: string[], maxScore: number): number {
  const normalizedValues = values.map((value) => value.toLowerCase());
  const matches = targets.filter((target) =>
    normalizedValues.some((value) => value.includes(target.toLowerCase()))
  );

  if (targets.length === 0) {
    return 0;
  }

  return Math.min(maxScore, Math.round((matches.length / Math.min(targets.length, 5)) * maxScore));
}

export function scoreCreator(
  creator: CreatorCandidate,
  campaign: CampaignConfig
): CreatorScore {
  const reasons: string[] = [];
  const profile = campaign.creatorProfile;

  const inSizeRange =
    creator.followers >= profile.minFollowers && creator.followers <= profile.maxFollowers;
  const sizeFit = inSizeRange ? 15 : 0;
  const platformFit = profile.discoveryPlatforms.includes(creator.platform) ? 5 : 0;
  const countryFit = profile.countries.includes(creator.country) ? 5 : 0;
  const languageFit = profile.languages.includes(creator.language) ? 5 : 0;
  const engagementFit =
    creator.engagementLevel === "high" ? 10 : creator.engagementLevel === "medium" ? 7 : 0;

  if (inSizeRange) {
    reasons.push(`creator size is in range at ${creator.followers.toLocaleString()} followers`);
  } else {
    reasons.push(`creator size is outside target range at ${creator.followers.toLocaleString()}`);
  }

  if (platformFit > 0) {
    reasons.push(`${creator.platform} is a priority discovery platform`);
  }

  if (countryFit > 0 && languageFit > 0) {
    reasons.push(`${creator.language}-language creator in ${creator.country}`);
  }

  const contentFit = overlapScore(creator.topics, profile.targetTopics, 20);
  const audienceFit = overlapScore(creator.audienceSignals, profile.audienceSignals, 20);
  const contactability = creator.hasPublicEmail ? 10 : 4;
  const activity = Math.min(10, creator.recentPostsLast30Days * 2);

  const avoidedTopicHit = profile.avoidTopics.some((topic) =>
    creator.topics.some((creatorTopic) =>
      creatorTopic.toLowerCase().includes(topic.toLowerCase())
    )
  );
  const hasSafetyFlags = creator.brandSafetyFlags.length > 0 || avoidedTopicHit;
  const brandSafety = hasSafetyFlags ? 0 : 10;

  if (contentFit >= 15) {
    reasons.push("content topics line up with the campaign");
  }

  if (audienceFit >= 15) {
    reasons.push("audience signals match likely app users");
  }

  if (creator.hasPublicEmail) {
    reasons.push("public email is available");
  }

  if (hasSafetyFlags) {
    reasons.push("brand safety or avoided-topic flags need review");
  }

  const rawTotal =
    sizeFit +
    platformFit +
    countryFit +
    languageFit +
    engagementFit +
    contentFit +
    audienceFit +
    contactability +
    activity +
    brandSafety;
  const total = Math.min(100, rawTotal);
  const recommendation =
    total >= 80 && !hasSafetyFlags ? "outreach" : total >= 65 ? "review" : "skip";

  return {
    total,
    audienceFit,
    contentFit,
    sizeFit,
    contactability,
    activity,
    brandSafety,
    recommendation,
    reasons
  };
}
