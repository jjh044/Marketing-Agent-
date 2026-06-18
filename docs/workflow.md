# Marketing Agent Workflow

## 1. Campaign Setup

Each app gets a campaign profile with:

- App name and category.
- Ideal creator size.
- Target content topics.
- Audience signals.
- Avoided creator categories.
- Partner page URL.
- Outreach tone and follow-up rules.
- Owner availability for meetings.

## 2. Creator Discovery

The agent searches for creators whose content overlaps with the app audience.

Use `data/ideal-creators.json` as the seed set for what a strong creator fit looks like.

For Meal Prep AI, discovery should prioritize:

- Meal prep creators.
- Personal trainers and fitness creators who discuss nutrition.
- Busy mom creators who show realistic food routines.
- Budget friendly food creators.
- Budget grocery and grocery haul creators.

Initial filters:

- 10,000 to 150,000 followers or subscribers.
- TikTok and YouTube discovery first.
- English-language content.
- Creator audience primarily in the United States or Australia.
- Medium to high engagement relative to creator size.
- Recent posting activity.
- Public contact method, such as email in bio or official creator contact.
- Content that naturally supports an app recommendation.

Ideal example signals:

- Content is practical, repeatable, and tied to real meal routines.
- The creator naturally talks to busy families, fitness-focused people, budget-conscious cooks, or people trying to eat well consistently.
- Engagement quality suggests followers ask questions, save ideas, or act on food planning advice.
- The creator feels reachable for a rev-share partnership rather than requiring a large paid sponsorship package.

## 3. Creator Scoring

Creators are scored from 0 to 100 using:

- Audience fit.
- Content fit.
- Creator size fit.
- Similarity to ideal creator examples.
- Contactability.
- Brand safety.
- Recent activity.

Recommended actions:

- 80 to 100: ready for outreach.
- 65 to 79: review before outreach.
- Below 65: skip unless manually approved.

## 4. Outreach

The agent generates a short personalized message using:

- Creator name or handle.
- A specific reference to their content.
- Why the app matches their audience.
- Partner page link.
- A simple call to action.

Current outreach rules:

- Use `creativesolutionssupport@gmail.com` for email outreach.
- Outreach channels may include TikTok, Instagram, X, or email.
- Contact one creator at a time.
- Contact no more than 3 creators per day.
- Require approval before first contact.
- Require approval before every message is sent.
- Keep the offer rev-share only.
- Do not include paid sponsorships unless the campaign is changed.
- Use a laid back, professional, Midwest-friendly tone.

Preferred contact order:

1. Public business email.
2. Official creator marketplace or official platform contact tool.
3. DM draft queued for manual approval or official API delivery.

## 5. Follow-Up

If there is no reply, the agent waits for the configured follow-up window.

Rules:

- Do not exceed the campaign maximum attempts.
- Do not contact creators marked as uninterested.
- Do not contact creators who ask not to be contacted.

## 6. Reply Handling

When a creator replies positively, the agent:

- Classifies the reply intent.
- Offers meeting times that match the owner schedule.
- Keeps the reply short and specific.
- Records the selected time once confirmed.

## 7. Reporting

The agent should report:

- Creators found.
- Creators approved for outreach.
- Messages sent or queued.
- Replies received.
- Meetings booked.
- Creators rejected and why.
