import { dashboardData, writeDecision } from "../dist/dashboard-data.js";
import { authConfigured, readSessionFromRequest } from "../dist/auth.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (authConfigured() && !readSessionFromRequest(request)) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const appId = typeof body?.appId === "string" ? body.appId : undefined;

    if (!body?.id || !["approved", "rejected"].includes(body.status)) {
      response.status(400).json({ error: "Expected id and status." });
      return;
    }

    await writeDecision(body.id, body.status, appId);
    response.status(200).json(await dashboardData(appId));
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}
