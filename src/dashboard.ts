import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import {
  loadCampaign,
  loadCreatorCandidates,
  loadRedditOpportunities,
  projectPath,
  readJsonFile,
  writeJsonFile
} from "./data.js";
import {
  creatorId,
  redditOpportunityId,
  renderDm,
  renderEmail,
  renderRedditComment
} from "./outreach.js";
import { scoreCreator } from "./scoring.js";

type DecisionStatus = "approved" | "rejected";

interface ApprovalDecision {
  status: DecisionStatus;
  decidedAt: string;
}

type ApprovalDecisions = Record<string, ApprovalDecision>;

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

async function readDecisions(): Promise<ApprovalDecisions> {
  return readJsonFile<ApprovalDecisions>("data/approval-decisions.json");
}

async function writeDecision(id: string, status: DecisionStatus): Promise<ApprovalDecisions> {
  const decisions = await readDecisions();
  decisions[id] = {
    status,
    decidedAt: new Date().toISOString()
  };
  await writeJsonFile("data/approval-decisions.json", decisions);
  return decisions;
}

async function dashboardData(): Promise<unknown> {
  const [campaign, creators, redditOpportunities, decisions] = await Promise.all([
    loadCampaign(),
    loadCreatorCandidates(),
    loadRedditOpportunities(),
    readDecisions()
  ]);

  const creatorCandidates = creators
    .map((creator) => {
      const id = creatorId(creator);
      const score = scoreCreator(creator, campaign);
      return {
        id,
        creator,
        score,
        decision: decisions[id] ?? null,
        drafts: {
          email: renderEmail(creator, campaign),
          dm: renderDm(creator, campaign)
        }
      };
    })
    .sort((a, b) => b.score.total - a.score.total);

  const redditCandidates = redditOpportunities.map((opportunity) => {
    const id = redditOpportunityId(opportunity);
    const score = {
      total: opportunity.relevance === "high" ? 86 : opportunity.relevance === "medium" ? 70 : 45,
      recommendation: opportunity.relevance === "low" ? "skip" : "review",
      reasons: [
        `post intent: ${opportunity.intent}`,
        `pain point: ${opportunity.painPoint}`,
        opportunity.shouldMentionApp
          ? "Meal Prep AI can be mentioned with disclosure"
          : "draft should stay advice-only without mentioning the app"
      ]
    };

    return {
      id,
      type: "reddit",
      reddit: opportunity,
      score,
      decision: decisions[id] ?? null,
      drafts: {
        reddit: renderRedditComment(opportunity, campaign)
      }
    };
  });

  return { campaign, candidates: [...creatorCandidates, ...redditCandidates] };
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
