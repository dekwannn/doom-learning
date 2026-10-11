// Calls Lingo (the AI assistant) through the `lingo-chat` Supabase Edge Function.
// The Groq API key lives only on the server; the app never sees it.
import { supabase } from "@/lib/supabase";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function askLingo(options: {
  system: string;
  history: ChatMessage[];
  userText: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const { system, history, userText, temperature, maxTokens } = options;
  const { data, error } = await supabase.functions.invoke<{ content?: string }>("lingo-chat", {
    body: { system, messages: [...history, { role: "user", content: userText }], temperature, maxTokens },
  });
  if (error) {
    // 429 = too many requests in a short time
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 429) return "Lingo sedang istirahat sebentar. Coba lagi dalam beberapa menit, ya.";
    return "Maaf, ada gangguan. Coba lagi ya.";
  }
  return data?.content ?? "Maaf, ada gangguan. Coba lagi ya.";
}
