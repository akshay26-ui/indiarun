"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  Gauge,
  Lightbulb,
  RefreshCw,
  ShieldAlert,
  Target,
  Users,
} from "lucide-react";
import { REASONING_STEPS } from "../constants/workflow";
import { useWorkflowState } from "../hooks/useWorkflowState";
import { ActionBar, PageHeader, WorkflowShell } from "../layouts/WorkflowShell";
import { ProgressStrip } from "../components/workflow/ProgressStrip";
import { ReasoningLog } from "../components/workflow/ReasoningLog";
import { Alert, Button, GlassCard, LoadingState, Modal } from "../components/ui/WorkflowUI";

const tiers = [
  { label: "Free–₹1.5k", count: 16, height: "h-[88%]" },
  { label: "₹1.5k–4k", count: 12, height: "h-[66%]" },
  { label: "₹4k–8k", count: 4, height: "h-[28%]", recommended: true },
  { label: "₹8k+", count: 9, height: "h-1/2" },
];

function Citation({ children, href = "https://www.g2.com" }: { children: string; href?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg text-[11px] font-semibold text-[#9ca3ff] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]">
      <BookOpen size={11} />
      {children}
      <ExternalLink size={9} />
    </a>
  );
}

export default function WhitespacePage({ projectId = "pulse" }: { projectId?: string }) {
  const router = useRouter();
  const { state, update, hydrated } = useWorkflowState();
  const [analyzing, setAnalyzing] = useState(true);
  const [angleOpen, setAngleOpen] = useState(false);
  const [approved, setApproved] = useState(state.brandBriefApproved);
  const [angle, setAngle] = useState("Prioritize smaller teams with low research maturity.");

  useEffect(() => {
    const timer = window.setTimeout(() => setAnalyzing(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const approve = () => {
    setApproved(true);
    update({ brandBriefApproved: true });
  };

  return (
    <WorkflowShell stage="whitespace" projectId={projectId}>
      <PageHeader
        step="Stage 02 · Discovery"
        title="There is a gap. It is narrower than the idea."
        description="Aura compared category density, buyer motivation and failure precedents. Every strategic claim below remains linked to its evidence."
        actions={<span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#63e6be]/20 bg-[#63e6be]/[0.06] px-3 text-xs font-semibold text-[#63e6be]"><Check size={13} /> 12 sources verified</span>}
      />
      <ProgressStrip stage="whitespace" />

      {!hydrated || analyzing ? (
        <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
          <ReasoningLog steps={REASONING_STEPS.slice(0, 3)} running title="ValueForge is mapping the category" />
          <LoadingState label="Synthesizing source-backed whitespace" />
        </div>
      ) : (
        <>
          <ReasoningLog steps={REASONING_STEPS} title="ValueForge reasoning trail" />

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <GlassCard className="lg:col-span-2">
              <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-start">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#4F46E5] text-white shadow-[0_0_30px_rgba(79,70,229,.28)]"><Lightbulb size={19} /></span>
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-[#818CF8]">Recommended wedge</span>
                  <h2 className="mt-2 max-w-[760px] font-['Plus_Jakarta_Sans'] text-[clamp(1.45rem,3vw,2.3rem)] font-semibold leading-tight tracking-[-0.035em]">
                    Own the decision layer between scattered research and roadmap commitment.
                  </h2>
                  <p className="mt-4 max-w-[820px] text-sm leading-6 text-white/55">
                    Existing suites optimize repositories or roadmaps. The underserved job is helping lean teams turn uncertain evidence into a traceable, explicitly approved product direction.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3"><Citation>G2 category review, 2026</Citation><Citation href="https://trends.google.com">Google Trends cluster</Citation></div>
                </div>
                <div className="rounded-2xl border border-[#818CF8]/20 bg-[#4F46E5]/10 p-4 text-center">
                  <span className="block font-['JetBrains_Mono'] text-3xl font-semibold text-[#aeb3ff]">82</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-wider text-white/35">Confidence</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.13em] text-white/30">Price-tier saturation</span>
                  <h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-xl font-semibold">The middle is under-served</h2>
                </div>
                <Gauge size={19} className="text-[#818CF8]" />
              </div>
              <div className="mt-7 flex h-[180px] items-end gap-3 border-b border-white/10 pb-7">
                {tiers.map((tier) => (
                  <div key={tier.label} className="flex h-full flex-1 flex-col justify-end">
                    <span className={`mb-2 text-center font-['JetBrains_Mono'] text-xs ${tier.recommended ? "text-[#aeb3ff]" : "text-white/35"}`}>{tier.count}</span>
                    <div className={`relative w-full rounded-t-xl ${tier.height} ${tier.recommended ? "bg-gradient-to-t from-[#4F46E5] to-[#818CF8] shadow-[0_0_30px_rgba(79,70,229,.25)]" : "bg-white/[0.08]"}`}>
                      {tier.recommended && <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-[#4F46E5]/20 px-2 py-1 text-[8px] font-bold uppercase text-[#b5b9ff]">Gap</span>}
                    </div>
                    <span className="absolute" />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {tiers.map((tier) => <span key={tier.label} className={`text-center text-[9px] ${tier.recommended ? "font-semibold text-[#aeb3ff]" : "text-white/25"}`}>{tier.label}</span>)}
              </div>
              <div className="mt-5"><Citation>41 public pricing pages</Citation></div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.13em] text-white/30">Psychographic target</span>
                  <h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-xl font-semibold">The evidence-seeking operator</h2>
                </div>
                <Target size={19} className="text-[#818CF8]" />
              </div>
              <p className="mt-5 text-sm leading-6 text-white/55">They are not looking for more AI output. They want faster confidence, control over assumptions, and a way to defend a decision later.</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[["2.4×", "Evidence"], ["68%", "Control"], ["54%", "Speed"]].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <span className="font-['JetBrains_Mono'] text-lg font-semibold text-white/80">{value}</span>
                    <span className="mt-1 block text-[10px] text-white/30">{label} signal</span>
                  </div>
                ))}
              </div>
              <div className="mt-5"><Citation>1,240 review statements</Citation></div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.13em] text-white/30">Failure simulation</span>
                  <h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-xl font-semibold">Two patterns to design out</h2>
                </div>
                <ShieldAlert size={19} className="text-[#ff8cab]" />
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Google Glass", "Technology-led story before a trusted user job", "Lead with the decision moment, not agent autonomy."],
                  ["Quibi", "High production before behavioral validation", "Test the approval loop before broad generation."],
                ].map(([name, reason, mitigation]) => (
                  <div key={name} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm">{name}</strong>
                      <span className="rounded-full bg-[#ff3366]/10 px-2 py-1 text-[9px] font-semibold uppercase text-[#ff8cab]">Relevant</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/42">{reason}</p>
                    <p className="mt-2 text-xs leading-5 text-[#b7bbff]">Mitigation: {mitigation}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5"><Citation href="https://hbr.org">Historical case archive</Citation></div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.13em] text-white/30">Recommended attributes</span>
                  <h2 className="mt-2 font-['Plus_Jakarta_Sans'] text-xl font-semibold">What the product must signal</h2>
                </div>
                <Users size={19} className="text-[#818CF8]" />
              </div>
              <ul className="mt-5 space-y-3">
                {[
                  ["Source-linked by default", "Evidence stays attached to the decision it supports."],
                  ["Human approval is visible", "The system recommends; the operator commits."],
                  ["One continuous artifact trail", "No copying context from research into planning."],
                  ["Honest uncertainty", "Insufficient data appears as a state, never a guess."],
                ].map(([title, detail]) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#63e6be]/10 text-[#63e6be]"><Check size={11} /></span>
                    <span><strong className="block text-[13px] text-white/75">{title}</strong><span className="mt-1 block text-xs leading-5 text-white/38">{detail}</span></span>
                  </li>
                ))}
              </ul>
              <div className="mt-5"><Citation>Cross-source synthesis</Citation></div>
            </GlassCard>
          </div>

          {approved && <div className="mt-5"><Alert tone="success" title="Brand Brief approved">This version is locked as the source for personas, priorities and the PRD. You can still return here without losing it.</Alert></div>}

          <ActionBar
            note={approved ? "Approved by you · strategic checkpoint complete" : "Your approval is required before Definition can begin."}
            secondary={<Button variant="secondary" onClick={() => setAngleOpen(true)} icon={<RefreshCw size={15} />}>Request a different angle</Button>}
            primary={approved
              ? <Button onClick={() => router.push(`/project/${projectId}/definition`)} icon={<ArrowRight size={15} />}>Continue to Definition</Button>
              : <Button onClick={approve} icon={<Check size={15} />}>Approve this Brand Brief</Button>}
          />
        </>
      )}

      <Modal open={angleOpen} onClose={() => setAngleOpen(false)} title="Reframe the search" description="Tell ValueForge what to challenge. Existing sources stay cached; this creates a new version rather than overwriting your brief.">
        <label className="block text-[13px] font-semibold text-white/60">What should the next pass emphasize?</label>
        <textarea value={angle} onChange={(event) => setAngle(event.target.value)} className="mt-2 min-h-[120px] w-full resize-y rounded-[14px] border border-white/10 bg-white/[0.045] p-3.5 text-sm leading-relaxed outline-none focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15" />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAngleOpen(false)}>Keep current brief</Button>
          <Button onClick={() => { setAngleOpen(false); setAnalyzing(true); window.setTimeout(() => setAnalyzing(false), 900); }} icon={<RefreshCw size={15} />}>Run a new angle</Button>
        </div>
      </Modal>
    </WorkflowShell>
  );
}
