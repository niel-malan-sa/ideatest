import { useEffect, useRef, useCallback } from "react";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import type { StepKey } from "@/components/IdeaStepper";

type TourId = "framework_ready" | "data_collection" | "analyzed";

const TOUR_SEEN_PREFIX = "tour-seen-";

function tourKey(tourId: string, userId?: string) {
  return TOUR_SEEN_PREFIX + tourId + (userId ? `-${userId}` : "");
}

interface UseGuidedTourOptions {
  activeStep: StepKey;
  ready: boolean;
  frameworkSubStep?: number;
  setFrameworkSubStep?: (step: number) => void;
}

export function useGuidedTour({
  activeStep,
  ready,
  frameworkSubStep = 0,
  setFrameworkSubStep,
}: UseGuidedTourOptions) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const tourRef = useRef<any>(null);
  // Track which chapters have had their auto-tour triggered this session
  const autoTriggered = useRef<Set<string>>(new Set());

  const startTour = useCallback((force = false) => {
    const tourId = activeStep as TourId;
    if (!["framework_ready", "data_collection", "analyzed"].includes(tourId)) return;

    // If not forced (manual), check if already seen
    if (!force) {
      const seen = localStorage.getItem(tourKey(tourId, user?.id));
      if (seen) return;
    }

    // Cleanup previous tour
    if (tourRef.current) {
      tourRef.current.complete();
      tourRef.current = null;
    }

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: "shepherd-theme-custom",
        scrollTo: { behavior: "smooth", block: "center" } as any,
        cancelIcon: { enabled: true },
      },
    });

    const nextLabel = t("tour.next");
    const backLabel = t("tour.back");
    const doneLabel = t("tour.done");

    if (tourId === "framework_ready") {
      // Navigate to sub-step 0 before starting
      setFrameworkSubStep?.(0);

      tour.addStep({
        id: "fw-intro",
        text: t("tour.fw.intro"),
        buttons: [{ text: nextLabel, action: () => tour.next() }],
      } as any);

      tour.addStep({
        id: "fw-jobmap",
        text: t("tour.fw.jobmap"),
        attachTo: { element: "[data-tour='jobmap-card']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => { setFrameworkSubStep?.(1); setTimeout(() => tour.next(), 300); } },
        ],
      } as any);

      tour.addStep({
        id: "fw-outcomes",
        text: t("tour.fw.outcomes"),
        attachTo: { element: "[data-tour='outcomes-card']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => { setFrameworkSubStep?.(0); setTimeout(() => tour.back(), 300); }, classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => { setFrameworkSubStep?.(2); setTimeout(() => tour.next(), 300); } },
        ],
      } as any);

      tour.addStep({
        id: "fw-interview",
        text: t("tour.fw.interview"),
        attachTo: { element: "[data-tour='interview-card']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => { setFrameworkSubStep?.(1); setTimeout(() => tour.back(), 300); }, classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);

      tour.addStep({
        id: "fw-navigation",
        text: t("tour.fw.navigation"),
        buttons: [
          { text: backLabel, action: () => { setFrameworkSubStep?.(2); setTimeout(() => tour.back(), 300); }, classes: "shepherd-button-secondary" },
          { text: doneLabel, action: () => { tour.complete(); setFrameworkSubStep?.(0); } },
        ],
      } as any);
    } else if (tourId === "data_collection") {
      tour.addStep({
        id: "dc-intro",
        text: t("tour.dc.intro"),
        buttons: [{ text: nextLabel, action: () => tour.next() }],
      } as any);
      tour.addStep({
        id: "dc-databank",
        text: t("tour.dc.databank"),
        attachTo: { element: "[data-tour='dc-databank']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "dc-respondents",
        text: t("tour.dc.respondents"),
        attachTo: { element: "[data-tour='dc-respondents']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "dc-scoring",
        text: t("tour.dc.scoring"),
        attachTo: { element: "[data-tour='scoring-section']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "dc-import",
        text: t("tour.dc.import"),
        attachTo: { element: "[data-tour='dc-import']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "dc-market",
        text: t("tour.dc.market"),
        attachTo: { element: "[data-tour='dc-market']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "dc-complete",
        text: t("tour.dc.complete"),
        attachTo: { element: "[data-tour='dc-complete']", on: "top" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: doneLabel, action: () => tour.complete() },
        ],
      } as any);
    } else if (tourId === "analyzed") {
      tour.addStep({
        id: "an-intro",
        text: t("tour.an.intro"),
        buttons: [{ text: nextLabel, action: () => tour.next() }],
      } as any);
      tour.addStep({
        id: "an-summary",
        text: t("tour.an.summary"),
        attachTo: { element: "[data-tour='an-summary']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "an-unmet",
        text: t("tour.an.unmet"),
        attachTo: { element: "[data-tour='an-unmet-table']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "an-gonogo",
        text: t("tour.an.gonogo"),
        attachTo: { element: "[data-tour='an-gonogo']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "an-charts",
        text: t("tour.an.charts"),
        attachTo: { element: "[data-tour='an-charts']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "an-recommendations",
        text: t("tour.an.recommendations"),
        attachTo: { element: "[data-tour='an-recommendations']", on: "bottom" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "an-positioning",
        text: t("tour.an.positioning"),
        attachTo: { element: "[data-tour='an-positioning']", on: "top" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: nextLabel, action: () => tour.next() },
        ],
      } as any);
      tour.addStep({
        id: "an-sales",
        text: t("tour.an.sales"),
        attachTo: { element: "[data-tour='an-sales']", on: "top" },
        buttons: [
          { text: backLabel, action: () => tour.back(), classes: "shepherd-button-secondary" },
          { text: doneLabel, action: () => tour.complete() },
        ],
      } as any);
    }

    tour.on("complete", () => {
      localStorage.setItem(tourKey(tourId, user?.id), "1");
    });
    tour.on("cancel", () => {
      localStorage.setItem(tourKey(tourId, user?.id), "1");
      // If cancelled mid-framework tour, return to page 1
      if (tourId === "framework_ready") setFrameworkSubStep?.(0);
    });

    tourRef.current = tour;
    setTimeout(() => tour.start(), 400);
  }, [activeStep, t, setFrameworkSubStep, user?.id]);

  // Auto-start on first visit to this chapter
  useEffect(() => {
    if (!ready) return;
    const tourId = activeStep as TourId;
    if (!["framework_ready", "data_collection", "analyzed"].includes(tourId)) return;
    if (autoTriggered.current.has(tourId)) return;

    const seen = localStorage.getItem(tourKey(tourId, user?.id));
    if (!seen) {
      autoTriggered.current.add(tourId);
      const timer = setTimeout(() => startTour(false), 800);
      return () => clearTimeout(timer);
    }
  }, [activeStep, ready, startTour]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.complete();
      }
    };
  }, []);

  // Manual trigger always forces
  const manualStartTour = useCallback(() => startTour(true), [startTour]);

  return { startTour: manualStartTour };
}
