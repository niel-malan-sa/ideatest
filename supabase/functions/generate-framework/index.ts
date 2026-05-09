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
    const { idea_id, clarifying_answers } = body;
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

    const { data: idea, error: ideaErr } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", idea_id)
      .single();

    if (ideaErr || !idea) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = idea.language === "fi" ? "Finnish" : "English";

    const systemPrompt = `You are a product research expert who helps teams validate product ideas using needs-based analysis. You create combined interview guides that include both qualitative questions and quantitative outcome scoring within a single interview session.

You MUST respond with valid JSON only, no markdown, no code fences. Your response must match this exact structure:
{
  "job_executor": "string - the primary person performing the task/activity",
  "alternative_roles": ["string array - 2-4 alternative stakeholder roles"],
  "job_map_steps": [
    {
      "step_number": 1,
      "description": "string - what happens in this step, described as a user activity"
    }
  ],
  "outcomes": [
    {
      "statement": "string - a clear need statement in plain language, e.g. 'Spend less time searching for relevant information'. Do NOT use 'Minimize/Maximize the [metric] when [context]' format.",
      "type": "functional|emotional|social"
    }
  ],
  "interview_guide": {
    "recommended_interviews": {
      "min": 5,
      "max": 15,
      "recommended": 8,
      "rationale": "string - why this number of interviews is recommended for this specific idea"
    },
    "themes": [
      {
        "theme_name": "string - descriptive theme name tied to 1-2 process steps",
        "related_steps": [1, 2],
        "time_estimate_min": 12,
        "open_questions": ["string array - 2-3 open-ended qualitative questions for this theme"],
        "scored_outcomes": ["string array - 1-3 outcome statements (matching outcomes above) to score importance+satisfaction 1-10 during this theme"]
      }
    ],
    "total_time_min": "number - CALCULATE this based on the actual number of themes and questions. Do NOT default to 60.",
    "closing_questions": ["string array - 1-2 wrap-up questions"]
  }
}

Generate ALL content in ${lang}.
Process steps MUST describe what the TARGET CUSTOMER does TODAY — their CURRENT workflow, habits, frustrations, and workarounds BEFORE your product exists. Do NOT describe the product's implementation, setup, or usage process. The job executor is the person who experiences the problem, not the person selling the solution.
For example, if the product is "local AI for sensitive data", the steps should describe how the customer CURRENTLY handles sensitive data with AI (e.g. "Manually redact sensitive fields before uploading to cloud AI", "Wait for IT security approval to use external tools") — NOT how they would install or configure the new product.
Process steps should have 8-12 steps describing the end customer's current activity from recognizing the need to evaluating whether the task was completed successfully.
Generate as many outcome/need statements as genuinely relevant for this idea — typically 10-25. Quality over quantity. Stop when you run out of real insights. Do NOT pad with repetitive or fabricated outcomes. Mix functional, emotional, and social types. Use clear, natural language.
The interview_guide should contain 4-6 themes. ESTIMATE each theme's time_estimate_min realistically based on the number of open questions (~3 min each) and scored outcomes (~2 min each). Then set total_time_min as the sum of all theme times plus 5 min for intro and closing. The total can be 30-90 min depending on complexity — do NOT hardcode 60.
Select 5-8 of the most critical outcomes to be scored (importance + satisfaction 1-10) during the interview — distribute them across themes.
Each theme should have 2-3 open questions and 1-3 scored outcomes.
The scored_outcomes strings must exactly match outcome statements from the outcomes array.`;

    let userPrompt = `Analyze this product idea and create a needs-based research framework with a combined interview guide:

**Product Idea:** ${idea.name}
**Description:** ${idea.description || "No description provided"}
${idea.industry ? `**Industry:** ${idea.industry}` : ""}
${idea.target_audience ? `**Target Audience:** ${idea.target_audience}` : ""}`;

    // Add clarifying answers if provided
    if (clarifying_answers && Array.isArray(clarifying_answers) && clarifying_answers.length > 0) {
      userPrompt += `\n\n**Additional context from user:**\n`;
      for (const qa of clarifying_answers) {
        if (qa.question && qa.answer) {
          userPrompt += `\n**Q:** ${qa.question}\n**A:** ${qa.answer}\n`;
        }
      }
    }

    userPrompt += `\n\nGenerate a complete analysis framework with primary actor, process steps, need statements, and a themed interview guide that combines qualitative questions with outcome scoring.`;

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("OpenAI API error");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response content");

    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const rawFramework = JSON.parse(content);

    // Validate AI response structure
    const ThemeSchema = z.object({
      theme_name: z.string(),
      related_steps: z.array(z.number()).default([]),
      time_estimate_min: z.number().default(10),
      open_questions: z.array(z.string()).default([]),
      scored_outcomes: z.array(z.string()).default([]),
    });

    const InterviewGuideSchema = z.object({
      recommended_interviews: z.object({
        min: z.number().default(5),
        max: z.number().default(15),
        recommended: z.number().default(8),
        rationale: z.string().default(""),
      }).default({ min: 5, max: 15, recommended: 8, rationale: "" }),
      themes: z.array(ThemeSchema).default([]),
      total_time_min: z.number().default(60),
      closing_questions: z.array(z.string()).default([]),
    });

    // Legacy support
    const LegacyInterviewQuestionsSchema = z.union([
      z.object({
        top_level: z.array(z.string()).default([]),
        deep: z.array(z.string()).default([]),
        clarifying: z.array(z.string()).default([]),
      }),
      z.array(z.string()),
    ]);

    const FrameworkSchema = z.object({
      job_executor: z.string().default("Unknown"),
      alternative_roles: z.array(z.string()).default([]),
      job_map_steps: z.array(z.object({
        step_number: z.number(),
        description: z.string(),
        phase: z.string().optional(),
      })).default([]),
      outcomes: z.array(z.object({
        statement: z.string().min(1),
        type: z.enum(["functional", "emotional", "social"]).default("functional"),
      })).default([]),
      // New format
      interview_guide: InterviewGuideSchema.optional(),
      // Legacy fallback
      interview_questions: LegacyInterviewQuestionsSchema.optional(),
      survey_template: z.array(z.any()).optional(),
    });

    const parseResult = FrameworkSchema.safeParse(rawFramework);
    if (!parseResult.success) {
      console.error("AI response validation failed:", parseResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to process AI response. Please try again." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const framework = parseResult.data;

    // Build interview_questions from new format for storage (backward compatible)
    let interviewQuestions: any;
    if (framework.interview_guide) {
      interviewQuestions = framework.interview_guide;
    } else if (framework.interview_questions) {
      if (Array.isArray(framework.interview_questions)) {
        const flat = framework.interview_questions as string[];
        interviewQuestions = {
          top_level: flat.slice(0, 4),
          deep: flat.slice(4, Math.max(4, flat.length - 4)),
          clarifying: flat.slice(Math.max(4, flat.length - 4)),
        };
      } else {
        interviewQuestions = framework.interview_questions;
      }
    }

    // Add input hash for change tracking
    if (interviewQuestions && framework.job_map_steps && framework.outcomes) {
      const stepsStr = framework.job_map_steps.map((s: any) => s.description).sort().join("|");
      const outcomesStr = framework.outcomes.map((o: any) => o.statement).sort().join("|");
      const combined = stepsStr + ":::" + outcomesStr;
      let hash = 0;
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      interviewQuestions._input_hash = hash.toString(36);
    }

    // Save framework to DB
    const { error: fwErr } = await supabase.from("job_frameworks").insert({
      idea_id,
      job_executor: framework.job_executor,
      alternative_roles: framework.alternative_roles,
      job_map_steps: framework.job_map_steps,
      interview_questions: interviewQuestions,
      survey_template: [], // No longer generating surveys
    });
    if (fwErr) {
      console.error("Framework insert error:", fwErr);
      return new Response(
        JSON.stringify({ error: "Failed to save framework. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save outcomes
    const outcomeRows = framework.outcomes.map((o) => ({
      idea_id,
      statement: o.statement,
      type: o.type,
    }));
    if (outcomeRows.length > 0) {
      const { error: outErr } = await supabase.from("outcomes").insert(outcomeRows);
      if (outErr) {
        console.error("Outcomes insert error:", outErr);
      }
    }

    // Update idea status
    const { error: updateErr } = await supabase
      .from("ideas")
      .update({ status: "framework_ready" })
      .eq("id", idea_id);
    if (updateErr) {
      console.error("Status update error:", updateErr);
    }

    return new Response(JSON.stringify({ success: true, framework }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-framework error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
