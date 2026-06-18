# Reddit Outreach Workflow

The Reddit channel is for finding relevant public posts where people are struggling with meal planning, meal prep, cooking decisions, or recipe-search fatigue.

## Search Intents

The agent should scan for posts similar to:

- "I hate meal prep"
- "I don't know what to cook"
- "Tired of searching for meals"
- "Meal prep is overwhelming"
- "What should I cook this week?"
- "I never know what to make for dinner"
- "Healthy meals are too much work"
- "Budget meal ideas"

## Response Rules

- Draft helpful advice first.
- Only mention Meal Prep AI when the app is directly relevant to the post.
- Disclose the connection when Meal Prep AI is mentioned.
- Do not pretend to be an unaffiliated user.
- Do not mass-post repeated comments.
- Do not comment in subreddits that prohibit self-promotion or app links.
- Require approval before every Reddit comment.

## Comment Style

The comment should feel like a useful human reply:

- Casual and sincere.
- Specific to the post.
- Low pressure.
- No hype language.
- No direct sales pitch.
- No fake personal story unless it is true.

## Approval Flow

1. The agent finds a relevant Reddit post.
2. The agent classifies the post intent and relevance.
3. The agent drafts a comment.
4. The dashboard shows the post, reason, and draft comment.
5. James approves, rejects, or edits the draft.
6. Posting remains manual or uses an approved Reddit API integration later.

## RapidAPI Search

The project includes a RapidAPI Reddit search client at `src/reddit-search.ts`.

Set the API key in the current terminal session:

```powershell
$env:RAPIDAPI_REDDIT_KEY="your-key"
```

Run a scan:

```powershell
npm run reddit:scan
```

The scanner uses the campaign's configured `reddit.scanQueries`, calls `reddit34.p.rapidapi.com/getSearchPosts`, and overwrites `data/reddit-opportunities.json` with draftable opportunities.

Do not commit API keys. Keep them in environment variables or a local `.env` file that is ignored by git.
