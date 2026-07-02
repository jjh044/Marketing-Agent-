import { clearSessionCookie } from "../../dist/auth.js";

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  response.writeHead(302, {
    "set-cookie": clearSessionCookie(),
    location: "/"
  });
  response.end();
}
