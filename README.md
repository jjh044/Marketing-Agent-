# App Marketing Agent

An automation-first marketing agent for finding aligned content creators, scoring fit, preparing outreach, and managing replies for mobile app partnerships.

The first configured campaign is for a Meal Prep AI mobile app.

## What It Does

1. Defines the audience and creator profile for each app.
2. Finds creators in the target size range.
3. Scores creators against app fit, content fit, audience fit, and partnership fit.
4. Creates personalized outreach messages.
5. Queues creator contact attempts.
6. Tracks replies and meeting interest.
7. Suggests meeting times that match your availability.

## Automation Boundaries

The agent is designed to be as automatic as possible while avoiding account risk:

- Email outreach can be automated through a real email provider once credentials are connected.
- Social DMs should use official APIs where available or go through a human approval queue.
- The agent stores every outreach attempt so duplicate or excessive messaging can be avoided.
- Unsubscribe and do-not-contact handling should be enforced before production use.

## Project Layout

```text
campaigns/
  meal-prep-ai.json       App-specific audience, creator, and outreach settings
docs/
  workflow.md             End-to-end agent workflow
  partner-page.md         Draft partner page copy
data/
  ideal-creators.json     Seed examples of creators that match the desired fit
templates/
  outreach-email.md       Creator email template
  outreach-dm.md          Creator DM template
src/
  index.ts                CLI entry point
  agent.ts                Main workflow runner
  scoring.ts              Creator scoring model
  types.ts                Shared types
```

## Quick Start

Install dependencies:

```bash
npm install
```

Run the starter agent:

```bash
npm run start
```

This currently runs against sample creator data so the workflow can be reviewed before connecting live data sources.

Run the local approval dashboard:

```bash
npm run dashboard
```

Then open:

```text
http://localhost:5173
```

Approvals and rejections are saved to `data/approval-decisions.json`.

## Next Integrations

- Creator discovery APIs or curated CSV imports.
- Email provider, such as Gmail API, Microsoft Graph, SendGrid, or Resend.
- Calendar provider, such as Google Calendar or Microsoft Outlook.
- CRM or database for creator records.
- Partner page hosting.
