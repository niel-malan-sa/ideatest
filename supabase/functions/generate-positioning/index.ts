import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea_id } = await req.json();
    if (!idea_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idea_id)) {
      return new Response(JSON.stringify({ error: "Valid idea_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });

    const token = authHeader.replace("Bearer ", "");
    const { error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch all needed data
    const [ideaRes, outRes, fwRes, analysisRes] = await Promise.all([
      supabase.from("ideas").select("*").eq("id", idea_id).single(),
      supabase.from("outcomes").select("*").eq("idea_id", idea_id).order("created_at"),
      supabase.from("job_frameworks").select("*").eq("idea_id", idea_id).maybeSingle(),
      supabase.from("analyses").select("*").eq("idea_id", idea_id).maybeSingle(),
    ]);

    if (ideaRes.error || !ideaRes.data) {
      return new Response(JSON.stringify({ error: "Idea not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const idea = ideaRes.data;
    const outcomes = outRes.data || [];
    const framework = fwRes.data;
    const analysis = analysisRes.data;
    const lang = idea.language === "fi" ? "Finnish" : "English";

    // Calculate scored outcomes
    const typeWeight: Record<string, number> = { functional: 1.0, emotional: 0.8, social: 0.7 };
    const scoredOutcomes = outcomes
      .filter((o: any) => o.importance != null && o.satisfaction != null)
      .map((o: any) => {
        const imp = Number(o.importance);
        const sat = Number(o.satisfaction);
        const gap = Math.max(0, imp - sat);
        const weight = typeWeight[o.type] ?? 1.0;
        const unmet_index = Math.round(((imp * gap) / 10) * weight * 100) / 100;
        return { statement: o.statement, type: o.type, importance: imp, satisfaction: sat, gap, unmet_index };
      })
      .sort((a: any, b: any) => b.unmet_index - a.unmet_index);

    const topOpportunities = scoredOutcomes.slice(0, 10);
    const emotionalOutcomes = scoredOutcomes.filter((o: any) => o.type === "emotional");
    const socialOutcomes = scoredOutcomes.filter((o: any) => o.type === "social");

    const systemPrompt = `You are a B2B product positioning expert who deeply understands needs-based innovation methodology. Create a data-driven positioning strategy based on analysis results.

POSITIONING PRINCIPLES:
1. Positioning is ALWAYS based on measured customer needs (not assumptions)
2. Core promise = highest Unmet Needs Index (biggest underserved need)
3. Competitive advantage = biggest gaps (where current solutions fail most)
4. Target audience = Primary Actor profile (not abstract segment)
5. Language must speak to the Primary Actor in their own terms

Respond in valid JSON only, no markdown, no code fences. Structure:
{
  "positioningStatement": {
    "primary": "Full positioning statement",
    "targetAudience": "Who",
    "coreProblem": "Core problem",
    "category": "Product category",
    "corePromise": "Core promise",
    "differentiator": "Key differentiator"
  },
  "valueHierarchy": {
    "coreValue": { "statement": "", "unmetIndex": 0, "gap": 0 },
    "supportingValues": [{ "statement": "", "unmetIndex": 0 }],
    "emotionalValues": [{ "statement": "", "importance": 0 }],
    "socialValues": [{ "statement": "", "importance": 0 }]
  },
  "competitivePositioning": {
    "marketGaps": [{ "area": "", "currentSatisfaction": 0, "importance": 0, "gap": 0 }],
    "summary": "Competitive landscape summary"
  },
  "alternativeAngles": [
    { "angle": "Description", "focus": "What it emphasizes", "bestFor": "When to use" }
  ]
}

Generate ALL content in ${lang}.`;

    const userPrompt = `Create a positioning strategy based on this needs-based analysis:

PRODUCT: ${idea.name}
DESCRIPTION: ${idea.description || "N/A"}
${idea.industry ? `INDUSTRY: ${idea.industry}` : ""}
${idea.target_audience ? `TARGET AUDIENCE: ${idea.target_audience}` : ""}
PRIMARY ACTOR: ${framework?.job_executor || "N/A"}

TOP UNMET NEEDS (sorted by index):
${topOpportunities.map((o: any, i: number) => `${i + 1}. [UNI: ${o.unmet_index}] ${o.statement} | Imp: ${o.importance}, Sat: ${o.satisfaction}, Gap: ${o.gap}`).join("\n")}

EMOTIONAL OUTCOMES:
${emotionalOutcomes.map((o: any) => `- ${o.statement} (Imp: ${o.importance})`).join("\n") || "None"}

SOCIAL OUTCOMES:
${socialOutcomes.map((o: any) => `- ${o.statement} (Imp: ${o.importance})`).join("\n") || "None"}

${analysis?.market_potential ? `MARKET POTENTIAL: ${analysis.market_potential}` : ""}
${analysis?.summary ? `ANALYSIS SUMMARY: ${analysis.summary}` : ""}

Create:
1. Positioning Statement (format: For [audience] who [problem], [product] is [category] that [core promise]. Unlike [alternatives], [differentiator].)
2. Value hierarchy (3 levels: core, supporting, emotional/social)
3. Competitive positioning (where current solutions fail, based on satisfaction scores)
4. 3 alternative positioning angles`;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("OpenAI API error");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response");

    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const positioning = JSON.parse(content);

    // Upsert positioning
    const { data: existing } = await supabase.from("positioning_strategies").select("id").eq("idea_id", idea_id).maybeSingle();

    const posData = {
      idea_id,
      positioning_statement: positioning.positioningStatement || {},
      value_hierarchy: positioning.valueHierarchy || {},
      competitive_positioning: positioning.competitivePositioning || {},
      alternative_angles: positioning.alternativeAngles || [],
    };

    if (existing) {
      await supabase.from("positioning_strategies").update(posData).eq("id", existing.id);
    } else {
      await supabase.from("positioning_strategies").insert(posData);
    }

    return new Response(JSON.stringify({ success: true, positioning }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-positioning error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
