import { dashboardData } from "../dist/dashboard-data.js";
import { authConfigured, readSessionFromRequest } from "../dist/auth.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (authConfigured() && !readSessionFromRequest(request)) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    const url = new URL(request.url ?? "/api/dashboard", `http://${request.headers.host}`);
    response.status(200).json(await dashboardData(url.searchParams.get("appId") ?? undefined));
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}
