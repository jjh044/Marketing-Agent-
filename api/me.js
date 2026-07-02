import { authConfigured, readSessionFromRequest } from "../dist/auth.js";
import { listApps } from "../dist/data.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    response.status(200).json({
      authConfigured: authConfigured(),
      session: readSessionFromRequest(request),
      apps: await listApps()
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}
