import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTranslateType } from "@/i18n/helpers";
import AppLayout from "@/components/AppLayout";
import DataCollection from "@/components/DataCollection";
import AnalysisView from "@/components/AnalysisView";
import IdeaStepper, { StepKey, stepIndex, STATUS_ORDER } from "@/components/IdeaStepper";
import StepActionBar from "@/components/StepActionBar";
import ProcessSteps from "@/components/ProcessSteps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, ClipboardList, BarChart3, Trash2, Plus, X, Download, ArrowRight, Loader2, Clock, Pencil, Check, FileText, MessageCircleQuestion, HelpCircle } from "lucide-react";
import jsPDF from "jspdf";
import { useGuidedTour } from "@/hooks/useGuidedTour";

interface Idea {
  id: string; name: string; description: string | null; status: string;
  industry: string | null; target_audience: string | null; budget: string | null;
  language: string; created_at: string;
}

interface JobFramework {
  id: string; job_executor: string | null; alternative_roles: any;
  job_map_steps: any; interview_questions: any; survey_template: any;
}

interface Outcome {
  id: string; statement: string; type: string;
  importance: number | null; satisfaction: number | null;
}

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const translateType = useTranslateType();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [framework, setFramework] = useState<JobFramework | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [positioning, setPositioning] = useState<any>(null);
  const [salesMessages, setSalesMessages] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [newOutcome, setNewOutcome] = useState({ statement: "", type: "functional" });
  const [activeStep, setActiveStep] = useState<StepKey>("draft");
  const [descExpanded, setDescExpanded] = useState(false);
  const [frameworkSubStep, setFrameworkSubStep] = useState(0);

  // Editing states
  const [editingStepIdx, setEditingStepIdx] = useState<number | null>(null);
  const [editStepText, setEditStepText] = useState("");
  const [newStepText, setNewStepText] = useState("");

  const [editingQuestionKey, setEditingQuestionKey] = useState<{ cat: string; idx: number } | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionCat, setNewQuestionCat] = useState<"top_level" | "deep" | "clarifying">("deep");
  const analyzingRef = useRef<HTMLDivElement>(null);

  // Clarifying questions flow
  const [clarifyingQuestions, setClarifyingQuestions] = useState<{ question: string; placeholder: string; why: string }[]>([]);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<Record<number, string>>({});
  const [loadingClarifying, setLoadingClarifying] = useState(false);
  const [regeneratingGuide, setRegeneratingGuide] = useState(false);

  const isEditable = idea && ["framework_ready", "draft", "data_collection"].includes(idea.status);
  const tourReady = !loading && !!idea && !!framework;
  const { startTour } = useGuidedTour({ activeStep, ready: tourReady, frameworkSubStep, setFrameworkSubStep });
  const fetchData = useCallback(async () => {
    if (!id) return;
    const [ideaRes, fwRes, outRes, analysisRowsRes, posRes, salesRes] = await Promise.all([
      supabase.from("ideas").select("*").eq("id", id).single(),
      supabase.from("job_frameworks").select("*").eq("idea_id", id).maybeSingle(),
      supabase.from("outcomes").select("*").eq("idea_id", id).order("created_at"),
      supabase.from("analyses").select("*").eq("idea_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("positioning_strategies").select("*").eq("idea_id", id).maybeSingle(),
      supabase.from("sales_messages").select("*").eq("idea_id", id).maybeSingle(),
    ]);
    if (ideaRes.error || !ideaRes.data) {
      toast.error(t("idea.notFound"));
      navigate("/dashboard");
      return;
    }
    setIdea(ideaRes.data);
    setFramework(fwRes.data || null);
    setOutcomes(outRes.data || []);
    setAnalysis((analysisRowsRes.data && analysisRowsRes.data.length > 0) ? analysisRowsRes.data[0] : null);
    setPositioning(posRes.data || null);
    setSalesMessages(salesRes.data || null);
    // Set active step to current status
    const status = ideaRes.data.status as StepKey;
    if (STATUS_ORDER.includes(status)) {
      setActiveStep(status);
    } else if (ideaRes.data.status === "clarifying") {
      setActiveStep("draft");
    }
    setLoading(false);
  }, [id, navigate, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // #2: Auto-trigger clarifying questions for draft ideas
  const [autoGenerateTriggered, setAutoGenerateTriggered] = useState(false);
  useEffect(() => {
    if (idea?.status === "draft" && !generating && !autoGenerateTriggered && !loading && !loadingClarifying) {
      setAutoGenerateTriggered(true);
      handleGenerateClarifyingQuestions();
    }
  }, [idea?.status, generating, autoGenerateTriggered, loading, loadingClarifying]);

  // #3: Auto-regenerate interview guide when navigating to interview sub-step if steps/outcomes changed
  const computeInputHash = useCallback((steps: any[], outcomesList: { statement: string }[]) => {
    const stepsStr = steps.map((s: any) => s.description).sort().join("|");
    const outcomesStr = outcomesList.map((o) => o.statement).sort().join("|");
    const combined = stepsStr + ":::" + outcomesStr;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }, []);

  const guideRegenerationTriggered = useRef(false);
  useEffect(() => {
    if (frameworkSubStep !== 2 || !framework || !idea || outcomes.length === 0 || regeneratingGuide) return;
    if (guideRegenerationTriggered.current) return;

    const interviewQuestions = framework.interview_questions as any;
    if (!interviewQuestions?.themes) return; // no themed guide yet

    const storedHash = interviewQuestions._input_hash;
    const currentHash = computeInputHash(framework.job_map_steps as any[] || [], outcomes);

    if (storedHash && storedHash === currentHash) return; // no changes

    // Changes detected — regenerate
    guideRegenerationTriggered.current = true;
    setRegeneratingGuide(true);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { toast.error("Not authenticated"); setRegeneratingGuide(false); return; }

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-interview-guide`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ idea_id: idea.id, framework_id: framework.id }),
        });

        if (res.ok) {
          toast.success(t("interviewGuide.regenerated"));
          await fetchData();
        } else {
          const err = await res.json();
          toast.error(err.error || t("interviewGuide.regenerateFailed"));
        }
      } catch {
        toast.error(t("interviewGuide.regenerateFailed"));
      }
      setRegeneratingGuide(false);
      guideRegenerationTriggered.current = false;
    })();
  }, [frameworkSubStep, framework, idea, outcomes, regeneratingGuide, computeInputHash, t, fetchData]);

  // --- Framework update helper ---
  const updateFramework = async (updates: Partial<JobFramework>) => {
    if (!framework) return;
    const { error } = await supabase.from("job_frameworks").update(updates).eq("id", framework.id);
    if (error) { toast.error("Update failed"); return; }
    await fetchData();
  };

  // --- Process Steps CRUD ---
  const addStep = async () => {
    if (!newStepText.trim() || !framework) return;
    const steps = [...(framework.job_map_steps as any[])];
    steps.push({ step_number: steps.length + 1, description: newStepText.trim() });
    await updateFramework({ job_map_steps: steps as any });
    setNewStepText("");
  };

  const saveStep = async (idx: number) => {
    if (!framework) return;
    const steps = [...(framework.job_map_steps as any[])];
    steps[idx] = { ...steps[idx], description: editStepText };
    await updateFramework({ job_map_steps: steps as any });
    setEditingStepIdx(null);
  };

  const deleteStep = async (idx: number) => {
    if (!framework) return;
    const steps = (framework.job_map_steps as any[]).filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, step_number: i + 1 }));
    await updateFramework({ job_map_steps: steps as any });
  };

  // --- Interview Questions CRUD ---
  const getInterviewCats = (): { top_level: string[]; deep: string[]; clarifying: string[] } => {
    const q = framework?.interview_questions;
    if (!q) return { top_level: [], deep: [], clarifying: [] };
    if (Array.isArray(q)) return { top_level: q.slice(0, 4), deep: q.slice(4, Math.max(4, q.length - 4)), clarifying: q.slice(Math.max(4, q.length - 4)) };
    return { top_level: q.top_level || [], deep: q.deep || [], clarifying: q.clarifying || [] };
  };

  const addQuestion = async () => {
    if (!newQuestionText.trim() || !framework) return;
    const cats = getInterviewCats();
    cats[newQuestionCat] = [...cats[newQuestionCat], newQuestionText.trim()];
    await updateFramework({ interview_questions: cats as any });
    setNewQuestionText("");
  };

  const saveQuestion = async (cat: string, idx: number) => {
    if (!framework) return;
    const cats = getInterviewCats();
    (cats as any)[cat][idx] = editQuestionText;
    await updateFramework({ interview_questions: cats as any });
    setEditingQuestionKey(null);
  };

  const deleteQuestion = async (cat: string, idx: number) => {
    if (!framework) return;
    const cats = getInterviewCats();
    (cats as any)[cat] = (cats as any)[cat].filter((_: any, i: number) => i !== idx);
    await updateFramework({ interview_questions: cats as any });
  };

  // --- Interview guide helper ---
  const getInterviewGuide = () => {
    const q = framework?.interview_questions;
    if (!q) return null;
    // New format has 'themes' array
    if (q.themes && Array.isArray(q.themes)) return q;
    return null;
  };

  // --- Exports ---
  const exportInterviewPDF = () => {
    const guide = getInterviewGuide();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(18);
    doc.text(t("interviewGuide.title"), 14, y);
    y += 10;

    if (idea) {
      doc.setFontSize(10);
      doc.text(idea.name, 14, y);
      y += 8;
    }

    if (guide?.themes) {
      const totalTime = guide.total_time_min || guide.themes.reduce((s: number, th: any) => s + (th.time_estimate_min || 10), 0);
      doc.setFontSize(10);
      doc.text(t("interview.totalTime").replace("{min}", String(totalTime)), 14, y);
      y += 6;

      if (guide.recommended_interviews) {
        doc.text(`${t("interviewGuide.recommendedInterviews")}: ${guide.recommended_interviews.recommended} (${guide.recommended_interviews.min}-${guide.recommended_interviews.max})`, 14, y);
        y += 12;
      }

      for (const theme of guide.themes) {
        if (y > 240) { doc.addPage(); y = 20; }

        doc.setFontSize(13);
        doc.text(theme.theme_name, 14, y);
        y += 6;

        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`~${theme.time_estimate_min || 10} min`, 14, y);
        doc.setTextColor(0, 0, 0);
        y += 8;

        // Open questions
        doc.setFontSize(10);
        for (const q of (theme.open_questions || [])) {
          if (y > 275) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(`• ${q}`, pageWidth - 28);
          doc.text(lines, 14, y);
          y += lines.length * 5 + 3;
        }

        // Scored outcomes
        if (theme.scored_outcomes?.length > 0) {
          y += 4;
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          const scoredHeader = idea?.language === "fi"
            ? "Arvioi nämä tarpeet (1-10):"
            : "Rate these needs (1-10):";
          doc.text(scoredHeader, 14, y);
          doc.setTextColor(0, 0, 0);
          y += 7;

          const impLabel = idea?.language === "fi" ? "Tärkeys" : "Importance";
          const satLabel = idea?.language === "fi" ? "Tyytyväisyys" : "Satisfaction";

          doc.setFontSize(10);
          for (const s of theme.scored_outcomes) {
            if (y > 260) { doc.addPage(); y = 20; }
            // Statement on its own line
            const stmtLines = doc.splitTextToSize(`  • ${s}`, pageWidth - 28);
            doc.text(stmtLines, 14, y);
            y += stmtLines.length * 5 + 2;
            // Score boxes on next line, indented
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`      ${impLabel}: _____ / 10       ${satLabel}: _____ / 10`, 14, y);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            y += 7;
          }
        }
        y += 6;
      }

      // Closing questions
      if (guide.closing_questions?.length > 0) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.text(t("interviewGuide.closingQuestions"), 14, y);
        y += 8;
        doc.setFontSize(10);
        for (const q of guide.closing_questions) {
          if (y > 275) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(`• ${q}`, pageWidth - 28);
          doc.text(lines, 14, y);
          y += lines.length * 5 + 3;
        }
      }
    } else {
      // Legacy fallback
      const cats = getInterviewCats();
      const totalTime = cats.top_level.length * 3 + cats.deep.length * 3 + cats.clarifying.length * 2;
      doc.setFontSize(10);
      doc.text(t("interview.totalTime").replace("{min}", String(totalTime)), 14, y);
      y += 12;
      const sections = [
        { title: t("interview.topLevel"), questions: cats.top_level },
        { title: t("interview.deep"), questions: cats.deep },
        { title: t("interview.clarifying"), questions: cats.clarifying },
      ];
      for (const sec of sections) {
        if (sec.questions.length === 0) continue;
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.text(sec.title, 14, y);
        y += 8;
        doc.setFontSize(10);
        sec.questions.forEach((q, i) => {
          if (y > 275) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(`${i + 1}. ${q}`, pageWidth - 28);
          doc.text(lines, 14, y);
          y += lines.length * 5 + 3;
        });
        y += 6;
      }
    }

    doc.save(`${idea?.name || "interview"}_guide.pdf`);
  };


  // --- Other handlers ---
  const handleDelete = async () => {
    if (!id || !confirm(t("idea.deleteConfirm"))) return;
    const { error } = await supabase.from("ideas").delete().eq("id", id);
    if (error) toast.error(t("idea.deleteFailed"));
    else { toast.success(t("idea.deleted")); navigate("/dashboard"); }
  };

  const handleGenerateClarifyingQuestions = async () => {
    if (!id) return;
    setLoadingClarifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-clarifying-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ idea_id: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If clarifying fails, fall back to direct generation
        toast.error(data.error || "Failed to generate questions");
        handleGenerate();
      } else {
        setClarifyingQuestions(data.questions || []);
        // Initialize empty answers
        const answers: Record<number, string> = {};
        (data.questions || []).forEach((_: any, i: number) => { answers[i] = ""; });
        setClarifyingAnswers(answers);
        await fetchData(); // Refresh to get "clarifying" status
      }
    } catch {
      handleGenerate(); // fallback
    }
    setLoadingClarifying(false);
  };

  const handleGenerateWithAnswers = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const answers = clarifyingQuestions.map((q, i) => ({
        question: q.question,
        answer: clarifyingAnswers[i] || "",
      })).filter(a => a.answer.trim());

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-framework`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ idea_id: id, clarifying_answers: answers }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || t("framework.genFailed"));
      else { toast.success(t("framework.generated")); await fetchData(); }
    } catch (e) {
      toast.error(t("framework.failedGenerate"));
    }
    setGenerating(false);
  };

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-framework`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ idea_id: id }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || t("framework.genFailed"));
      else { toast.success(t("framework.generated")); await fetchData(); }
    } catch (e) {
      toast.error(t("framework.failedGenerate"));
    }
    setGenerating(false);
  };

  const addOutcome = async () => {
    if (!id || !newOutcome.statement.trim()) return;
    const { error } = await supabase.from("outcomes").insert({ idea_id: id, statement: newOutcome.statement, type: newOutcome.type });
    if (error) toast.error(t("outcomes.addFailed"));
    else { setNewOutcome({ statement: "", type: "functional" }); fetchData(); }
  };

  const deleteOutcome = async (outcomeId: string) => {
    const { error } = await supabase.from("outcomes").delete().eq("id", outcomeId);
    if (error) toast.error(t("outcomes.deleteFailed"));
    else fetchData();
  };

  const approveFramework = async () => {
    if (!id) return;
    const { error } = await supabase.from("ideas").update({ status: "data_collection" }).eq("id", id);
    if (error) toast.error(t("approve.failed"));
    else { toast.success(t("approve.success")); fetchData(); }
  };

  const downloadCSV = () => {
    if (!outcomes.length) return;
    const headers = `${t("label.statement")},${t("label.type")},${t("label.importance")},${t("label.satisfaction")}\n`;
    const rows = outcomes.map(o => `"${o.statement}","${o.type}",${o.importance ?? ""},${o.satisfaction ?? ""}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${idea?.name || "outcomes"}_outcomes.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // --- Interview content renderer (themed or legacy) ---
  const renderInterviewContent = () => {
    const guide = getInterviewGuide();

    if (guide?.themes) {
      // New themed interview guide
      const totalTime = guide.total_time_min || guide.themes.reduce((s: number, th: any) => s + (th.time_estimate_min || 10), 0);
      return (
        <div className="space-y-6">
          {/* Header info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {t("interview.totalTime").replace("{min}", String(totalTime))}
            </span>
            {guide.recommended_interviews && (
              <span className="inline-flex items-center gap-1">
                <ClipboardList className="h-4 w-4" />
                {t("interviewGuide.recommendedInterviews")}: {guide.recommended_interviews.recommended} ({guide.recommended_interviews.min}–{guide.recommended_interviews.max})
              </span>
            )}
          </div>
          {guide.recommended_interviews?.rationale && (
            <p className="text-xs text-muted-foreground italic">{guide.recommended_interviews.rationale}</p>
          )}

          {/* Themes */}
          {guide.themes.map((theme: any, ti: number) => (
            <div key={ti} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("interviewGuide.theme")} {ti + 1}</Badge>
                  <h4 className="text-sm font-semibold">{theme.theme_name}</h4>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  ~{theme.time_estimate_min || 10} min
                </span>
              </div>

              {theme.related_steps?.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("interviewGuide.relatedSteps")}: {theme.related_steps.map((s: number) => `${t("phase.step")} ${s}`).join(", ")}
                </p>
              )}

              {/* Open questions */}
              {theme.open_questions?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{t("interviewGuide.openQuestions")}</p>
                  {theme.open_questions.map((q: string, qi: number) => (
                    <p key={qi} className="text-sm leading-relaxed pl-3">{qi + 1}. {q}</p>
                  ))}
                </div>
              )}

              {/* Scored outcomes */}
              {theme.scored_outcomes?.length > 0 && (
                <div className="space-y-1 rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-semibold">{t("interviewGuide.scoredOutcomes")}</p>
                  {theme.scored_outcomes.map((s: string, si: number) => (
                    <div key={si} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="text-xs shrink-0">1-10</Badge>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Closing questions */}
          {guide.closing_questions?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{t("interviewGuide.closingQuestions")}</h4>
              {guide.closing_questions.map((q: string, i: number) => (
                <p key={i} className="text-sm leading-relaxed pl-3">{i + 1}. {q}</p>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Legacy: old categorized interview questions
    return renderLegacyInterviewQuestions();
  };

  // Legacy interview questions renderer (for old frameworks)
  const renderLegacyInterviewQuestions = () => {
    const cats = getInterviewCats();
    const totalTime = cats.top_level.length * 3 + cats.deep.length * 3 + cats.clarifying.length * 2;

    const renderTimeEstimate = (min: number) => (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {t("interview.estimatedTime").replace("{min}", String(min))}
      </span>
    );

    const renderCategory = (catKey: string, title: string, desc: string, questions: string[], minPerQ: number) => {
      if (questions.length === 0 && !isEditable) return null;
      return (
        <div key={catKey} className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{title}</h4>
            {questions.length > 0 && renderTimeEstimate(questions.length * minPerQ)}
          </div>
          <p className="text-xs text-muted-foreground">{desc}</p>
          <div className="space-y-1.5">
            {questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 group">
                {editingQuestionKey?.cat === catKey && editingQuestionKey?.idx === i ? (
                  <div className="flex-1 flex gap-2">
                    <Input value={editQuestionText} onChange={e => setEditQuestionText(e.target.value)} className="flex-1 text-sm" />
                    <Button size="sm" variant="ghost" onClick={() => saveQuestion(catKey, i)}><Check className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingQuestionKey(null)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm leading-relaxed flex-1">{i + 1}. {q}</span>
                    {isEditable && (
                      <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingQuestionKey({ cat: catKey, idx: i }); setEditQuestionText(q); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteQuestion(catKey, i)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          {t("interview.totalTime").replace("{min}", String(totalTime))}
        </div>

        {renderCategory("top_level", t("interview.topLevel"), t("interview.topLevelDesc"), cats.top_level, 3)}
        {renderCategory("deep", t("interview.deep"), t("interview.deepDesc"), cats.deep, 3)}
        {renderCategory("clarifying", t("interview.clarifying"), t("interview.clarifyingDesc"), cats.clarifying, 2)}

        {isEditable && (
          <div className="flex gap-2 pt-2 border-t">
            <Input placeholder={t("interview.title") + "…"} value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} className="flex-1" />
            <Select value={newQuestionCat} onValueChange={v => setNewQuestionCat(v as any)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="top_level">{t("interview.topLevel")}</SelectItem>
                <SelectItem value="deep">{t("interview.deep")}</SelectItem>
                <SelectItem value="clarifying">{t("interview.clarifying")}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={addQuestion} disabled={!newQuestionText.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!idea) return null;

  const statusLabel = (status: string) => {
    const key = `status.${status}` as any;
    return t(key) || status;
  };

  // --- Step content renderers ---

  const renderDraftStep = () => {
    // Show clarifying questions if we have them
    if ((idea.status === "clarifying" || clarifyingQuestions.length > 0) && !generating) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircleQuestion className="h-5 w-5 text-primary" />
              {t("clarifying.title")}
            </CardTitle>
            <CardDescription>{t("clarifying.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clarifyingQuestions.map((q, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-2">
                <label className="text-sm font-semibold">{q.question}</label>
                {q.why && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">{t("clarifying.why")}:</span> {q.why}
                  </p>
                )}
                <Textarea
                  value={clarifyingAnswers[i] || ""}
                  onChange={e => setClarifyingAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                  placeholder={q.placeholder}
                  rows={2}
                  className="text-sm"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleGenerateWithAnswers} className="gap-2">
                <Sparkles className="h-4 w-4" /> {t("clarifying.continue")}
              </Button>
              <Button variant="ghost" onClick={handleGenerate} className="text-muted-foreground">
                {t("clarifying.skip")}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Loading state (generating clarifying questions or framework)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("framework.generateTitle")}
          </CardTitle>
          <CardDescription>{t("framework.generateDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              {generating ? t("framework.generating") : t("clarifying.loading")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const FRAMEWORK_SUB_STEPS = [
    { name: t("substep.jobMap") },
    { name: t("substep.outcomes") },
    { name: t("substep.interview") },
  ];

  const renderFrameworkStep = () => {
    if (!framework) {
      return renderDraftStep();
    }

    const subStepIndicator = t("substep.indicator")
      .replace("{current}", String(frameworkSubStep + 1))
      .replace("{total}", String(FRAMEWORK_SUB_STEPS.length))
      .replace("{name}", FRAMEWORK_SUB_STEPS[frameworkSubStep].name);

    const renderJobMapContent = () => (
      <Card data-tour="jobmap-card">
        <CardHeader>
          <CardTitle>{t("jobMap.title")}</CardTitle>
          <CardDescription>{t("steps.contextInfo")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProcessSteps
            framework={framework}
            ideaId={idea.id}
            ideaName={idea.name}
            ideaDescription={idea.description}
            ideaIndustry={idea.industry}
            ideaTargetAudience={idea.target_audience}
            ideaLanguage={idea.language}
            isEditable={!!isEditable}
            onRefresh={fetchData}
          />
        </CardContent>
      </Card>
    );

    const renderOutcomesContent = () => (
      <Card data-tour="outcomes-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("outcomes.title")}</CardTitle>
              <CardDescription>{outcomes.length} {t("outcomes.generated")}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-2">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditable && (
            <div className="flex gap-2">
              <Input placeholder={t("outcomes.addPlaceholder")} value={newOutcome.statement} onChange={e => setNewOutcome(o => ({ ...o, statement: e.target.value }))} className="flex-1" />
              <Select value={newOutcome.type} onValueChange={v => setNewOutcome(o => ({ ...o, type: v }))}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="functional">{t("outcomes.functional")}</SelectItem>
                  <SelectItem value="emotional">{t("outcomes.emotional")}</SelectItem>
                  <SelectItem value="social">{t("outcomes.social")}</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addOutcome} disabled={!newOutcome.statement.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="space-y-2">
            {outcomes.map(o => (
              <div key={o.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <Badge variant="outline" className="shrink-0 text-xs">{translateType(o.type)}</Badge>
                <span className="flex-1">{o.statement}</span>
                {isEditable && (
                  <Button variant="ghost" size="sm" onClick={() => deleteOutcome(o.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" aria-label={`${t("outcomes.title")} — ${o.statement}`}>
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );

    const renderInterviewGuideContent = () => (
      <Card data-tour="interview-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("interviewGuide.title")}</CardTitle>
              <CardDescription>{t("interviewGuide.desc")}</CardDescription>
            </div>
            {!regeneratingGuide && (
              <Button variant="outline" size="sm" onClick={exportInterviewPDF} className="gap-2">
                <FileText className="h-4 w-4" /> PDF
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {regeneratingGuide ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">{t("interviewGuide.regenerating")}</p>
            </div>
          ) : (
            renderInterviewContent()
          )}
        </CardContent>
      </Card>
    );

    return (
      <div className="space-y-4">
        {frameworkSubStep === 0 && renderJobMapContent()}
        {frameworkSubStep === 1 && renderOutcomesContent()}
        {frameworkSubStep === 2 && renderInterviewGuideContent()}

        <StepActionBar
          subStepIndicator={subStepIndicator}
          onBack={frameworkSubStep > 0 ? () => setFrameworkSubStep(s => s - 1) : undefined}
          backLabel={t("substep.back")}
          onNext={
            frameworkSubStep < 2
              ? () => setFrameworkSubStep(s => s + 1)
              : idea.status === "framework_ready"
                ? approveFramework
                : undefined
          }
          nextLabel={
            frameworkSubStep < 2
              ? `${t("substep.next")}: ${FRAMEWORK_SUB_STEPS[frameworkSubStep + 1].name}`
              : idea.status === "framework_ready"
                ? t("substep.approveAndProceed")
                : undefined
          }
        />
      </div>
    );
  };


  const handleDataCollectionComplete = async () => {
    setAnalyzing(true);
    // Scroll to analyzing indicator after a tick
    setTimeout(() => {
      analyzingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      // 1. Analyze
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-results`, {
        method: "POST", headers, body: JSON.stringify({ idea_id: idea.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || t("analyzing.failed")); setAnalyzing(false); return; }
      toast.success(t("analyzing.complete"));

      // 2. Generate positioning automatically
      const posRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-positioning`, {
        method: "POST", headers, body: JSON.stringify({ idea_id: idea.id }),
      });
      if (posRes.ok) {
        // 3. Generate sales messages automatically
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sales-messages`, {
          method: "POST", headers, body: JSON.stringify({ idea_id: idea.id }),
        });
      }

      await fetchData();
    } catch (e) {
      toast.error(t("analyzing.failedGeneral"));
    }
    setAnalyzing(false);
  };

  const renderDataCollectionStep = () => {
    if (outcomes.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("outcomes.title")}: 0
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <DataCollection
          ideaId={idea.id}
          outcomes={outcomes}
          interviewGuide={getInterviewGuide()}
          onRefresh={fetchData}
          onComplete={handleDataCollectionComplete}
        />
        {analyzing && (
          <div ref={analyzingRef}>
            <Card>
              <CardContent className="py-12 space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="text-center space-y-1">
                    <p className="text-base font-semibold">{t("analyzing.progress")}</p>
                    <p className="text-sm text-muted-foreground">{t("analyzing.progressDesc")}</p>
                  </div>
                </div>
                <div className="relative h-2 w-full max-w-md mx-auto overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary rounded-full" style={{ animation: 'analyzing-progress 4s ease-in-out infinite', width: '70%' }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderAnalysisStep = () => (
    <AnalysisView
      ideaName={idea.name}
      ideaId={idea.id}
      outcomes={outcomes}
      analysis={analysis}
      positioning={positioning}
      salesMessages={salesMessages}
      onRefresh={fetchData}
    />
  );

  // Determine what to render based on activeStep
  const renderActiveStepContent = () => {
    switch (activeStep) {
      case "draft":
        if (idea.status === "draft" || idea.status === "clarifying") return renderDraftStep();
        // If past draft, show framework (user clicked back to step 1 — show idea info only)
        return (
          <Card>
            <CardHeader>
              <CardTitle>{idea.name}</CardTitle>
              <CardDescription className={`whitespace-pre-line ${!descExpanded ? "line-clamp-2" : ""}`}>
                {idea.description}
                {idea.description && idea.description.length > 120 && (
                  <button
                    type="button"
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="ml-1 text-xs font-medium text-primary hover:underline"
                  >
                    {descExpanded ? t("idea.showLess") : t("idea.showMore")}
                  </button>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {idea.industry && <span>{t("idea.industry")}: {idea.industry}</span>}
                {idea.target_audience && <span>{t("idea.audience")}: {idea.target_audience}</span>}
                
                <span>{t("idea.aiLanguage")}: {idea.language === "fi" ? "Suomi" : "English"}</span>
              </div>
            </CardContent>
          </Card>
        );
      case "framework_ready":
        return renderFrameworkStep();
      case "data_collection":
        return renderDataCollectionStep();
      case "analyzed":
        return renderAnalysisStep();
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {t("idea.dashboard")}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> {t("idea.delete")}
          </Button>
        </div>

        {/* Idea header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{idea.name}</h1>
            <Badge variant="secondary">{statusLabel(idea.status)}</Badge>
          </div>
          {idea.description && activeStep !== "draft" && (
            <div className="mt-2">
              <p className={`text-muted-foreground whitespace-pre-line ${!descExpanded ? "line-clamp-2" : ""}`}>
                {idea.description}
              </p>
              {idea.description.length > 120 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                >
                  {descExpanded ? t("idea.showLess") : t("idea.showMore")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stepper + Tour button */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <IdeaStepper
              ideaStatus={idea.status}
              activeStep={activeStep}
              onStepClick={setActiveStep}
            />
          </div>
          {["framework_ready", "data_collection", "analyzed"].includes(activeStep) && (
            <Button variant="ghost" size="sm" onClick={startTour} className="gap-1.5 shrink-0 text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tour.btn")}</span>
            </Button>
          )}
        </div>

        {/* Active step content */}
        {renderActiveStepContent()}
      </div>
    </AppLayout>
  );
}
