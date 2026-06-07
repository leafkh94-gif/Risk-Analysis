// ─────────────────────────────────────────────────────────────
// api/analyze.js  —  Vercel Serverless Function
//
// This is the BACKEND. It runs on Vercel's servers, not in the
// browser. Its whole job is to receive a request from the frontend,
// attach YOUR secret Anthropic API key (stored as an environment
// variable, never exposed to the client), call the Anthropic API,
// and stream the result back.
//
// Because the key lives here on the server, the app works for ANY
// visitor — your client included — without ever leaking the key.
// ─────────────────────────────────────────────────────────────

export const config = {
  runtime: "edge", // Edge runtime supports streaming responses cleanly
};

export default async function handler(req) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Read the secret key from Vercel environment variables.
  // You set this in the Vercel dashboard — see DEPLOY.md.
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: "Server is missing ANTHROPIC_API_KEY. Set it in Vercel project settings." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // `stream` defaults to true. The frontend sets it to false on its
  // fallback attempt if streaming failed.
  const { systemPrompt, userMessage, stream = true } = body;
  if (!systemPrompt || !userMessage) {
    return new Response(
      JSON.stringify({ error: "Missing systemPrompt or userMessage" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Call the Anthropic API with retry on 429 rate limits ──
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        stream: stream, // honor the requested mode
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    // Rate limited — wait with exponential backoff, then retry
    if (anthropicRes.status === 429 && attempt < MAX_RETRIES) {
      const waitMs = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error ${anthropicRes.status}: ${errText}` }),
        { status: anthropicRes.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Non-streaming mode: pass the JSON body straight through
    if (!stream) {
      const json = await anthropicRes.json();
      return new Response(JSON.stringify(json), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Streaming mode: pipe the SSE response straight back to the browser.
    return new Response(anthropicRes.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  // If we exhausted all retries on 429s
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded after multiple retries. Please wait a moment and try again." }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}
