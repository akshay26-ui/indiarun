"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, BarChart3, Check, Download, FileSpreadsheet, RefreshCw, Send, TrendingDown, UploadCloud } from "lucide-react";
import { useWorkflowState } from "../hooks/useWorkflowState";
import { downloadText } from "../lib/workflow";
import type { TrackingMetric } from "../types/workflow";
import { ActionBar, PageHeader, WorkflowShell } from "../layouts/WorkflowShell";
import { ProgressStrip } from "../components/workflow/ProgressStrip";
import { Alert, Button, EmptyState, GlassCard } from "../components/ui/WorkflowUI";
import { MiniChart } from "../components/ui/MiniChart";

const requiredHeaders = ["date", "dau", "mau", "retention_rate", "nps_score", "csat_score", "churn_rate", "revenue", "funnel_conversion_rate"];

function parseCsv(text: string): { metrics?: TrackingMetric[]; error?: string } {
  const rows = text.trim().split(/\r?\n/).map((row) => row.split(",").map((cell) => cell.trim()));
  if (rows.length < 2) return { error: "The file needs a header and at least one data row." };
  const missing = requiredHeaders.filter((header) => !rows[0].includes(header));
  if (missing.length) return { error: `Missing columns: ${missing.join(", ")}.` };
  const index = Object.fromEntries(rows[0].map((header, position) => [header, position]));
  const metrics: TrackingMetric[] = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const values = requiredHeaders.slice(1).map((header) => Number(row[index[header]]));
    if (values.some((value) => Number.isNaN(value))) return { error: `Row ${rowIndex + 1}: all metric values must be numeric.` };
    metrics.push({
      date: row[index.date],
      dau: values[0],
      mau: values[1],
      retention: values[2],
      nps: values[3],
      csat: values[4],
      churn: values[5],
      revenue: values[6],
      conversion: values[7],
    });
  }
  return { metrics };
}

