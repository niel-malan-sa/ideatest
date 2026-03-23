import { useLanguage } from "@/i18n/LanguageContext";
import { Sparkles, ClipboardList, BarChart3, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "draft", translationKey: "step.createIdea" as const, icon: FileEdit },
  { key: "framework_ready", translationKey: "step.aiFramework" as const, icon: Sparkles },
  { key: "data_collection", translationKey: "step.researchData" as const, icon: ClipboardList },
  { key: "analyzed", translationKey: "step.analysis" as const, icon: BarChart3 },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

const STATUS_ORDER: StepKey[] = ["draft", "framework_ready", "data_collection", "analyzed"];

function stepIndex(key: StepKey) {
  return STATUS_ORDER.indexOf(key);
}

interface IdeaStepperProps {
  ideaStatus: string;
  activeStep: StepKey;
  onStepClick: (step: StepKey) => void;
}

export default function IdeaStepper({ ideaStatus, activeStep, onStepClick }: IdeaStepperProps) {
  const { t, locale } = useLanguage();
  const currentIdx = stepIndex(ideaStatus as StepKey);

  return (
    <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1" aria-label={locale === "fi" ? "Prosessin vaiheet" : "Process steps"}>
      {STEPS.map((step, i) => {
        const isCompleted = i <= currentIdx;
        const isActive = step.key === activeStep;
        const isClickable = i <= currentIdx;
        const Icon = step.icon;
        const stepLabel = t(step.translationKey);

        return (
          <div key={step.key} className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.key)}
              aria-current={isActive ? "step" : undefined}
              aria-label={`${locale === "fi" ? "Vaihe" : "Step"} ${i + 1}: ${stepLabel}${isCompleted ? (locale === "fi" ? " (valmis)" : " (completed)") : ""}`}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && isCompleted
                  ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                  : isCompleted
                    ? "bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{stepLabel}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4 sm:w-6 rounded-full transition-colors",
                  i < currentIdx ? "bg-primary" : "bg-border"
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

export { STATUS_ORDER, stepIndex };
