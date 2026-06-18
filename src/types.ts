export type Platform = "TikTok" | "Instagram" | "YouTube" | "X" | "Email" | "Other";

export interface CampaignConfig {
  app: {
    name: string;
    category: string;
    shortDescription: string;
    partnerPageUrl: string;
    storeLinksAvailable: boolean;
  };
  creatorProfile: {
    minFollowers: number;
    maxFollowers: number;
    discoveryPlatforms: Platform[];
    outreachChannels: Platform[];
    preferredPlatforms: Platform[];
    countries: string[];
    languages: string[];
    engagementLevel: string;
    targetTopics: string[];
    avoidTopics: string[];
    audienceSignals: string[];
  };
  outreach: {
    senderName: string;
    senderEmail: string;
    tone: string;
    offerSummary: string;
    dealType: string;
    excludePaidSponsorships: boolean;
    primaryCallToAction: string;
    followUpAfterDays: number;
    maxAttemptsPerCreator: number;
    maxCreatorsContactedPerDay: number;
    contactOneAtATime: boolean;
    requiresApprovalBeforeFirstContact: boolean;
    requiresApprovalBeforeEveryMessage: boolean;
  };
  schedule: {
    timezone: string;
    meetingLengthMinutes: number;
    availableWindows: Array<{
      days: string[];
      start: string;
      end: string;
    }>;
  };
}

export interface CreatorCandidate {
  handle: string;
  displayName: string;
  platform: Platform;
  followers: number;
  country: string;
  language: string;
  engagementLevel: "low" | "medium" | "high";
  topics: string[];
  audienceSignals: string[];
  recentPostsLast30Days: number;
  hasPublicEmail: boolean;
  brandSafetyFlags: string[];
  contentReference: string;
  specificContentAngle: string;
}

export interface CreatorScore {
  total: number;
  audienceFit: number;
  contentFit: number;
  sizeFit: number;
  contactability: number;
  activity: number;
  brandSafety: number;
  recommendation: "outreach" | "review" | "skip";
  reasons: string[];
}
