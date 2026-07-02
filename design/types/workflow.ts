export type StageId =
  | "intake"
  | "whitespace"
  | "definition"
  | "prototype"
  | "gtm"
  | "tracking"
  | "overview";

export type ProjectType = "software" | "physical";

export interface WorkflowProject {
  id: string;
  name: string;
  type: ProjectType;
  stage: StageId;
  status: "in_progress" | "awaiting_approval" | "completed";
  updatedAt: string;
}

export interface IntakeBrief {
  ideaName: string;
  ideaSummary: string;
  problem: string;
  targetUser: string;
  productType: ProjectType;
  competitors: string;
  category: string;
  budget: string;
  timeline: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  quote: string;
  goals: string[];
  pains: string[];
  scenario: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
}

export interface TrackingMetric {
  date: string;
  dau: number;
  mau: number;
  retention: number;
  nps: number;
  csat: number;
  churn: number;
  revenue: number;
  conversion: number;
}

export interface WorkflowState {
  brief: IntakeBrief;
  brandBriefApproved: boolean;
  definitionApproved: boolean;
  personas: Persona[];
  features: Feature[];
  metrics: TrackingMetric[];
  feedbackSent: boolean;
}
