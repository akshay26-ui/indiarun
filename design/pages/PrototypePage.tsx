"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Code2, Download, ExternalLink, LayoutGrid, Play, RefreshCw, Smartphone, Sparkles, TriangleAlert } from "lucide-react";
import { REASONING_STEPS } from "../constants/workflow";
import { useWorkflowState } from "../hooks/useWorkflowState";
import { downloadText } from "../lib/workflow";
import { ActionBar, PageHeader, WorkflowShell } from "../layouts/WorkflowShell";
import { ProgressStrip } from "../components/workflow/ProgressStrip";
import { ReasoningLog } from "../components/workflow/ReasoningLog";
import { Alert, Button, GlassCard, LoadingState } from "../components/ui/WorkflowUI";

function SoftwarePreview() {
  const [screen, setScreen] = useState<"home" | "evidence" | "decision">("home");
  const [saved, setSaved] = useState(false);
  return (
    <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#e9ebf3] text-[#171923] shadow-2xl">
      <div className="flex h-11 items-center justify-between border-b border-black/10 bg-white/60 px-4">
        <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ff6b7a]" /><span className="h-2.5 w-2.5 rounded-full bg-[#f4c95d]" /><span className="h-2.5 w-2.5 rounded-full bg-[#63d59a]" /></div>
        <span className="rounded-lg border border-black/10 bg-white/70 px-12 py-1 font-['JetBrains_Mono'] text-[8px] text-black/35">preview.aura/pulse</span>
        <ExternalLink size={12} className="text-black/25" />
      </div>
      <div className="grid min-h-[440px] grid-cols-[72px_1fr]">
        <aside className="border-r border-black/10 bg-[#151824] p-3 text-white">
          <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-[#4F46E5] text-[10px] font-bold">P</span>
          <div className="mt-8 space-y-2">
            {(["home", "evidence", "decision"] as const).map((item, index) => (
              <button key={item} onClick={() => setScreen(item)} aria-label={`Open ${item}`} className={`grid h-9 w-full place-items-center rounded-xl transition ${screen === item ? "bg-white/10 text-[#aeb3ff]" : "text-white/25 hover:text-white/60"}`}>
                {index === 0 ? <LayoutGrid size={14} /> : index === 1 ? <Sparkles size={14} /> : <CheckCircle2 size={14} />}
              </button>
            ))}
          </div>
        </aside>
        <div className="p-6 sm:p-8">
          {screen === "home" && (
            <>
              <span className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-widest text-[#4F46E5]">Monday · Decision room</span>
              <h3 className="mt-2 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em]">What deserves the next sprint?</h3>
              <p className="mt-2 max-w-md text-xs leading-5 text-black/50">Three evidence clusters are ready to challenge before roadmap review.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[["12", "Sources"], ["03", "Risks"], ["82%", "Confidence"]].map(([value, label]) => <div key={label} className="rounded-2xl border border-black/10 bg-white/65 p-4"><strong className="font-['JetBrains_Mono'] text-lg">{value}</strong><span className="mt-1 block text-[9px] uppercase tracking-wider text-black/35">{label}</span></div>)}
              </div>
              <button onClick={() => setScreen("evidence")} className="mt-7 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4F46E5] px-4 text-xs font-semibold text-white shadow-lg">Review evidence <ArrowRight size={12} /></button>
            </>
          )}
          {screen === "evidence" && (
            <>
              <span className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-widest text-[#4F46E5]">Evidence workspace</span>
              <h3 className="mt-2 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em]">Decision confidence, not more documents.</h3>
              <div className="mt-6 space-y-3">
                {["Operators distrust uncited recommendations", "Mid-tier tools optimize storage, not judgment", "Approval visibility increases stakeholder trust"].map((item, index) => (
                  <button key={item} onClick={() => setScreen(index === 2 ? "decision" : "evidence")} className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white/70 p-4 text-left text-xs font-semibold transition hover:-translate-y-px hover:border-[#4F46E5]/30">
                    <span>{item}</span><span className="font-['JetBrains_Mono'] text-[9px] text-[#4F46E5]">{84 - index * 6}%</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {screen === "decision" && (
            <div className="grid min-h-[320px] place-items-center text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#4F46E5]/10 text-[#4F46E5]"><CheckCircle2 size={24} /></span>
                <h3 className="mt-5 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.04em]">{saved ? "Decision recorded." : "Commit to the evidence workspace?"}</h3>
                <p className="mt-2 text-xs leading-5 text-black/50">{saved ? "The source trail and current confidence are now locked to this decision." : "This becomes the first product bet and the source for sprint scope."}</p>
                <button onClick={() => setSaved(true)} disabled={saved} className="mt-5 h-10 rounded-xl bg-[#4F46E5] px-5 text-xs font-semibold text-white disabled:bg-[#63b99a]">{saved ? "Approved by you" : "Approve product bet"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhysicalPreview() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="relative min-h-[460px] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_38%,rgba(196,181,253,.34),transparent_30%),linear-gradient(150deg,#161a2b,#06080d)]">
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative h-[280px] w-[190px] rotate-[-4deg] rounded-[32px] border border-white/30 bg-[linear-gradient(135deg,rgba(255,255,255,.45),rgba(129,140,248,.22)_38%,rgba(79,70,229,.55))] p-5 shadow-[0_45px_80px_rgba(0,0,0,.55)] backdrop-blur-xl">
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-[-0.05em]">MORI</span>
            <span className="mt-2 block text-[9px] uppercase tracking-[0.2em] text-white/60">calm energy</span>
            <div className="absolute bottom-5 left-5 right-5"><span className="text-4xl">◒</span><span className="mt-2 block text-[10px] text-white/60">Cacao · adaptogens · 12g protein</span></div>
          </div>
        </div>
        <span className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] text-white/50 backdrop-blur-xl">AI concept render · v1</span>
      </div>
      <GlassCard>
        <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-[#818CF8]">Concept specification</span>
        <h3 className="mt-3 font-['Plus_Jakarta_Sans'] text-2xl font-semibold">Mori calm energy bite</h3>
        <dl className="mt-6 space-y-4">
          {[["Format", "45g individually wrapped bar"], ["Primary material", "Matte recyclable mono-film"], ["Palette", "Deep indigo, lavender foil, warm white"], ["Front claim", "Sustained focus without the spike"], ["Positioning", "Premium functional snack for focused work"]].map(([term, value]) => (
            <div key={term} className="border-b border-white/[0.07] pb-4 last:border-0"><dt className="text-[10px] uppercase tracking-wider text-white/25">{term}</dt><dd className="mt-1.5 text-sm text-white/65">{value}</dd></div>
          ))}
        </dl>
      </GlassCard>
    </div>
  );
}

export default function PrototypePage({ projectId = "pulse" }: { projectId?: string }) {
  const router = useRouter();
  const { state } = useWorkflowState();
  const [generating, setGenerating] = useState(true);
  const isPhysical = state.brief.productType === "physical";

  useEffect(() => {
    const timer = window.setTimeout(() => setGenerating(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <WorkflowShell stage="prototype" projectId={projectId}>
      <PageHeader
        step="Stage 04 · Prototype"
        title={isPhysical ? "Make the positioning tangible." : "Make the strategy clickable."}
        description={isPhysical ? "A concept-stage render and structured specification translate the approved attributes into something the team can evaluate." : "The first experience is deliberately narrow: the three highest-priority flows, wired into a working preview."}
        actions={<span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs text-white/50">{isPhysical ? <Sparkles size={13} /> : <Code2 size={13} />} {isPhysical ? "Physical concept" : "Interactive software demo"}</span>}
      />
      <ProgressStrip stage="prototype" />

      <ReasoningLog
        title={isPhysical ? "Concept generation trail" : "Prototype build trail"}
        running={generating}
        steps={isPhysical
          ? REASONING_STEPS.slice(0, 3).map((step, index) => ({ ...step, title: ["Reading recommended attributes", "Composing concept direction", "Drafting specification"][index] }))
          : REASONING_STEPS.slice(0, 4).map((step, index) => ({ ...step, title: ["Reading approved PRD", "Selecting must-have flows", "Scaffolding component states", "Running interaction checks"][index] }))}
      />

      <div className="mt-5">
        {generating ? (
          <LoadingState label={isPhysical ? "Rendering concept and spec sheet" : "Building a clickable preview"} />
        ) : (
          <>
            {isPhysical && <div className="mb-5"><Alert tone="error" title="Concept visualization — not engineering validated">This artifact communicates product direction only. Materials, dimensions, claims and manufacturability require specialist validation before production.</Alert></div>}
            {isPhysical ? <PhysicalPreview /> : <SoftwarePreview />}
            {!isPhysical && (
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  [Play, "3 flows", "Working end to end"],
                  [Smartphone, "Responsive", "Desktop through mobile"],
                  [CheckCircle2, "A11y pass", "Keyboard paths included"],
                ].map(([Icon, value, label]) => (
                  <GlassCard key={value as string} className="flex items-center gap-4 p-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#4F46E5]/12 text-[#9ca3ff]"><Icon size={16} /></span>
                    <span><strong className="block text-sm">{value as string}</strong><span className="block text-[11px] text-white/35">{label as string}</span></span>
                  </GlassCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {!generating && (
        <ActionBar
          note={isPhysical ? "The disclaimer remains attached to every exported concept artifact." : "Only the top four must-have features were scaffolded; lower-priority scope remains in the PRD."}
          secondary={<>
            <Button variant="secondary" onClick={() => { setGenerating(true); window.setTimeout(() => setGenerating(false), 700); }} icon={<RefreshCw size={14} />}>Regenerate</Button>
            <Button variant="secondary" onClick={() => downloadText(isPhysical ? "mori-spec.txt" : "pulse-prototype-readme.txt", isPhysical ? "CONCEPT STAGE — NOT ENGINEERING VALIDATED\n\nMori calm energy bite specification" : "Pulse prototype\nInteractive flows: decision room, evidence workspace, approval checkpoint")} icon={<Download size={14} />}>{isPhysical ? "Download spec" : "Export code"}</Button>
          </>}
          primary={<Button onClick={() => router.push(`/project/${projectId}/gtm`)} icon={<ArrowRight size={15} />}>Continue to GTM</Button>}
        />
      )}
    </WorkflowShell>
  );
}
