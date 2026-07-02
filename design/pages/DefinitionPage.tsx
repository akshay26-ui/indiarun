"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Download, FileText, LockKeyhole, Pencil, Sparkles, Users } from "lucide-react";
import { useWorkflowState } from "../hooks/useWorkflowState";
import { downloadText, priorityLabel, riceScore } from "../lib/workflow";
import { ActionBar, PageHeader, WorkflowShell } from "../layouts/WorkflowShell";
import { ProgressStrip } from "../components/workflow/ProgressStrip";
import { Alert, Button, GlassCard } from "../components/ui/WorkflowUI";

type Tab = "personas" | "features" | "prd";

export default function DefinitionPage({ projectId = "pulse" }: { projectId?: string }) {
  const router = useRouter();
  const { state, update } = useWorkflowState();
  const [tab, setTab] = useState<Tab>("personas");
  const [personas, setPersonas] = useState(state.personas);
  const [features, setFeatures] = useState(state.features);
  const [approved, setApproved] = useState(state.definitionApproved);

  const ranked = useMemo(() => [...features].sort((a, b) => riceScore(b) - riceScore(a)), [features]);
  const prdMarkdown = `# Pulse — Product Requirements Document

## Objective
Help lean product teams move from fragmented evidence to a defensible product decision without surrendering strategic control.

## Primary users
${personas.map((persona) => `- **${persona.name}** — ${persona.role}`).join("\n")}

## Core problem
Small product teams make expensive roadmap decisions from fragmented research and untested assumptions.

## Product principles
1. Evidence remains attached to every strategic claim.
2. Aura recommends; a human explicitly approves.
3. Uncertainty is visible instead of hidden behind generated certainty.

## Prioritized scope
${ranked.map((feature, index) => `${index + 1}. **${feature.title}** — ${feature.description} (RICE ${riceScore(feature)})`).join("\n")}

## Success signals
- Time from idea to approved brief under 30 minutes.
- 100% of whitespace claims include a retrievable citation.
- A user can return to any stage without losing decisions.`;

  const approve = () => {
    setApproved(true);
    update({ definitionApproved: true, personas, features });
  };

  return (
    <WorkflowShell stage="definition" projectId={projectId}>
      <PageHeader
        step="Stage 03 · Definition"
        title="Turn the wedge into a product contract."
        description="Meet the people behind the problem, calibrate what earns a place in the first release, then approve the PRD that binds the prototype."
        actions={<span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs text-white/50"><Sparkles size={13} className="text-[#818CF8]" /> Generated from approved brief</span>}
      />
      <ProgressStrip stage="definition" />

      {!state.brandBriefApproved && (
        <div className="mb-5">
          <Alert title="Approval checkpoint preserved">This preview is available for review, but the production workflow should receive an approved Brand Brief before Definition is generated.</Alert>
        </div>
      )}

      <div className="mb-5 flex w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#030508]/55 p-1 backdrop-blur-xl sm:w-fit" role="tablist" aria-label="Definition views">
        {[
          ["personas", "Personas", Users],
          ["features", "Prioritization", Sparkles],
          ["prd", "PRD preview", FileText],
        ].map(([id, label, Icon]) => (
          <button
            key={id as string}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id as Tab)}
            className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] sm:flex-none ${
              tab === id ? "bg-white/[0.09] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]" : "text-white/45 hover:text-white/70"
            }`}
          >
            <Icon size={14} />
            {label as string}
          </button>
        ))}
      </div>

      {tab === "personas" && (
        <div role="tabpanel" className="grid gap-5 lg:grid-cols-2">
          {personas.map((persona, personaIndex) => (
            <GlassCard key={persona.id} className="relative overflow-hidden">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#4F46E5]/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#818CF8] to-[#4F46E5] font-['Plus_Jakarta_Sans'] text-sm font-bold">
                      {persona.name.split(" ").map((part) => part[0]).join("")}
                    </span>
                    <div>
                      <input
                        aria-label={`Persona ${personaIndex + 1} name`}
                        value={persona.name}
                        onChange={(event) => setPersonas((current) => current.map((item) => item.id === persona.id ? { ...item, name: event.target.value } : item))}
                        className="block w-full bg-transparent font-['Plus_Jakarta_Sans'] text-lg font-semibold outline-none focus:text-[#b5b9ff]"
                      />
                      <input
                        aria-label={`Persona ${personaIndex + 1} role`}
                        value={persona.role}
                        onChange={(event) => setPersonas((current) => current.map((item) => item.id === persona.id ? { ...item, role: event.target.value } : item))}
                        className="mt-1 block w-full bg-transparent text-xs text-white/40 outline-none focus:text-white/65"
                      />
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-white/25"><Pencil size={10} /> Editable</span>
                </div>
                <blockquote className="my-6 border-l-2 border-[#818CF8]/40 pl-4 font-['Plus_Jakarta_Sans'] text-lg leading-relaxed text-white/75">“{persona.quote}”</blockquote>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#63e6be]">Trying to achieve</span>
                    <ul className="mt-3 space-y-2">{persona.goals.map((goal) => <li key={goal} className="flex gap-2 text-xs leading-5 text-white/50"><Check size={12} className="mt-1 shrink-0 text-[#63e6be]" />{goal}</li>)}</ul>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ff8cab]">Current friction</span>
                    <ul className="mt-3 space-y-2">{persona.pains.map((pain) => <li key={pain} className="flex gap-2 text-xs leading-5 text-white/50"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#ff8cab]" />{pain}</li>)}</ul>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">Use scenario</span>
                  <p className="mt-2 text-xs leading-5 text-white/45">{persona.scenario}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === "features" && (
        <div role="tabpanel">
          <GlassCard className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold">RICE calibration</h2>
              <p className="mt-1 text-xs leading-5 text-white/40">Aura suggested reach, impact and confidence from the brief. Adjust effort; ranking updates immediately.</p>
            </div>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#818CF8]/20 bg-[#4F46E5]/10 px-3 text-xs text-[#adb2ff]"><LockKeyhole size={12} /> Estimates are visibly labeled</span>
          </GlassCard>
          <div className="overflow-x-auto rounded-[20px] border border-white/10 bg-[#05080d]/65">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  {["Priority", "Feature", "Reach", "Impact", "Confidence", "Effort", "RICE"].map((head) => <th key={head} className="p-4 text-left font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.11em] text-white/30">{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {ranked.map((feature, index) => {
                  const score = riceScore(feature);
                  return (
                    <tr key={feature.id} className="border-b border-white/[0.07] last:border-0 hover:bg-white/[0.02]">
                      <td className="p-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${index === 0 ? "bg-[#4F46E5] text-white" : "bg-white/[0.05] text-white/45"}`}>{priorityLabel(score)}</span></td>
                      <td className="max-w-[260px] p-4"><strong className="block text-[13px] text-white/75">{feature.title}</strong><span className="mt-1 block text-[11px] leading-4 text-white/30">{feature.description}</span></td>
                      <td className="p-4 font-['JetBrains_Mono'] text-xs text-white/55">{feature.reach}</td>
                      <td className="p-4 font-['JetBrains_Mono'] text-xs text-white/55">{feature.impact}</td>
                      <td className="p-4 font-['JetBrains_Mono'] text-xs text-white/55">{Math.round(feature.confidence * 100)}%</td>
                      <td className="p-4">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          aria-label={`Effort for ${feature.title}`}
                          value={feature.effort}
                          onChange={(event) => setFeatures((current) => current.map((item) => item.id === feature.id ? { ...item, effort: Math.max(1, Number(event.target.value)) } : item))}
                          className="h-10 w-20 rounded-xl border border-white/10 bg-white/[0.045] px-3 font-['JetBrains_Mono'] text-xs outline-none focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15"
                        />
                      </td>
                      <td className="p-4 font-['JetBrains_Mono'] text-base font-semibold text-[#aeb3ff]">{score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "prd" && (
        <div role="tabpanel" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="rounded-3xl border border-white/10 bg-[#f2f3f7] p-6 text-[#161821] shadow-[0_30px_100px_rgba(0,0,0,.35)] sm:p-10">
            <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-[#4F46E5]">PRD · Version 1.0</span>
            <h2 className="mt-4 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-[-0.04em]">Pulse</h2>
            <p className="mt-2 text-sm text-black/50">Evidence-first product strategy for lean teams</p>
            <div className="my-8 h-px bg-black/10" />
            {[
              ["Objective", "Help lean product teams move from fragmented evidence to a defensible product decision without surrendering strategic control."],
              ["Core problem", "Small product teams make expensive roadmap decisions from fragmented research and untested assumptions."],
              ["Product principles", "Evidence stays attached. Humans approve strategic decisions. Uncertainty is visible."],
              ["First-release scope", ranked.slice(0, 3).map((item) => item.title).join(" · ")],
              ["Success definition", "An approved, cited Brand Brief and complete PRD in under 30 minutes of active engine time."],
            ].map(([heading, content]) => (
              <section key={heading} className="mb-7">
                <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold">{heading}</h3>
                <p className="mt-2 text-sm leading-6 text-black/60">{content}</p>
              </section>
            ))}
          </article>
          <div className="space-y-4">
            <GlassCard>
              <FileText size={20} className="text-[#818CF8]" />
              <h3 className="mt-4 font-['Plus_Jakarta_Sans'] text-lg font-semibold">Ready to circulate</h3>
              <p className="mt-2 text-xs leading-5 text-white/40">Download the source document now. PDF export is represented in the production API contract.</p>
              <Button className="mt-5 w-full" variant="secondary" icon={<Download size={14} />} onClick={() => downloadText("pulse-prd.md", prdMarkdown, "text/markdown")}>Download Markdown</Button>
              <Button className="mt-2 w-full" variant="ghost" icon={<Download size={14} />} onClick={() => window.print()}>Print as PDF</Button>
            </GlassCard>
            <Alert title="Traceable input">This document was compiled from the approved brief, two personas and the ranked feature set.</Alert>
          </div>
        </div>
      )}

      {approved && <div className="mt-5"><Alert tone="success" title="Definition approved">Personas, feature order and PRD version 1 are locked as prototype inputs.</Alert></div>}

      <ActionBar
        note={approved ? "Approved by you · PRD version 1 locked" : "Review all three views before approving this strategic checkpoint."}
        secondary={!approved ? <Button variant="secondary" onClick={() => setTab(tab === "personas" ? "features" : "prd")}>Review next view</Button> : undefined}
        primary={approved
          ? <Button onClick={() => router.push(`/project/${projectId}/prototype`)} icon={<ArrowRight size={15} />}>Continue to Prototype</Button>
          : <Button onClick={approve} icon={<Check size={15} />}>Approve prioritization &amp; PRD</Button>}
      />
    </WorkflowShell>
  );
}
