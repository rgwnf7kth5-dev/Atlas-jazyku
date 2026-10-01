// Otázky na AI z hledacího pole atlasu (krok 2 dotazů, 1. 10. 2026).
// Funkce je jen prostředník: drží klíč ANTHROPIC_API_KEY (Netlify → Environment variables, scope Functions),
// pevný systémový pokyn, pevné nástroje a limity. Nástroje se vykonávají v prohlížeči nad daty atlasu
// (app.js, naradiAI) – stránka pošle zpět výsledky a funkce se zeptá znovu. AI tak odpovídá z dat atlasu,
// ne z hlavy. Konverzace je vždy jen jedna otázka a nejvýš ZKOLA kol nástrojů.
import Anthropic from "@anthropic-ai/sdk";

const MODELY = { opus: "claude-opus-5-5", sonnet: "claude-sonnet-5-5", haiku: "claude-haiku-4-5" };
const VYCHOZI = MODELY[process.env.ATLAS_AI_MODEL] || process.env.ATLAS_AI_MODEL || MODELY.opus;
const ZKOLA = 4, MAX_OTAZKA = 300, MAX_VYSLEDEK = 8000, MAX_TELO = 60000;

const NASTROJE = [
  { name: "jazyky_statu", description: "Languages spoken in one country, from the atlas register (Glottolog countries). Returns the number of languages on the globe, the atlas languages with a detailed card and examples. Also highlights the country on the globe.",
    input_schema: { type: "object", properties: { stat: { type: "string", description: "Country name in English or Czech, e.g. 'Brazil' or 'Brazílie'." } }, required: ["stat"], additionalProperties: false } },
  { name: "jazyky_skupiny", description: "All languages of a language family or branch in the Glottolog tree used by the atlas. Returns the number of languages, the family it belongs to, its sub-branches with counts and atlas languages. Also shows them on the globe. Use the English Glottolog name when you know it (e.g. 'Slavic', 'Uralic', 'Romance', 'Bantu' is 'Narrow Bantu').",
    input_schema: { type: "object", properties: { nazev: { type: "string", description: "Family or branch name, English (Glottolog) or Czech." } }, required: ["nazev"], additionalProperties: false } },
  { name: "info_o_jazyku", description: "Facts about one language from the atlas: family path in Glottolog, countries, speakers (atlas estimate), UNESCO vitality, scripts and the atlas note. Also opens its card.",
    input_schema: { type: "object", properties: { jazyk: { type: "string", description: "Language name in English or Czech." } }, required: ["jazyk"], additionalProperties: false } },
  { name: "srovnej_jazyky", description: "Compares two languages from the atlas data: nearest common ancestor in the Glottolog tree (or that they are not known to be related), families, scripts, shared countries, speakers and vitality. Also opens the comparison.",
    input_schema: { type: "object", properties: { a: { type: "string" }, b: { type: "string" } }, required: ["a", "b"], additionalProperties: false } },
].map(t => ({ ...t, strict: true }));

const SYSTEM = `You are the question box of The Language Atlas (Atlas jazyků), an encyclopedic atlas of the world's languages on a globe, for students and adults.
Answer only questions about languages, language families, scripts and where languages are spoken. Politely decline anything else in one sentence.
Facts must come from the atlas tools: call the tool that fits, then answer from its result. Do not add numbers, dates or claims that the tool result does not contain. If the tools cannot answer, say what the atlas can show instead.
Answer in the language of the question (Czech or English), in two to four plain sentences, factual and neutral, without exclamations. In Czech use the formal "vy" form.
Each tool also shows its result on the globe, so you can refer to the globe ("na glóbu jsou zvýrazněné…").`;

const hlasy = new Map();                      // jednoduchý limit na adresu v jedné instanci funkce
function prilisCasto(ip) {
  const ted = Date.now(), z = (hlasy.get(ip) || []).filter(t => ted - t < 600000);
  z.push(ted); hlasy.set(ip, z);
  return z.length > 40;                       // 40 volání za 10 minut ≈ 10–20 otázek
}
const odpoved = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

/* povolený tvar konverzace: první zpráva je otázka (text), dál jen odpovědi AI a výsledky nástrojů */
function platna(zpravy) {
  if (!Array.isArray(zpravy) || !zpravy.length || zpravy.length > 1 + 2 * ZKOLA) return false;
  const prvni = zpravy[0];
  if (prvni.role !== "user" || typeof prvni.content !== "string" || !prvni.content.trim() || prvni.content.length > MAX_OTAZKA) return false;
  return zpravy.slice(1).every((z, k) => {
    if (k % 2 === 0) return z.role === "assistant" && Array.isArray(z.content);
    return z.role === "user" && Array.isArray(z.content) && z.content.length > 0 &&
      z.content.every(b => b && b.type === "tool_result" && typeof b.tool_use_id === "string" && typeof b.content === "string" && b.content.length <= MAX_VYSLEDEK);
  }) && zpravy.length % 2 === 1;
}

export default async (req, context) => {
  if (req.method !== "POST") return odpoved({ chyba: "metoda" }, 405);
  if (!process.env.ANTHROPIC_API_KEY) return odpoved({ chyba: "bez-klice" }, 503);
  const text = await req.text();
  if (text.length > MAX_TELO) return odpoved({ chyba: "velke" }, 413);
  let telo; try { telo = JSON.parse(text); } catch { return odpoved({ chyba: "json" }, 400); }
  if (!platna(telo.zpravy)) return odpoved({ chyba: "tvar" }, 400);
  if (prilisCasto(context?.ip || req.headers.get("x-nf-client-connection-ip") || "?")) return odpoved({ chyba: "limit" }, 429);
  const model = MODELY[telo.model] || VYCHOZI;          // zkušební stránka (#ai-test) porovnává tři modely

  const client = new Anthropic();
  const parametry = {
    model, max_tokens: 2000, system: SYSTEM, tools: NASTROJE, messages: telo.zpravy,
    cache_control: { type: "ephemeral" },              // systém a nástroje se opakují – levnější další kola
  };
  try {
    let r;
    if (model === MODELY.haiku) r = await client.messages.create(parametry);
    else r = await client.beta.messages.create({ ...parametry, output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" });   // odmítnutí bezpečnostním filtrem přebere záložní model
    return odpoved({ obsah: r.content, stop: r.stop_reason, model: r.model,
      spotreba: { vstup: r.usage.input_tokens, cache: r.usage.cache_read_input_tokens || 0, vystup: r.usage.output_tokens } });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return odpoved({ chyba: "limit-api" }, 429);
    if (e instanceof Anthropic.AuthenticationError) return odpoved({ chyba: "klic" }, 503);
    if (e instanceof Anthropic.BadRequestError) return odpoved({ chyba: "pozadavek", zprava: e.message }, 400);
    if (e instanceof Anthropic.APIError) return odpoved({ chyba: "api", status: e.status }, 502);
    return odpoved({ chyba: "sit" }, 502);
  }
};

export const config = { path: "/api/zeptej" };
