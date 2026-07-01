import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const preferredPort = Number(process.env.PORT || 4173);
const root = join(process.cwd(), "dist");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ttf": "font/ttf"
};

const server = createServer(async (request, response) => {
  const urlPath = new URL(request.url || "/", `http://127.0.0.1:${port}`).pathname;

  if (urlPath === "/api/study") {
    await handleStudyApi(request, response);
    return;
  }

  const requestedPath = normalize(join(root, urlPath));
  const filePath =
    requestedPath.startsWith(root) && existsSync(requestedPath) && statSync(requestedPath).isFile()
      ? requestedPath
      : join(root, "index.html");
  const contentType = contentTypes[extname(filePath)] || "application/octet-stream";

  response.writeHead(200, { "content-type": contentType });
  createReadStream(filePath).pipe(response);
});

let port = preferredPort;
server.on("error", (error) => {
  if (error.code !== "EADDRINUSE" || process.env.PORT) {
    throw error;
  }

  port += 1;
  server.listen(port, "127.0.0.1");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`secretplace preview running at http://127.0.0.1:${port}`);
});

async function handleStudyApi(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const body = await readJsonBody(request);
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";

  if (!reference) {
    sendJson(response, 400, { error: "A scripture reference is required." });
    return;
  }

  sendJson(response, 200, createFallbackGuide(reference));
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function createFallbackGuide(reference) {
  const key = reference.toLowerCase().trim();

  if (key === "john 3:16") {
    return {
      reference: "John 3:16",
      verse:
        "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
      wordStudies: [
        {
          term: "loved",
          original: "agapao",
          language: "Greek",
          meaning:
            "A self-giving love shown through action, commitment, and sacrificial care rather than only emotion."
        },
        {
          term: "believes",
          original: "pisteuo",
          language: "Greek",
          meaning:
            "To trust, rely on, and place confidence in someone. In this passage it carries the idea of active dependence."
        }
      ],
      summary:
        "This verse presents the heart of the gospel: God's love moves toward the world through the gift of the Son, and the invited response is trusting him for life that does not end in separation from God.",
      questions: [
        "Where do you most need to receive God's love as an action, not just an idea?",
        "What would it look like today to trust Jesus with active dependence?"
      ]
    };
  }

  const isNewTestament =
    /matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation/i.test(
      reference
    );

  return {
    reference,
    verse:
      "Open your Bible to this passage and read it slowly before using these notes as a starting point for study.",
    wordStudies: isNewTestament
      ? [
          {
            term: "grace",
            original: "charis",
            language: "Greek",
            meaning:
              "A gift of favor freely given. In New Testament study, it often points to God's generous action toward people."
          },
          {
            term: "faith",
            original: "pistis",
            language: "Greek",
            meaning:
              "Trust, faithfulness, or confidence. The word often carries both belief and loyal reliance."
          }
        ]
      : [
          {
            term: "steadfast love",
            original: "hesed",
            language: "Hebrew",
            meaning:
              "Covenant loyalty, mercy, and faithful love expressed through dependable action."
          },
          {
            term: "peace",
            original: "shalom",
            language: "Hebrew",
            meaning:
              "Wholeness, welfare, completeness, and restored order rather than only the absence of conflict."
          }
        ],
    summary:
      "Use this passage as a place to slow down, observe what God reveals about his character, and notice the response invited from the reader. Word meanings are study aids and should be weighed alongside the full passage and trusted teaching.",
    questions: [
      "What does this passage reveal about God's character or desire for his people?",
      "What is one honest response this passage invites from you today?"
    ]
  };
}
