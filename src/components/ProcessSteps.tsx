import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, Plus, Sparkles, Loader2, Users, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProcessStep {
  step_number: number;
  description: string;
  phase?: string;
}

interface ProcessStepsProps {
  framework: {
    id: string;
    job_executor: string | null;
    alternative_roles: any;
    job_map_steps: any;
  };
  ideaId: string;
  ideaName: string;
  ideaDescription: string | null;
  ideaIndustry: string | null;
  ideaTargetAudience: string | null;
  ideaLanguage: string;
  isEditable: boolean;
  onRefresh: () => Promise<void>;
}

export default function ProcessSteps({
  framework,
  ideaId,
  ideaName,
  ideaDescription,
  ideaIndustry,
  ideaTargetAudience,
  ideaLanguage,
  isEditable,
  onRefresh,
}: ProcessStepsProps) {
  const { locale, t } = useLanguage();
  const steps = (framework.job_map_steps as ProcessStep[]) || [];

  const [flaggedSteps, setFlaggedSteps] = useState<Set<number>>(new Set());
  const [flagComments, setFlagComments] = useState<Record<number, string>>({});
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepText, setNewStepText] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const updateFramework = async (updates: any) => {
    const { error } = await supabase.from("job_frameworks").update(updates).eq("id", framework.id);
    if (error) { toast.error("Update failed"); return; }
    await onRefresh();
  };

  const handleSaveStep = async (idx: number) => {
    const updated = [...steps];
    updated[idx] = { ...updated[idx], description: editText };
    await updateFramework({ job_map_steps: updated });
    setEditingIdx(null);
    setStatusMessage(locale === "fi" ? "Vaihe tallennettu" : "Step saved");
  };

  const handleDeleteStep = async (idx: number) => {
    const updated = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 }));
    await updateFramework({ job_map_steps: updated });
    setFlaggedSteps(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    setStatusMessage(locale === "fi" ? "Vaihe poistettu" : "Step deleted");
  };

  const handleAddStep = async () => {
    if (!newStepText.trim()) return;
    const updated = [...steps, { step_number: steps.length + 1, description: newStepText.trim() }];
    await updateFramework({ job_map_steps: updated });
    setNewStepText("");
    setShowAddStep(false);
    setStatusMessage(locale === "fi" ? "Uusi vaihe lisätty" : "New step added");
  };

  const handleRegenerateFlagged = async () => {
    if (flaggedSteps.size === 0) return;
    setRegenerating(true);
    setStatusMessage(locale === "fi" ? "Generoidaan uudelleen..." : "Regenerating...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast.error("Not authenticated"); return; }

      const flaggedInfo = Array.from(flaggedSteps).map(idx => ({
        step_number: steps[idx]?.step_number,
        description: steps[idx]?.description,
        comment: flagComments[idx] || "",
      }));

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          idea_id: ideaId,
          framework_id: framework.id,
          flagged_steps: flaggedInfo,
          all_steps: steps,
          idea_context: {
            name: ideaName,
            description: ideaDescription,
            industry: ideaIndustry,
            target_audience: ideaTargetAudience,
            language: ideaLanguage,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || t("steps.regenerateFailed"));
      } else {
        toast.success(t("steps.regenerateSuccess"));
        setFlaggedSteps(new Set());
        setFlagComments({});
        setStatusMessage(locale === "fi" ? "Vaiheet generoitu uudelleen" : "Steps regenerated");
        await onRefresh();
      }
    } catch {
      toast.error(t("steps.regenerateFailed"));
    }
    setRegenerating(false);
  };

  const toggleFlag = (idx: number) => {
    setFlaggedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
        setFlagComments(fc => { const n = { ...fc }; delete n[idx]; return n; });
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Live region for status announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">{statusMessage}</div>

      {/* Actor info */}
      <div className="flex flex-wrap gap-3" role="group" aria-label={locale === "fi" ? "Toimijatiedot" : "Actor information"}>
        {framework.job_executor && (
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-semibold">{t("jobMap.executor")}:</span> {framework.job_executor}
          </Badge>
        )}
        {framework.alternative_roles?.length > 0 && (
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-sm">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-semibold">{t("jobMap.altRoles")}:</span> {(framework.alternative_roles as string[]).join(", ")}
          </Badge>
        )}
      </div>

      {/* Steps timeline */}
      <Card>
        <CardContent className="pt-6">
          <ol className="relative list-none p-0 m-0" aria-label={locale === "fi" ? "Prosessivaiheet" : "Process steps"}>
            {steps.map((step, i) => {
              const isFlagged = flaggedSteps.has(i);
              const isEditing = editingIdx === i;

              return (
                <li key={i} className="relative flex gap-4 pb-6 last:pb-0" aria-label={`${locale === "fi" ? "Vaihe" : "Step"} ${step.step_number || i + 1}: ${step.description}`}>
                  {/* Timeline line */}
                  {i < steps.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" aria-hidden="true" />
                  )}

                  {/* Number bubble */}
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isFlagged
                        ? "bg-destructive/15 text-destructive border-2 border-destructive/30"
                        : "bg-primary text-primary-foreground"
                    }`}
                    aria-hidden="true"
                  >
                    {isFlagged ? <AlertTriangle className="h-3.5 w-3.5" /> : step.step_number || i + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex gap-2 items-start" role="form" aria-label={`${locale === "fi" ? "Muokkaa vaihetta" : "Edit step"} ${i + 1}`}>
                        <Label htmlFor={`edit-step-${i}`} className="sr-only">{locale === "fi" ? "Vaiheen kuvaus" : "Step description"}</Label>
                        <Input
                          id={`edit-step-${i}`}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="flex-1 text-sm"
                          autoFocus
                          onKeyDown={e => e.key === "Enter" && handleSaveStep(i)}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleSaveStep(i)} aria-label={locale === "fi" ? "Tallenna" : "Save"}>
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingIdx(null)} aria-label={locale === "fi" ? "Peruuta" : "Cancel"}>
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            className={`text-sm leading-relaxed text-left rounded-md px-2 py-1 -mx-2 -my-1 transition-colors hover:bg-muted/50 flex-1 ${
                              isFlagged ? "text-destructive/80" : "text-foreground"
                            } ${isEditable ? "cursor-pointer" : "cursor-default"}`}
                            onClick={() => {
                              if (isEditable) {
                                setEditingIdx(i);
                                setEditText(step.description);
                              }
                            }}
                            aria-label={isEditable ? `${step.description} — ${locale === "fi" ? "klikkaa muokataksesi" : "click to edit"}` : step.description}
                            tabIndex={isEditable ? 0 : -1}
                          >
                            {step.description}
                          </button>

                          {isEditable && (
                            <div className="flex items-center gap-0.5 shrink-0" role="group" aria-label={locale === "fi" ? "Vaiheen toiminnot" : "Step actions"}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 text-xs gap-1 ${isFlagged ? "text-destructive bg-destructive/10" : "text-muted-foreground"}`}
                                onClick={() => toggleFlag(i)}
                                aria-pressed={isFlagged}
                                aria-label={`${t("steps.fix")} ${locale === "fi" ? "vaihe" : "step"} ${i + 1}`}
                              >
                                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                {t("steps.fix")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteStep(i)}
                                aria-label={`${locale === "fi" ? "Poista vaihe" : "Delete step"} ${i + 1}`}
                              >
                                <X className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {isFlagged && (
                          <div className="mt-2 space-y-2">
                            <Label htmlFor={`flag-comment-${i}`} className="sr-only">{t("steps.flagPlaceholder")}</Label>
                            <Textarea
                              id={`flag-comment-${i}`}
                              placeholder={t("steps.flagPlaceholder")}
                              value={flagComments[i] || ""}
                              onChange={e => setFlagComments(prev => ({ ...prev, [i]: e.target.value }))}
                              rows={2}
                              className="text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={handleRegenerateFlagged}
                              disabled={regenerating}
                              className="gap-1.5 text-xs"
                              aria-busy={regenerating}
                            >
                              {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                              {t("steps.regenerateBtn")}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Add step */}
          {isEditable && (
            <div className="mt-4 pt-4 border-t">
              {showAddStep ? (
                <div className="flex gap-2 items-start" role="form" aria-label={locale === "fi" ? "Lisää uusi vaihe" : "Add new step"}>
                  <Label htmlFor="new-step-input" className="sr-only">{locale === "fi" ? "Uuden vaiheen kuvaus" : "New step description"}</Label>
                  <Input
                    id="new-step-input"
                    placeholder={t("steps.addPlaceholder")}
                    value={newStepText}
                    onChange={e => setNewStepText(e.target.value)}
                    className="flex-1 text-sm"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleAddStep()}
                  />
                  <Button size="sm" onClick={handleAddStep} disabled={!newStepText.trim()} aria-label={locale === "fi" ? "Vahvista uusi vaihe" : "Confirm new step"}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAddStep(false); setNewStepText(""); }} aria-label={locale === "fi" ? "Peruuta" : "Cancel"}>
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setShowAddStep(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t("steps.addStep")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
