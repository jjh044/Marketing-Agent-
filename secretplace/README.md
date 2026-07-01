# secretplace

secretplace is a distraction-free Bible study app for iOS, Android, and web. The app starts a timed study session, quiets the phone where the operating system allows it, lets the user enter a passage, and returns word-study notes, a summary, and reflection questions.

## Run locally

Fastest option on Windows:

```powershell
.\start-local.ps1
```

Or double-click:

```text
start-local.cmd
```

Then open:

```text
http://127.0.0.1:4173
```

Manual option:

```powershell
npm install
npm run build:web
npm run preview
```

## Deploy to Vercel

Set the Vercel project root to `secretplace`.

Build command:

```text
npm run build:web
```

Output directory:

```text
dist
```

Optional environment variable:

```text
OPENAI_API_KEY=...
```

Without `OPENAI_API_KEY`, the API returns a local study guide fallback so the app still works.

## Native focus behavior

Android can request notification policy access and use Do Not Disturb during a session. iOS does not allow a normal third-party app to silently enable global Focus / Do Not Disturb, so the iOS module returns a guided mode response. The iOS product flow should prompt the user to start their Focus mode or use Screen Time-style controls with the required Apple entitlements.
