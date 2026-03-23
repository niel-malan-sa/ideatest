import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea_id, framework_id, flagged_steps, all_steps, idea_context } = await req.json();
    if (!idea_id || !framework_id || !flagged_steps?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = idea_context.language === "fi" ? "Finnish" : "English";

    const flaggedInfo = flagged_steps.map((f: any) =>
      `Step ${f.step_number}: "${f.description}"${f.comment ? ` — User feedback: "${f.comment}"` : ""}`
    ).join("\n");

    const allStepsInfo = all_steps.map((s: any) =>
      `Step ${s.step_number}: ${s.description}`
    ).join("\n");

    const systemPrompt = `You are a product research expert. The user has flagged certain process steps as incorrect or problematic. Your job is to fix ONLY the flagged steps while keeping the rest unchanged.

Process steps must describe what the TARGET CUSTOMER does TODAY — their CURRENT workflow, habits, frustrations, and workarounds BEFORE the product exists. Do NOT describe product implementation, setup, or usage.

You MUST respond with valid JSON only, no markdown. Return the COMPLETE list of steps (both fixed and unchanged) in this format:
{
  "job_map_steps": [
    { "step_number": 1, "description": "..." },
    ...
  ]
}

Generate ALL content in ${lang}.`;

    const userPrompt = `Product: ${idea_context.name}
Description: ${idea_context.description || "N/A"}
${idea_context.industry ? `Industry: ${idea_context.industry}` : ""}
${idea_context.target_audience ? `Target Audience: ${idea_context.target_audience}` : ""}

Current steps:
${allStepsInfo}

Flagged steps to fix:
${flaggedInfo}

Please fix the flagged steps while keeping the good ones. Return ALL steps.`;

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
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response");

    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(content);

    if (!parsed.job_map_steps || !Array.isArray(parsed.job_map_steps)) {
      throw new Error("Invalid AI response structure");
    }

    // Update framework
    const { error: updateErr } = await supabase
      .from("job_frameworks")
      .update({ job_map_steps: parsed.job_map_steps })
      .eq("id", framework_id);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to update steps" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, steps: parsed.job_map_steps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-steps error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
