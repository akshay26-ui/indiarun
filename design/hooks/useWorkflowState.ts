"use client";

import { useEffect, useState } from "react";
import { DEMO_FEATURES, DEMO_METRICS, DEMO_PERSONAS } from "../constants/workflow";
import type { WorkflowState } from "../types/workflow";

const STORAGE_KEY = "aura-workflow-v1";

const initialState: WorkflowState = {
  brief: {
    ideaName: "Pulse",
    ideaSummary: "An evidence-first product strategy workspace for lean teams.",
    problem: "Small product teams make expensive roadmap decisions from fragmented research and untested assumptions.",
    targetUser: "Independent product leads and early-stage founders shipping with teams of 2–10.",
    productType: "software",
    competitors: "Productboard, Dovetail, Notion",
    category: "Product strategy software",
    budget: "₹8–12 lakh initial build",
    timeline: "12 weeks to private beta",
  },
  brandBriefApproved: false,
  definitionApproved: false,
  personas: DEMO_PERSONAS,
  features: DEMO_FEATURES,
  metrics: DEMO_METRICS,
  feedbackSent: false,
};

export function useWorkflowState() {
  const [state, setState] = useState<WorkflowState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...initialState, ...JSON.parse(saved) });
    } catch {
      // A private browsing quota should not make the workflow unusable.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Persistence is an enhancement; in-memory state remains functional.
    }
  }, [hydrated, state]);

  const update = (patch: Partial<WorkflowState>) =>
    setState((current) => ({ ...current, ...patch }));

  return { state, update, hydrated };
}
