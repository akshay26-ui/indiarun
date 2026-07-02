"use client";

import Link from "next/link";
import { ArrowUpRight, BarChart3, Boxes, Check, Compass, Download, FileStack, Rocket, Share2, Sparkles } from "lucide-react";
import { downloadText } from "../lib/workflow";
import { PageHeader, WorkflowShell } from "../layouts/WorkflowShell";
import { ProgressStrip } from "../components/workflow/ProgressStrip";
import { Alert, Button, GlassCard } from "../components/ui/WorkflowUI";

const artifacts = [
  { stage: "Discovery", title: "Brand Brief", detail: "A defensible wedge backed by 12 source-linked market signals.", icon: Compass, href: "whitespace", meta: "Approved · v1" },
  { stage: "Definition", title: "Personas & PRD", detail: "Two focused personas, four ranked features and a complete product contract.", icon: FileStack, href: "definition", meta: "Approved · v1" },
  { stage: "Prototype", title: "Interactive preview", detail: "Three working flows covering evidence review and human approval.", icon: Boxes, href: "prototype", meta: "Build 04 · ready" },
  { stage: "Launch", title: "GTM & economics", detail: "Founder-led cohort motion with a projected 7.8× LTV:CAC ratio.", icon: Rocket, href: "gtm", meta: "Draft saved" },
  { stage: "Measure", title: "Tracking dashboard", detail: "Five observations and one actionable retention insight.", icon: BarChart3, href: "tracking", meta: "Updated 01 Jul" },
];

export default function OverviewPage({ projectId = "pulse" }: { projectId?: string }) {
  const exportSummary = () => downloadText("pulse-product-case.txt", `PULSE — PRODUCT CASE

Thesis: Own the decision layer between scattered research and roadmap commitment.
Primary user: Independent product leads and early-stage founders.
Positioning: The evidence-first decision workspace for lean teams.
First product bet: Source-linked evidence workspace with visible human approvals.
GTM: 30-company founder-led design partner cohort.
Current signal: MAU +51%; retention down 11 points after week three.
Next learning: Improve repeat-decision value and onboarding.`);

  return (
    <WorkflowShell stage="overview" projectId={projectId}>
      <PageHeader
        step="Product overview · Pitch-ready"
        title="One product case. Every decision attached."
        description="Pulse moved from a raw idea to a measurable launch thesis without losing the evidence, assumptions or approvals that shaped it."
        actions={<><Button variant="secondary" icon={<Share2 size={14} />}>Copy share link</Button><Button icon={<Download size={14} />} onClick={exportSummary}>Export complete case</Button></>}
      />
      <ProgressStrip stage="overview" />

      <GlassCard className="relative overflow-hidden p-6 sm:p-10">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#4F46E5]/20 blur-[100px]" />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#63e6be]/20 bg-[#63e6be]/[0.06] px-3 text-xs font-semibold text-[#63e6be]"><Check size={13} /> Full workflow complete</span>
            <h2 className="mt-6 max-w-[700px] font-['Plus_Jakarta_Sans'] text-[clamp(2rem,4vw,3.7rem)] font-bold leading-[1.06] tracking-[-0.055em]">
              Product strategy for teams that need confidence before scale.
            </h2>
            <p className="mt-5 max-w-[680px] text-base leading-7 text-white/55">Pulse creates a traceable decision layer between product research and roadmap commitment—so lean teams move faster without confusing generated certainty for real evidence.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["12", "Verified sources"], ["82", "Wedge confidence"], ["04", "Prioritized features"], ["7.8×", "Projected LTV:CAC"]].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                <strong className="font-['JetBrains_Mono'] text-2xl tracking-[-0.04em] text-[#b5b9ff]">{value}</strong>
                <span className="mt-2 block text-[10px] leading-4 text-white/30">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {artifacts.map((artifact, index) => {
            const Icon = artifact.icon;
            return (
              <Link key={artifact.title} href={`/project/${projectId}/${artifact.href}`} className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]">
                <GlassCard className="flex flex-col gap-5 p-5 transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[#818CF8]/30 sm:flex-row sm:items-center">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#4F46E5]/12 text-[#9ca3ff]"><Icon size={19} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-white/25">{String(index + 1).padStart(2, "0")} · {artifact.stage}</span><span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-white/35">{artifact.meta}</span></div>
                    <h3 className="mt-1.5 font-['Plus_Jakarta_Sans'] text-lg font-semibold">{artifact.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-white/38">{artifact.detail}</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-white/30 transition group-hover:border-[#818CF8]/40 group-hover:bg-[#4F46E5] group-hover:text-white"><ArrowUpRight size={15} /></span>
                </GlassCard>
              </Link>
            );
          })}
        </div>

        <div className="space-y-5">
          <GlassCard className="border-[#ff3366]/20 bg-[#ff3366]/[0.035]">
            <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.13em] text-[#ff8cab]">Live learning</span>
            <h3 className="mt-3 font-['Plus_Jakarta_Sans'] text-xl font-semibold">Growth is ahead of retention.</h3>
            <p className="mt-3 text-sm leading-6 text-white/45">MAU is rising, but retention fell 11 points after week three. This observation is now queued as a new Discovery pain point.</p>
            <Link href={`/project/${projectId}/tracking`} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl text-xs font-semibold text-[#ff9ab4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]">Inspect the signal <ArrowUpRight size={13} /></Link>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#4F46E5] text-white"><Sparkles size={16} /></span>
              <div><h3 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold">Product memory</h3><p className="text-[11px] text-white/35">Everything stays navigable</p></div>
            </div>
            <div className="mt-6 space-y-4">
              {["2 explicit approvals", "12 linked sources", "5 versioned artifacts", "1 closed feedback loop"].map((item) => <div key={item} className="flex items-center gap-3 text-xs text-white/50"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#63e6be]/10 text-[#63e6be]"><Check size={11} /></span>{item}</div>)}
            </div>
          </GlassCard>

          <Alert title="AI-synthesized, human-approved">Research synthesis and recommendations are generated. Strategic approvals, effort estimates and launch commitments remain yours.</Alert>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center">
        <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-[#818CF8]">Next cycle</span>
        <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-2xl font-semibold tracking-[-0.03em]">Turn the retention signal into a sharper product.</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">Re-run Discovery with observed behavior while preserving the approved Brand Brief as version one.</p>
        <Link href={`/project/${projectId}/whitespace`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-[#5b52ed] to-[#4F46E5] px-[18px] text-sm font-semibold text-white shadow-[0_12px_36px_rgba(79,70,229,0.3)] transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030508]"><Compass size={15} />Start a versioned Discovery pass</Link>
      </div>
    </WorkflowShell>
  );
}
