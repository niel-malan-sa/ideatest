import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { idea_id } = body;
    if (!idea_id) {
      return new Response(
        JSON.stringify({ error: "idea_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof idea_id !== "string" || !uuidRegex.test(idea_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid idea_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch idea, outcomes, outcome_scores, research data, interview notes
    const [ideaRes, outRes, scoresRes, researchRes, notesRes] = await Promise.all([
      supabase.from("ideas").select("*").eq("id", idea_id).single(),
      supabase.from("outcomes").select("*").eq("idea_id", idea_id).order("created_at"),
      supabase.from("outcome_scores").select("*").eq("idea_id", idea_id),
      supabase.from("research_data").select("*").eq("idea_id", idea_id).maybeSingle(),
      supabase.from("interview_notes").select("*").eq("idea_id", idea_id).order("created_at"),
    ]);

    if (ideaRes.error || !ideaRes.data) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idea = ideaRes.data;
    const outcomes = outRes.data || [];
    const outcomeScores = scoresRes.data || [];
    const research = researchRes.data;
    const interviewNotes = notesRes.data || [];
    const lang = idea.language === "fi" ? "Finnish" : "English";

    // Calculate averages from per-respondent scores
    const scoresByOutcome: Record<string, { impSum: number; satSum: number; count: number }> = {};
    for (const s of outcomeScores) {
      const oid = s.outcome_id;
      if (!scoresByOutcome[oid]) scoresByOutcome[oid] = { impSum: 0, satSum: 0, count: 0 };
      scoresByOutcome[oid].impSum += Number(s.importance);
      scoresByOutcome[oid].satSum += Number(s.satisfaction);
      scoresByOutcome[oid].count++;
    }

    // Calculate UNI using averaged scores (from outcome_scores if available, fallback to outcomes table)
    const typeWeight: Record<string, number> = { functional: 1.0, emotional: 0.8, social: 0.7 };
    const scoredOutcomes = outcomes
      .map((o: any) => {
        const fromScores = scoresByOutcome[o.id];
        const imp = fromScores ? fromScores.impSum / fromScores.count : (o.importance != null ? Number(o.importance) : null);
        const sat = fromScores ? fromScores.satSum / fromScores.count : (o.satisfaction != null ? Number(o.satisfaction) : null);
        if (imp == null || sat == null) return null;
        const gap = Math.max(0, imp - sat);
        const weight = typeWeight[o.type] ?? 1.0;
        const unmet_index = Math.round(((imp * gap) / 10) * weight * 100) / 100;
        const respondentCount = fromScores?.count || 0;
        return {
          statement: o.statement,
          type: o.type,
          importance: Math.round(imp * 10) / 10,
          satisfaction: Math.round(sat * 10) / 10,
          gap: Math.round(gap * 10) / 10,
          unmet_index,
          respondent_count: respondentCount,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.unmet_index - a.unmet_index);

    const topOpportunities = scoredOutcomes.slice(0, 10);
    const avgIndex = scoredOutcomes.length > 0
      ? scoredOutcomes.reduce((s: number, o: any) => s + o.unmet_index, 0) / scoredOutcomes.length
      : 0;

    const totalRespondents = new Set(outcomeScores.map((s: any) => s.respondent)).size;

    const systemPrompt = `You are a product strategy consultant. Analyze needs research data from customer interviews (both quantitative scores and qualitative insights) to provide a focused, actionable product strategy scorecard.

Respond in valid JSON only, no markdown, no code fences. Structure:
{
  "summary": "string - concise 1-2 paragraph executive summary combining quantitative and qualitative findings",
  "go_no_go": "GO|NO-GO|CONDITIONAL",
  "go_no_go_rationale": "string - clear reasoning for the recommendation",
  "top_insights": [
    {
      "title": "string - insight title",
      "description": "string - what we learned and why it matters",
      "supporting_data": "string - specific data points and/or interview quotes"
    }
  ],
  "action_items": [
    {
      "title": "string - action item",
      "description": "string - what to do and expected impact",
      "priority": "high|medium|low"
    }
  ],
  "market_potential": "string - brief market potential assessment"
}

Keep it focused: exactly 3 top insights and 3 action items. Quality over quantity.
Generate ALL content in ${lang}.`;

    // Build interview context
    let interviewContext = "";
    if (interviewNotes.length > 0) {
      const noteSummaries = interviewNotes.map((n: any) => {
        const content = n.content.length > 500 ? n.content.substring(0, 500) + "…" : n.content;
        return `[${n.respondent}]: ${content}`;
      });
      interviewContext = noteSummaries.join("\n\n");
      if (interviewContext.length > 4000) {
        interviewContext = interviewContext.substring(0, 4000) + "\n…(truncated)";
      }
    }

    const userPrompt = `Analyze this product research data:

**Product:** ${idea.name}
**Description:** ${idea.description || "N/A"}
${idea.industry ? `**Industry:** ${idea.industry}` : ""}
${idea.target_audience ? `**Target Audience:** ${idea.target_audience}` : ""}
${research?.market_size ? `**Market Size:** ${research.market_size}` : ""}
${research?.competitors?.length ? `**Competitors:** ${(research.competitors as string[]).join(", ")}` : ""}

**Interview Data: ${totalRespondents} respondents, ${scoredOutcomes.length} outcomes scored**
Average Unmet Needs Index: ${avgIndex.toFixed(2)}

**Top Unmet Needs:**
${topOpportunities.map((o: any, i: number) => `${i + 1}. [UNI: ${o.unmet_index}] (${o.type}) ${o.statement} | Imp: ${o.importance}, Sat: ${o.satisfaction}, n=${o.respondent_count}`).join("\n")}
${interviewContext ? `\n**Qualitative Interview Notes (${interviewNotes.length} entries):**\n${interviewContext}` : ""}

Provide a focused scorecard: Go/No-Go, 3 key insights, 3 action items.`;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("OpenAI API error");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response");

    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const rawAnalysis = JSON.parse(content);

    const AnalysisSchema = z.object({
      summary: z.string().default(""),
      go_no_go: z.enum(["GO", "NO-GO", "CONDITIONAL"]).default("CONDITIONAL"),
      go_no_go_rationale: z.string().default(""),
      top_insights: z.array(z.object({
        title: z.string(),
        description: z.string(),
        supporting_data: z.string().optional(),
      })).default([]),
      action_items: z.array(z.object({
        title: z.string(),
        description: z.string(),
        priority: z.enum(["high", "medium", "low"]).default("medium"),
      })).default([]),
      market_potential: z.string().default(""),
      // Legacy fields
      recommendations: z.array(z.any()).optional(),
    });

    const parseResult = AnalysisSchema.safeParse(rawAnalysis);
    if (!parseResult.success) {
      console.error("AI response validation failed:", parseResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to process AI response. Please try again." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const analysis = parseResult.data;

    // Save analysis deterministically: update latest row for this idea, insert if none
    const { data: existingRows } = await supabase
      .from("analyses")
      .select("id")
      .eq("idea_id", idea_id)
      .order("created_at", { ascending: false });

    const analysisData = {
      idea_id,
      summary: analysis.summary,
      recommendations: analysis.top_insights,
      go_no_go: `${analysis.go_no_go}: ${analysis.go_no_go_rationale}`,
      market_potential: analysis.market_potential,
      action_items: analysis.action_items,
    };

    if (existingRows && existingRows.length > 0) {
      await supabase.from("analyses").update(analysisData).eq("id", existingRows[0].id);
      if (existingRows.length > 1) {
        const duplicateIds = existingRows.slice(1).map((row) => row.id);
        await supabase.from("analyses").delete().in("id", duplicateIds);
      }
    } else {
      await supabase.from("analyses").insert(analysisData);
    }

    await supabase.from("ideas").update({ status: "analyzed" }).eq("id", idea_id);

    return new Response(JSON.stringify({
      success: true,
      analysis,
      unmet_needs: scoredOutcomes,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-results error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
