// Supabase Edge Function: lingo-chat
// Server-side proxy to Groq for Lingo (the AI assistant), so the Groq API key never reaches the browser/app.
//
// Secrets (set once):  supabase secrets set GROQ_API_KEY=<your new key>
// Deploy:              supabase functions deploy lingo-chat --no-verify-jwt
//   (--no-verify-jwt lets guests use Lingo too; they get a stricter, IP-based limit below)
//
// Request body (JSON): { system: string, messages: {role:"user"|"assistant", content:string}[], temperature?: number, maxTokens?: number }
// Response (JSON):     { content: string }  or  { error: string } with a 4xx/5xx status

import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "llama-3.3-70b-versatile";
const LIMITS = {
  systemChars: 6000,
  messages: 12,
  messageChars: 2000,
  maxTokens: 600,
};
// Requests allowed per window, per signed-in user or (for guests) per IP address
const RATE = { windowMinutes: 10, user: 40, guest: 12 };

// Origins allowed to call this function from a browser (web app, local dev, Capacitor Android)
const ALLOWED_ORIGINS = new Set([
  "https://lingora-learn.vercel.app",
  "http://localhost:3000",
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
]);

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://lingora-learn.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } });

type ChatMessage = { role: "user" | "assistant"; content: string };

/** Validates and trims the request body; returns null if it is not acceptable */
function parseBody(raw: unknown): { system: string; messages: ChatMessage[]; temperature: number; maxTokens: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.system !== "string" || b.system.length === 0 || b.system.length > LIMITS.systemChars) return null;
  if (!Array.isArray(b.messages) || b.messages.length === 0) return null;
  const messages: ChatMessage[] = [];
  for (const m of b.messages.slice(-LIMITS.messages)) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    messages.push({ role, content: content.slice(0, LIMITS.messageChars) });
  }
  if (messages[messages.length - 1].role !== "user") return null;
  const temperature = typeof b.temperature === "number" ? Math.min(1, Math.max(0, b.temperature)) : 0.7;
  const maxTokens = typeof b.maxTokens === "number" ? Math.min(LIMITS.maxTokens, Math.max(1, Math.floor(b.maxTokens))) : 400;
  return { system: b.system, messages, temperature, maxTokens };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);

  const groqKey = Deno.env.get("GROQ_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!groqKey || !supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 500, origin);

  let body: ReturnType<typeof parseBody>;
  try {
    body = parseBody(await req.json());
  } catch {
    body = null;
  }
  if (!body) return json({ error: "Invalid request" }, 400, origin);

  // Who is asking: a signed-in user (verified JWT) or a guest (by IP)
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  let rateKey: string;
  let limit: number;
  const { data: userData } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  if (userData?.user) {
    rateKey = `user:${userData.user.id}`;
    limit = RATE.user;
  } else {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    rateKey = `ip:${ip}`;
    limit = RATE.guest;
  }

  // Rate limit (table created by supabase/migrations/*_ai_rate_limit.sql)
  const since = new Date(Date.now() - RATE.windowMinutes * 60_000).toISOString();
  const { count, error: countErr } = await admin.from("ai_requests").select("id", { count: "exact", head: true }).eq("key", rateKey).gte("created_at", since);
  if (countErr) return json({ error: "Rate limit check failed" }, 500, origin);
  if ((count ?? 0) >= limit) return json({ error: "Too many requests" }, 429, origin);
  await admin.from("ai_requests").insert({ key: rateKey });

  const groq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: body.system }, ...body.messages],
      temperature: body.temperature,
      max_tokens: body.maxTokens,
    }),
  });
  if (!groq.ok) return json({ error: "AI service error" }, 502, origin);
  const data = await groq.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return json({ error: "AI service error" }, 502, origin);
  return json({ content }, 200, origin);
});
