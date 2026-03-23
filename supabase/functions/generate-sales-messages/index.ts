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

    // Fetch idea, framework, positioning, outcomes
    const [ideaRes, fwRes, posRes, outRes] = await Promise.all([
      supabase.from("ideas").select("*").eq("id", idea_id).single(),
      supabase.from("job_frameworks").select("*").eq("idea_id", idea_id).maybeSingle(),
      supabase.from("positioning_strategies").select("*").eq("idea_id", idea_id).maybeSingle(),
      supabase.from("outcomes").select("*").eq("idea_id", idea_id).order("created_at"),
    ]);

    if (ideaRes.error || !ideaRes.data) {
      return new Response(JSON.stringify({ error: "Idea not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const idea = ideaRes.data;
    const framework = fwRes.data;
    const positioning = posRes.data;
    const lang = idea.language === "fi" ? "Finnish" : "English";

    if (!positioning) {
      return new Response(JSON.stringify({ error: "Generate positioning first" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const posStatement = positioning.positioning_statement as any;
    const valueHierarchy = positioning.value_hierarchy as any;
    const competitive = positioning.competitive_positioning as any;

    // Calculate top gaps from outcomes
    const typeWeight: Record<string, number> = { functional: 1.0, emotional: 0.8, social: 0.7 };
    const outcomes = (outRes.data || [])
      .filter((o: any) => o.importance != null && o.satisfaction != null)
      .map((o: any) => {
        const imp = Number(o.importance);
        const sat = Number(o.satisfaction);
        const gap = Math.max(0, imp - sat);
        return { statement: o.statement, importance: imp, satisfaction: sat, gap };
      })
      .sort((a: any, b: any) => b.gap - a.gap);

    const systemPrompt = `You are a B2B sales communication expert who builds compelling, data-driven sales messages. You use needs-based analysis results to create messages that address real customer needs.

MESSAGE PRINCIPLES:
1. ALWAYS start with the customer's pain point (not product features)
2. Use the Primary Actor's own language and terms
3. Quantify the problem when possible (satisfaction scores show current state)
4. Present solution through desired outcomes (not features)
5. Support with data (Unmet Needs Index = market need)
6. End with a clear call to action

Respond in valid JSON only, no markdown, no code fences. Structure:
{
  "elevatorPitch": {
    "text": "Full elevator pitch (~80 words, 30 seconds)",
    "basedOn": { "primaryOutcome": "", "unmetIndex": 0, "gap": 0 }
  },
  "coldEmail": {
    "subjectLine": "Subject line (max 60 chars, pain-point based)",
    "body": "Full email body (~150 words)",
    "cta": "Call to action",
    "basedOn": { "painPoint": "", "corePromise": "" }
  }
}

Generate ALL content in ${lang}.`;

    const userPrompt = `Create sales messages based on this positioning and analysis data:

PRODUCT: ${idea.name}
PRIMARY ACTOR: ${framework?.job_executor || "N/A"}
POSITIONING: ${posStatement?.primary || "N/A"}
CORE PROMISE: ${posStatement?.corePromise || "N/A"}
DIFFERENTIATOR: ${posStatement?.differentiator || "N/A"}
CORE VALUE: ${valueHierarchy?.coreValue?.statement || "N/A"} (UNI: ${valueHierarchy?.coreValue?.unmetIndex || "N/A"})
SUPPORTING VALUES: ${(valueHierarchy?.supportingValues || []).map((v: any) => v.statement).join(", ") || "N/A"}

TOP GAPS (competitive advantages):
${(competitive?.marketGaps || []).map((g: any) => `- ${g.area}: satisfaction ${g.currentSatisfaction}/10, importance ${g.importance}/10, gap ${g.gap}`).join("\n") || "N/A"}

COMPETITIVE SUMMARY: ${competitive?.summary || "N/A"}

TOP OUTCOME GAPS:
${outcomes.slice(0, 5).map((o: any) => `- ${o.statement} (Imp: ${o.importance}, Sat: ${o.satisfaction}, Gap: ${o.gap})`).join("\n")}

Create:
1. ELEVATOR PITCH (30 seconds, ~80 words): Start with a striking fact or question, present core promise, end convincingly
2. COLD EMAIL (~150 words): Pain-point subject line, identify problem, present solution + proof, clear CTA`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response");

    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const messages = JSON.parse(content);

    // Upsert sales messages
    const { data: existing } = await supabase.from("sales_messages").select("id").eq("idea_id", idea_id).maybeSingle();

    const msgData = {
      idea_id,
      elevator_pitch: messages.elevatorPitch || {},
      cold_email: messages.coldEmail || {},
    };

    if (existing) {
      await supabase.from("sales_messages").update(msgData).eq("id", existing.id);
    } else {
      await supabase.from("sales_messages").insert(msgData);
    }

    return new Response(JSON.stringify({ success: true, messages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-sales-messages error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
