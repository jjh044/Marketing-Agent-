import { clearStateCookie, sessionCookie, type AuthSession } from "./auth.js";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export async function exchangeGitHubCode(params: {
  code: string;
  clientId: string;
  clientSecret: string;
}): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code
    })
  });

  const body = (await response.json()) as GitHubTokenResponse;
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description ?? body.error ?? "GitHub token exchange failed.");
  }

  return body.access_token;
}

export async function fetchGitHubSession(accessToken: string): Promise<AuthSession> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${accessToken}`,
      "user-agent": "app-marketing-agent"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub user request failed with ${response.status}.`);
  }

  const user = (await response.json()) as GitHubUserResponse;
  return {
    createdAt: new Date().toISOString(),
    user: {
      id: user.id,
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url
    }
  };
}

export function authSuccessHeaders(session: AuthSession): Record<string, string | string[]> {
  return {
    "set-cookie": [sessionCookie(session), clearStateCookie()],
    location: "/"
  };
}
