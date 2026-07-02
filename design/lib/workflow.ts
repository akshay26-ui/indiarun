import type { Feature, StageId } from "../types/workflow";
import { STAGES } from "../constants/workflow";

export function stageHref(projectId: string, stage: StageId) {
  if (stage === "intake") return "/project/new";
  return `/project/${projectId}/${stage}`;
}

export function stageIndex(stage: StageId) {
  return STAGES.findIndex((item) => item.id === stage);
}

export function riceScore(feature: Feature) {
  if (!feature.effort) return 0;
  return Math.round((feature.reach * feature.impact * feature.confidence) / feature.effort);
}

export function priorityLabel(score: number) {
  if (score >= 500) return "Very high";
  if (score >= 300) return "High";
  if (score >= 150) return "Medium";
  return "Low";
}

export function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
