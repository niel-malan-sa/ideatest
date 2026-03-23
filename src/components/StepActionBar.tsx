import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepActionBarProps {
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  className?: string;
  subStepIndicator?: string;
}

export default function StepActionBar({
  onNext,
  onBack,
  nextLabel,
  backLabel,
  nextDisabled = false,
  nextLoading = false,
  className,
  subStepIndicator,
}: StepActionBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-4 mt-6 border-t bg-background/80 backdrop-blur-md px-4 py-3",
        className
      )}
    >
      {subStepIndicator && (
        <p className="text-sm font-medium text-muted-foreground text-center mb-2">{subStepIndicator}</p>
      )}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {backLabel || "Back"}
          </Button>
        ) : (
          <div />
        )}
        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled || nextLoading} className="gap-2">
            {nextLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {nextLabel || "Next"}
            {!nextLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
