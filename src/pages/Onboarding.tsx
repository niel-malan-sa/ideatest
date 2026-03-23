import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Building2, User, Briefcase, Users, Lightbulb } from "lucide-react";


const STEPS = ["welcome", "profile", "context"] as const;
type Step = typeof STEPS[number];

const STEP_LABELS: Record<Step, { fi: string; en: string }> = {
  welcome: { fi: "Tervetuloa", en: "Welcome" },
  profile: { fi: "Profiili", en: "Profile" },
  context: { fi: "Liiketoiminta", en: "Business context" },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, recheckProfile } = useAuth();
  const { locale, t } = useLanguage();
  const [step, setStep] = useState<Step>("welcome");
  const [saving, setSaving] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  const currentIndex = STEPS.indexOf(step);

  // Pre-fill name from auth metadata
  useEffect(() => {
    const metaName = user?.user_metadata?.name || user?.user_metadata?.full_name;
    if (metaName && !name) {
      setName(metaName);
    }
  }, [user]);

  // Announce step changes to screen readers
  useEffect(() => {
    stepRef.current?.focus();
  }, [step]);

  const handleNext = () => {
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    if (!name.trim() && !company.trim()) {
      toast.error(t("onboarding.needNameOrCompany"));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim() || null,
          company: company.trim() || null,
          role: role.trim() || null,
          industry: industry.trim() || null,
          target_audience: targetAudience.trim() || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      await recheckProfile();
      toast.success(t("onboarding.complete"));
      navigate("/", { replace: true });
    } catch {
      toast.error(t("onboarding.saveFailed"));
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-6" role="form" aria-label={locale === "fi" ? "Käyttöönotto" : "Onboarding"}>
        {/* Progress — accessible step indicator */}
        <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label={`${locale === "fi" ? "Vaihe" : "Step"} ${currentIndex + 1} / ${STEPS.length}: ${STEP_LABELS[step][locale]}`}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                i <= currentIndex ? "bg-primary w-10" : "bg-muted w-6"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Live region for step announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {`${locale === "fi" ? "Vaihe" : "Step"} ${currentIndex + 1} / ${STEPS.length}: ${STEP_LABELS[step][locale]}`}
        </div>

        {/* Step: Welcome */}
        {step === "welcome" && (
          <Card ref={stepRef} tabIndex={-1}>
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Lightbulb className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl">{t("onboarding.welcomeTitle")}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {t("onboarding.welcomeDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleNext} className="w-full gap-2">
                {t("onboarding.getStarted")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Profile */}
        {step === "profile" && (
          <Card ref={stepRef} tabIndex={-1}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" aria-hidden="true" />
                {t("onboarding.profileTitle")}
              </CardTitle>
              <CardDescription>{t("onboarding.profileDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset className="space-y-4 border-0 p-0 m-0">
                <legend className="sr-only">{t("onboarding.profileTitle")}</legend>
                <div className="space-y-2">
                  <Label htmlFor="ob-name">{t("auth.fullName")}</Label>
                  <Input
                    id="ob-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("onboarding.namePlaceholder")}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-company" className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("onboarding.company")}
                  </Label>
                  <Input
                    id="ob-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder={t("onboarding.companyPlaceholder")}
                    autoComplete="organization"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-role" className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("onboarding.role")}
                  </Label>
                  <Input
                    id="ob-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder={t("onboarding.rolePlaceholder")}
                    autoComplete="organization-title"
                  />
                </div>
              </fieldset>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="gap-1">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("newIdea.back")}
                </Button>
                <Button onClick={handleNext} className="flex-1 gap-2">
                  {t("onboarding.next")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Context */}
        {step === "context" && (
          <Card ref={stepRef} tabIndex={-1}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                {t("onboarding.contextTitle")}
              </CardTitle>
              <CardDescription>{t("onboarding.contextDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset className="space-y-4 border-0 p-0 m-0">
                <legend className="sr-only">{t("onboarding.contextTitle")}</legend>
                <div className="space-y-2">
                  <Label htmlFor="ob-industry">{t("newIdea.industry")}</Label>
                  <Input
                    id="ob-industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder={t("newIdea.industryPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-audience">{t("newIdea.targetAudience")}</Label>
                  <Textarea
                    id="ob-audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder={t("newIdea.audiencePlaceholder")}
                    rows={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("onboarding.contextHint")}</p>
              </fieldset>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="gap-1">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("newIdea.back")}
                </Button>
                <Button onClick={handleComplete} disabled={saving} className="flex-1 gap-2" aria-busy={saving}>
                  {saving ? t("onboarding.saving") : t("onboarding.finish")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
