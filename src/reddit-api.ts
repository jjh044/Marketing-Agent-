import https from "node:https";

export function redditApiKey(): string {
  const apiKey = process.env.RAPIDAPI_REDDIT_KEY;
  if (!apiKey) {
    throw new Error("Missing RAPIDAPI_REDDIT_KEY environment variable.");
  }

  return apiKey;
}

export function requestRedditJson<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        method: "GET",
        hostname: "reddit34.p.rapidapi.com",
        path,
        headers: {
          "x-rapidapi-key": redditApiKey(),
          "x-rapidapi-host": "reddit34.p.rapidapi.com",
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
            reject(new Error(`RapidAPI Reddit request failed: ${response.statusCode} ${body}`));
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
