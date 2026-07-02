# Run Local

Open a terminal in this folder and run:

```powershell
npm install
npm run dashboard
```

Then open:

```text
http://localhost:5173
```

Optional API keys can be placed in `.env.local`:

```text
RAPIDAPI_REDDIT_KEY=your-key
YOUTUBE_RAPIDAPI_KEY=your-key
```

Useful commands:

```powershell
npm run integrations:check
npm run reddit:scan
npm run youtube:import-creators
```
