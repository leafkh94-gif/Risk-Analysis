export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  const { systemPrompt, userMessage, stream = true } = body;
  if (!systemPrompt || !userMessage) {
    return new Response(
      JSON.stringify({ error: "Missing systemPrompt or userMessage" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

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
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        stream,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (anthropicRes.status === 429 && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
      continue;
    }

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error ${anthropicRes.status}: ${errText}` }),
        { status: anthropicRes.status, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!stream) {
      const json = await anthropicRes.json();
      return new Response(JSON.stringify(json), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(anthropicRes.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  return new Response(
    JSON.stringify({ error: "Rate limit exceeded after multiple retries. Please wait a moment and try again." }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}
