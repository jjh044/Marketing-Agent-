import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { projectPath } from "./data.js";
import { dashboardData, writeDecision, type DecisionStatus } from "./dashboard-data.js";

const port = Number(process.env.PORT ?? 5173);

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function sendText(response: ServerResponse, status: number, body: string, contentType: string): void {
  response.writeHead(status, { "content-type": contentType });
  response.end(body);
}

async function parseBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

async function serveStatic(pathname: string, response: ServerResponse): Promise<void> {
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = join(projectPath("public"), relativePath);
  const extension = extname(filePath);
  const contentTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8"
  };

  try {
    const file = await readFile(filePath, "utf8");
    sendText(response, 200, file, contentTypes[extension] ?? "text/plain; charset=utf-8");
  } catch {
    sendText(response, 404, "Not found", "text/plain; charset=utf-8");
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "GET" && url.pathname === "/api/dashboard") {
      sendJson(response, 200, await dashboardData());
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/decision") {
      const body = await parseBody<{ id: string; status: DecisionStatus }>(request);
      if (!body.id || !["approved", "rejected"].includes(body.status)) {
        sendJson(response, 400, { error: "Expected id and status." });
        return;
      }

      await writeDecision(body.id, body.status);
      sendJson(response, 200, await dashboardData());
      return;
    }

    if (request.method === "GET") {
      await serveStatic(url.pathname, response);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : "Unknown error" });
  }
});

server.listen(port, () => {
  console.log(`Marketing agent dashboard: http://localhost:${port}`);
});