export default function TrackingPage({ projectId = "pulse" }: { projectId?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { state, update } = useWorkflowState();
  const [metrics, setMetrics] = useState<TrackingMetric[]>(state.metrics);
  const [showDashboard, setShowDashboard] = useState(true);
  const [uploadError, setUploadError] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(state.feedbackSent);
  const latest = metrics[metrics.length - 1];
  const previous = metrics[metrics.length - 2];
  const retentionDelta = latest && previous ? latest.retention - previous.retention : 0;

  const sampleCsv = `date,dau,mau,retention_rate,nps_score,csat_score,churn_rate,revenue,funnel_conversion_rate
2026-06-03,118,410,48,38,82,4.2,8200,12
2026-06-10,146,465,52,42,84,3.8,9600,14
2026-06-17,172,522,54,45,86,3.4,11400,17
2026-06-24,181,568,46,39,79,5.1,12100,15
2026-07-01,205,620,43,36,77,5.8,13800,14`;

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploadError("");
    const parsed = parseCsv(await file.text());
    if (parsed.error) {
      setUploadError(parsed.error);
      return;
    }
    if (parsed.metrics) {
      setMetrics(parsed.metrics);
      update({ metrics: parsed.metrics });
      setShowDashboard(true);
    }
  };

  const sendFeedback = () => {
    setFeedbackSent(true);
    update({ feedbackSent: true });
  };

  return (
    <WorkflowShell stage="tracking" projectId={projectId}>
      <PageHeader
        step="Stage 06 · Measure"
        title="Close the loop with what actually happened."
        description="Upload post-launch signals, inspect the shifts that matter, and turn observed friction into the next Discovery input."
        actions={<Button variant="secondary" icon={<UploadCloud size={14} />} onClick={() => inputRef.current?.click()}>Upload metrics CSV</Button>}
      />
      <ProgressStrip stage="tracking" />

      <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
      {uploadError && <div className="mb-5"><Alert tone="error" title="The CSV could not be imported">{uploadError} Download the sample to compare the required schema, then try again.</Alert></div>}

      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-2xl border border-white/10 bg-[#030508]/55 p-1" role="tablist">
          <button role="tab" aria-selected={showDashboard} onClick={() => setShowDashboard(true)} className={`min-h-10 rounded-xl px-4 text-xs font-semibold ${showDashboard ? "bg-white/[0.09] text-white/85" : "text-white/40"}`}>Live dashboard</button>
          <button role="tab" aria-selected={!showDashboard} onClick={() => setShowDashboard(false)} className={`min-h-10 rounded-xl px-4 text-xs font-semibold ${!showDashboard ? "bg-white/[0.09] text-white/85" : "text-white/40"}`}>Upload &amp; schema</button>
        </div>
        <span className="hidden text-xs text-white/30 sm:inline">{metrics.length} weekly observations · updated 01 Jul</span>
      </div>

      {!showDashboard ? (
        <EmptyState
          icon={<FileSpreadsheet size={22} />}
          title="Bring in post-launch metrics"
          description="Upload a CSV with date, engagement, satisfaction, churn, revenue and funnel conversion. Existing dates are de-duplicated."
          action={
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <Button onClick={() => inputRef.current?.click()} icon={<UploadCloud size={15} />}>Choose a CSV file</Button>
              <Button variant="secondary" onClick={() => downloadText("aura-tracking-sample.csv", sampleCsv, "text/csv")} icon={<Download size={14} />}>Download sample</Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Monthly active", latest?.mau.toLocaleString("en-IN"), "+9.2%", "up"],
              ["Week-four retention", `${latest?.retention}%`, `${retentionDelta.toFixed(0)} pts`, "down"],
              ["Net promoter score", latest?.nps, "-3 pts", "down"],
              ["Monthly revenue", `₹${latest?.revenue.toLocaleString("en-IN")}`, "+14.0%", "up"],
            ].map(([label, value, delta, direction]) => (
              <GlassCard key={label as string} className="p-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">{label}</span>
                <strong className="mt-3 block font-['JetBrains_Mono'] text-2xl tracking-[-0.04em]">{value}</strong>
                <span className={`mt-2 inline-flex items-center gap-1 text-[11px] ${direction === "up" ? "text-[#63e6be]" : "text-[#ff8cab]"}`}>{direction === "down" && <TrendingDown size={11} />}{delta} vs prior</span>
              </GlassCard>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
            <GlassCard>
              <div className="flex items-start justify-between">
                <div><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">Engagement trend</span><h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-xl font-semibold">Active use is still growing</h2></div>
                <span className="rounded-full bg-[#63e6be]/10 px-2.5 py-1 text-[10px] font-semibold text-[#63e6be]">+73% DAU</span>
              </div>
              <div className="mt-5"><MiniChart values={metrics.map((item) => item.dau)} label="Daily active users rising from 118 to 205" /></div>
              <div className="mt-1 flex justify-between">{metrics.map((item) => <span key={item.date} className="text-[9px] text-white/25">{item.date}</span>)}</div>
            </GlassCard>

            <GlassCard className="border-[#ff3366]/20 bg-[#ff3366]/[0.035]">
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff3366]/10 text-[#ff8cab]"><TrendingDown size={17} /></span>
                <span className="rounded-full border border-[#ff3366]/20 px-2 py-1 text-[9px] font-semibold uppercase text-[#ff8cab]">Needs attention</span>
              </div>
              <h2 className="mt-5 font-['Plus_Jakarta_Sans'] text-xl font-semibold">Retention slipped after week three.</h2>
              <p className="mt-3 text-sm leading-6 text-white/48">Retention fell 11 points while acquisition and revenue grew. The pattern points to onboarding or repeat-decision value, not top-of-funnel demand.</p>
              <div className="my-5 h-px bg-white/[0.08]" />
              {feedbackSent ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#63e6be]"><Check size={14} /> Added to Discovery queue</div>
              ) : (
                <Button className="w-full" variant="danger" onClick={sendFeedback} icon={<Send size={14} />}>Send to Discovery as pain point</Button>
              )}
            </GlassCard>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {[
              ["Retention", metrics.map((item) => item.retention), "#ff8cab", `${latest?.retention}%`],
              ["NPS", metrics.map((item) => item.nps), "#c4b5fd", String(latest?.nps)],
              ["Conversion", metrics.map((item) => item.conversion), "#63e6be", `${latest?.conversion}%`],
            ].map(([label, values, color, current]) => (
              <GlassCard key={label as string} className="p-5">
                <div className="flex items-end justify-between"><span className="text-xs font-semibold text-white/55">{label}</span><strong className="font-['JetBrains_Mono'] text-lg">{current as string}</strong></div>
                <MiniChart values={values as number[]} color={color as string} height={95} label={`${label} trend`} />
              </GlassCard>
            ))}
          </div>
        </>
      )}

      <ActionBar
        note={feedbackSent ? "The retention insight is queued for a versioned Discovery re-run." : "Signals stay observational until you choose to send an insight back to Discovery."}
        secondary={feedbackSent ? <Button variant="secondary" onClick={() => router.push(`/project/${projectId}/whitespace`)} icon={<RefreshCw size={14} />}>Re-run Discovery</Button> : <Button variant="secondary" onClick={() => downloadText("aura-tracking-sample.csv", sampleCsv, "text/csv")} icon={<Download size={14} />}>Sample CSV</Button>}
        primary={<Button onClick={() => router.push(`/project/${projectId}/overview`)} icon={<ArrowRight size={15} />}>Open product overview</Button>}
      />
    </WorkflowShell>
  );
}
