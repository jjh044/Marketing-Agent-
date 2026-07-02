import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { loadLocalEnv } from "./env.js";

export interface AuthUser {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
}

export interface AuthSession {
  user: AuthUser;
  createdAt: string;
}

export const sessionCookieName = "ama_session";
const stateCookieName = "ama_oauth_state";
const cookieMaxAgeSeconds = 60 * 60 * 24 * 7;

interface CookieOptions {
  httpOnly?: boolean;
  maxAge?: number;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
  path?: string;
}

export function authConfigured(): boolean {
  loadLocalEnv();
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

function sessionSecret(): string {
  loadLocalEnv();
  return process.env.AUTH_COOKIE_SECRET || process.env.GITHUB_CLIENT_SECRET || "local-dev-secret";
}

function base64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function secureCompare(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createSessionToken(session: AuthSession): string {
  const payload = base64Url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): AuthSession | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !secureCompare(sign(payload), signature)) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(payload)) as AuthSession;
  } catch {
    return null;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of header?.split(";") ?? []) {
    const [name, ...value] = part.trim().split("=");
    if (name) {
      cookies[name] = decodeURIComponent(value.join("="));
    }
  }
  return cookies;
}

export function readSessionFromRequest(request: IncomingMessage): AuthSession | null {
  const cookies = parseCookies(request.headers.cookie);
  return readSessionToken(cookies[sessionCookieName]);
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? "/"}`,
    `SameSite=${options.sameSite ?? "Lax"}`
  ];

  if (options.httpOnly ?? true) {
    parts.push("HttpOnly");
  }

  if (options.secure ?? (process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL))) {
    parts.push("Secure");
  }

  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  return parts.join("; ");
}

export function sessionCookie(session: AuthSession): string {
  return serializeCookie(sessionCookieName, createSessionToken(session), {
    maxAge: cookieMaxAgeSeconds
  });
}

export function clearSessionCookie(): string {
  return serializeCookie(sessionCookieName, "", { maxAge: 0 });
}

export function createStateCookie(state: string): string {
  return serializeCookie(stateCookieName, state, { maxAge: 600 });
}

export function readStateCookie(request: IncomingMessage): string | null {
  return parseCookies(request.headers.cookie)[stateCookieName] ?? null;
}

export function clearStateCookie(): string {
  return serializeCookie(stateCookieName, "", { maxAge: 0 });
}

export function requireGithubEnv(): { clientId: string; clientSecret: string } {
  loadLocalEnv();
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.");
  }

  return { clientId, clientSecret };
}

export function requestOrigin(request: IncomingMessage): string {
  const forwardedHost = request.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost || request.headers.host || "localhost:5173";
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto || (host.toString().includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export function oauthState(): string {
  return `${Date.now().toString(36)}-${createHmac("sha256", sessionSecret())
    .update(`${Date.now()}-${Math.random()}`)
    .digest("hex")
    .slice(0, 32)}`;
}
