import {
  BarChart3,
  Boxes,
  Compass,
  FileStack,
  FlaskConical,
  LayoutDashboard,
  Rocket,
  Sparkles,
} from "lucide-react";
import type { Feature, Persona, StageId, TrackingMetric, WorkflowProject } from "../types/workflow";

export const STAGES: Array<{
  id: StageId;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Compass;
}> = [
  { id: "intake", label: "Idea intake", shortLabel: "Intake", description: "Shape the raw idea", icon: Sparkles },
  { id: "whitespace", label: "Whitespace", shortLabel: "Discover", description: "Validate the market gap", icon: Compass },
  { id: "definition", label: "Definition", shortLabel: "Define", description: "Personas, priorities and PRD", icon: FileStack },
  { id: "prototype", label: "Prototype", shortLabel: "Prototype", description: "Build the first experience", icon: Boxes },
  { id: "gtm", label: "Go-to-market", shortLabel: "Launch", description: "Plan motion and economics", icon: Rocket },
  { id: "tracking", label: "Tracking", shortLabel: "Measure", description: "Learn from live signals", icon: BarChart3 },
  { id: "overview", label: "Overview", shortLabel: "Overview", description: "Review the complete case", icon: LayoutDashboard },
];

export const DEMO_PROJECTS: WorkflowProject[] = [
  {
    id: "pulse",
    name: "Pulse",
    type: "software",
    stage: "definition",
    status: "awaiting_approval",
    updatedAt: "Today, 10:42",
  },
  {
    id: "mori",
    name: "Mori functional snacks",
    type: "physical",
    stage: "tracking",
    status: "in_progress",
    updatedAt: "Yesterday, 18:20",
  },
  {
    id: "kinetic",
    name: "Kinetic workspace",
    type: "software",
    stage: "overview",
    status: "completed",
    updatedAt: "28 Jun, 16:05",
  },
];

export const DEMO_PERSONAS: Persona[] = [
  {
    id: "priya",
    name: "Priya Mehta",
    role: "Independent product lead · 31",
    quote: "I need a clear signal before I commit another sprint.",
    goals: ["Validate direction quickly", "Keep decisions traceable"],
    pains: ["Research is fragmented", "Stakeholder alignment arrives too late"],
    scenario: "Priya is shaping a new B2B workflow product with a small team and needs an evidence-backed brief before roadmap review.",
  },
  {
    id: "arjun",
    name: "Arjun Rao",
    role: "Early-stage founder · 26",
    quote: "I can build it. I need to know whether it deserves to exist.",
    goals: ["Find a defensible wedge", "Leave with a pitch-ready plan"],
    pains: ["Weak access to research", "Feature scope expands too quickly"],
    scenario: "Arjun uses the product to translate an early concept into a focused prototype and a measurable launch plan.",
  },
];

export const DEMO_FEATURES: Feature[] = [
  { id: "f1", title: "Evidence workspace", description: "Source-linked market findings in one decision surface.", reach: 880, impact: 3, confidence: 0.9, effort: 4 },
  { id: "f2", title: "Guided brief", description: "Conversational intake that structures missing context.", reach: 920, impact: 2.5, confidence: 0.88, effort: 3 },
  { id: "f3", title: "Decision checkpoints", description: "Explicit approval before strategic choices become inputs.", reach: 760, impact: 3, confidence: 0.92, effort: 5 },
  { id: "f4", title: "Launch pack export", description: "A coherent artifact for mentors and stakeholders.", reach: 630, impact: 2, confidence: 0.8, effort: 3 },
];

export const DEMO_METRICS: TrackingMetric[] = [
  { date: "03 Jun", dau: 118, mau: 410, retention: 48, nps: 38, csat: 82, churn: 4.2, revenue: 8200, conversion: 12 },
  { date: "10 Jun", dau: 146, mau: 465, retention: 52, nps: 42, csat: 84, churn: 3.8, revenue: 9600, conversion: 14 },
  { date: "17 Jun", dau: 172, mau: 522, retention: 54, nps: 45, csat: 86, churn: 3.4, revenue: 11400, conversion: 17 },
  { date: "24 Jun", dau: 181, mau: 568, retention: 46, nps: 39, csat: 79, churn: 5.1, revenue: 12100, conversion: 15 },
  { date: "01 Jul", dau: 205, mau: 620, retention: 43, nps: 36, csat: 77, churn: 5.8, revenue: 13800, conversion: 14 },
];

export const REASONING_STEPS = [
  { title: "Mapped category", detail: "Reviewed 34 adjacent tools across research, planning and prototyping.", duration: "08s" },
  { title: "Clustered price tiers", detail: "Compared freemium, team and specialist offers across 18 public pricing pages.", duration: "12s" },
  { title: "Read demand signals", detail: "Grouped 1,240 review statements around speed, confidence, evidence and control.", duration: "16s" },
  { title: "Matched failure patterns", detail: "Tested the concept against historical products that over-automated strategic decisions.", duration: "09s" },
  { title: "Synthesized the wedge", detail: "Prioritized a transparent decision workspace for lean product teams.", duration: "05s" },
];

export const PRODUCT_TYPE_META = {
  software: { label: "Software product", icon: FlaskConical },
  physical: { label: "Physical product", icon: Boxes },
};
