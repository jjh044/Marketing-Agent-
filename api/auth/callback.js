import {
  authSuccessHeaders,
  exchangeGitHubCode,
  fetchGitHubSession
} from "../../dist/github-oauth.js";
import { clearStateCookie, readStateCookie, requireGithubEnv } from "../../dist/auth.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const url = new URL(request.url ?? "/api/auth/callback", `http://${request.headers.host}`);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const expectedState = readStateCookie(request);

    if (!code || !state || !expectedState || state !== expectedState) {
      response.writeHead(302, {
        "set-cookie": clearStateCookie(),
        location: "/?auth=failed"
      });
      response.end();
      return;
    }

    const { clientId, clientSecret } = requireGithubEnv();
    const accessToken = await exchangeGitHubCode({ code, clientId, clientSecret });
    const session = await fetchGitHubSession(accessToken);

    response.writeHead(302, authSuccessHeaders(session));
    response.end();
  } catch {
    response.writeHead(302, {
      "set-cookie": clearStateCookie(),
      location: "/?auth=failed"
    });
    response.end();
  }
}
