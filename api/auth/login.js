import { createStateCookie, oauthState, requireGithubEnv, requestOrigin } from "../../dist/auth.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { clientId } = requireGithubEnv();
    const state = oauthState();
    const redirectUri = `${requestOrigin(request)}/api/auth/callback`;
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "read:user");
    url.searchParams.set("state", state);

    response.setHeader("set-cookie", createStateCookie(state));
    response.writeHead(302, { location: url.toString() });
    response.end();
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}
