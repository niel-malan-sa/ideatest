import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea_id, framework_id } = await req.json();
    if (!idea_id || !framework_id) {
      return new Response(JSON.stringify({ error: "idea_id and framework_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify auth
    const token = authHeader.replace("Bearer ", "");
    const { error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch idea, framework, and outcomes
    const [ideaRes, fwRes, outRes] = await Promise.all([
      supabase.from("ideas").select("*").eq("id", idea_id).single(),
      supabase.from("job_frameworks").select("*").eq("id", framework_id).single(),
      supabase.from("outcomes").select("statement, type").eq("idea_id", idea_id).order("created_at"),
    ]);

    if (ideaRes.error || !ideaRes.data) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (fwRes.error || !fwRes.data) {
      return new Response(JSON.stringify({ error: "Framework not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idea = ideaRes.data;
    const framework = fwRes.data;
    const outcomes = outRes.data || [];
    const steps = framework.job_map_steps || [];
    const lang = idea.language === "fi" ? "Finnish" : "English";

    // Compute input hash for tracking
    const inputHash = computeHash(steps, outcomes);

    const systemPrompt = `You are a product research expert. You create combined interview guides that include both qualitative questions and quantitative outcome scoring within a single interview session.

You MUST respond with valid JSON only, no markdown, no code fences. Your response must match this exact structure:
{
  "recommended_interviews": {
    "min": 5,
    "max": 15,
    "recommended": 8,
    "rationale": "string"
  },
  "themes": [
    {
      "theme_name": "string - descriptive theme name tied to 1-2 process steps",
      "related_steps": [1, 2],
      "time_estimate_min": 12,
      "open_questions": ["string array - 2-3 open-ended qualitative questions"],
      "scored_outcomes": ["string array - 1-3 outcome statements to score importance+satisfaction 1-10"]
    }
  ],
  "total_time_min": "number - sum of theme times + 5 min intro/closing",
  "closing_questions": ["string array - 1-2 wrap-up questions"]
}

Generate ALL content in ${lang}.
Create 4-6 themes based on the process steps.
Select 5-8 of the most critical outcomes to be scored during the interview — distribute them across themes.
Each theme should have 2-3 open questions and 1-3 scored outcomes.
The scored_outcomes strings must EXACTLY match outcome statements from the provided outcomes list.
ESTIMATE each theme's time realistically: ~3 min per open question, ~2 min per scored outcome. Set total_time_min as the sum plus 5 min.`;

    const stepsText = steps.map((s: any) => `${s.step_number}. ${s.description}`).join("\n");
    const outcomesText = outcomes.map((o: any) => `- [${o.type}] ${o.statement}`).join("\n");

    const userPrompt = `Regenerate the interview guide for this product idea based on the CURRENT process steps and desired outcomes:

**Product:** ${idea.name}
**Description:** ${idea.description || "No description"}
${idea.industry ? `**Industry:** ${idea.industry}` : ""}
${idea.target_audience ? `**Target Audience:** ${idea.target_audience}` : ""}

**Current Process Steps:**
${stepsText}

**Current Desired Outcomes:**
${outcomesText}

Generate a themed interview guide that covers these steps and scores the most important outcomes.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response");

    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const interviewGuide = JSON.parse(content);

    // Add input hash for change tracking
    interviewGuide._input_hash = inputHash;

    // Update framework with new interview guide
    const { error: updateErr } = await supabase
      .from("job_frameworks")
      .update({ interview_questions: interviewGuide })
      .eq("id", framework_id);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to save interview guide" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, interview_guide: interviewGuide }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-interview-guide error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function computeHash(steps: any[], outcomes: any[]): string {
  const stepsStr = steps.map((s: any) => s.description).sort().join("|");
  const outcomesStr = outcomes.map((o: any) => o.statement).sort().join("|");
  const combined = stepsStr + ":::" + outcomesStr;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}
