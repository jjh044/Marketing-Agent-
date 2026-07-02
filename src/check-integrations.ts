import { loadLocalEnv } from "./env.js";

loadLocalEnv();

const checks = [
  {
    name: "Reddit RapidAPI",
    variables: ["RAPIDAPI_REDDIT_KEY"]
  },
  {
    name: "YouTube RapidAPI",
    variables: ["YOUTUBE_RAPIDAPI_KEY", "RAPIDAPI_YOUTUBE_KEY"]
  },
  {
    name: "OpenAI",
    variables: ["OPENAI_API_KEY"]
  },
  {
    name: "GitHub OAuth",
    variables: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    requireAll: true
  },
  {
    name: "Auth Cookie Secret",
    variables: ["AUTH_COOKIE_SECRET"]
  }
];

for (const check of checks) {
  const configured = check.requireAll
    ? check.variables.every((name) => Boolean(process.env[name]))
    : check.variables.some((name) => Boolean(process.env[name]));
  console.log(`${configured ? "OK" : "MISSING"} ${check.name}`);
}
