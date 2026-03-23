import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      return new Response(JSON.stringify({ error: "idea_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof idea_id !== "string" || !uuidRegex.test(idea_id)) {
      return new Response(JSON.stringify({ error: "Invalid idea_id format" }), {
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: idea, error: ideaErr } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", idea_id)
      .single();

    if (ideaErr || !idea) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = idea.language === "fi" ? "Finnish" : "English";

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
          {
            role: "system",
            content: `You are a product research expert. Your task is to analyze a product idea and generate 2-3 clarifying questions that will help produce a much better research framework.

Focus on questions that uncover:
- Whether the target audience already has existing solutions/workarounds
- The biggest pain points or frustrations in the current process
- Key context about the market or customer behavior that would shape the research

You MUST respond with valid JSON only, no markdown, no code fences. Format:
{
  "questions": [
    {
      "question": "string - the clarifying question",
      "placeholder": "string - example answer to guide the user",
      "why": "string - brief explanation of why this question matters for the analysis"
    }
  ]
}

Generate ALL content in ${lang}. Generate exactly 2-3 questions.`,
          },
          {
            role: "user",
            content: `Analyze this product idea and generate clarifying questions:

**Product Idea:** ${idea.name}
**Description:** ${idea.description || "No description provided"}
${idea.industry ? `**Industry:** ${idea.industry}` : ""}
${idea.target_audience ? `**Target Audience:** ${idea.target_audience}` : ""}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
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
    if (!content) throw new Error("No AI response content");

    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(content);

    // Update idea status to clarifying
    await supabase.from("ideas").update({ status: "clarifying" }).eq("id", idea_id);

    return new Response(JSON.stringify({ success: true, questions: parsed.questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-clarifying-questions error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
