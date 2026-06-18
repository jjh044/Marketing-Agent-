import https from "node:https";
import { loadLocalEnv } from "./env.js";

export function youtubeApiKey(): string {
  loadLocalEnv();
  const apiKey = process.env.YOUTUBE_RAPIDAPI_KEY ?? process.env.RAPIDAPI_YOUTUBE_KEY;
  if (!apiKey) {
    throw new Error("Missing YOUTUBE_RAPIDAPI_KEY environment variable.");
  }

  return apiKey;
}

export function requestYouTubeJson<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        method: "GET",
        hostname: "youtube138.p.rapidapi.com",
        path,
        headers: {
          "x-rapidapi-key": youtubeApiKey(),
          "x-rapidapi-host": "youtube138.p.rapidapi.com",
          "Content-Type": "application/json"
        }
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (!response.statusCode || response.statusCode >= 400) {
            reject(new Error(`RapidAPI YouTube request failed: ${response.statusCode} ${body}`));
            return;
          }

          resolve(JSON.parse(body) as T);
        });
      }
    );

    request.on("error", reject);
    request.end();
  });
}
