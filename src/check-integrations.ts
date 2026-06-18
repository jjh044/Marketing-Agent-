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
  }
];

for (const check of checks) {
  const configured = check.variables.some((name) => Boolean(process.env[name]));
  console.log(`${configured ? "OK" : "MISSING"} ${check.name}`);
}
