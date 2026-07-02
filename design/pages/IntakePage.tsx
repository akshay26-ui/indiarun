"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Check, MessageSquareText, Package, Send, Sparkles, Smartphone } from "lucide-react";
import { useWorkflowState } from "../hooks/useWorkflowState";
import { WorkflowShell, PageHeader } from "../layouts/WorkflowShell";
import { ProgressStrip } from "../components/workflow/ProgressStrip";
import { Alert, Button, Field, GlassCard } from "../components/ui/WorkflowUI";
import type { IntakeBrief } from "../types/workflow";

const fields: Array<{ key: keyof IntakeBrief; label: string }> = [
  { key: "ideaName", label: "Idea named" },
  { key: "problem", label: "Problem clear" },
  { key: "targetUser", label: "Audience focused" },
  { key: "category", label: "Category mapped" },
  { key: "competitors", label: "Context added" },
  { key: "budget", label: "Budget bounded" },
  { key: "timeline", label: "Timeline set" },
];

export default function IntakePage() {
  const router = useRouter();
  const { state, update } = useWorkflowState();
  const [brief, setBrief] = useState(state.brief);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const filled = fields.filter(({ key }) => Boolean(String(brief[key]).trim())).length;
  const complete = filled === fields.length && Boolean(brief.ideaSummary.trim());
  const progress = Math.round((filled / fields.length) * 100);
  const progressWidth = ["w-0", "w-[14%]", "w-[29%]", "w-[43%]", "w-[57%]", "w-[71%]", "w-[86%]", "w-full"][filled];

  const nextPrompt = useMemo(() => {
    if (!brief.problem) return "What breaks today, and why does that matter?";
    if (!brief.targetUser) return "Who feels this problem most acutely?";
    if (!brief.category) return "Which product category should I investigate?";
    return "The brief is structured. Review the details before discovery.";
  }, [brief]);

  const setField = <K extends keyof IntakeBrief>(key: K, value: IntakeBrief[K]) =>
    setBrief((current) => ({ ...current, [key]: value }));

  const continueToDiscovery = () => {
    setSubmitted(true);
    if (!complete) return;
    update({ brief });
    router.push("/project/pulse/whitespace");
  };

  return (
    <WorkflowShell stage="intake">
      <PageHeader
        step="Stage 01 · Intake"
        title="Give the idea a sharper edge."
        description="Share what you know in plain language. Aura structures the problem, audience and constraints without making you repeat yourself."
      />
      <ProgressStrip stage="intake" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
        <GlassCard className="flex min-h-[610px] flex-col p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#4F46E5] text-white shadow-[0_0_24px_rgba(79,70,229,.28)]"><Sparkles size={16} /></span>
              <div>
                <strong className="block text-sm">Intake agent</strong>
                <span className="block text-[11px] text-[#63e6be]">Ready to structure</span>
              </div>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-wider text-white/35">Private workspace</span>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5" aria-live="polite">
            <div className="flex max-w-[82%] gap-3">
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#4F46E5]/15 text-[#9ca3ff]"><Sparkles size={12} /></span>
              <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-white/70">
                Start rough. What are you considering building, and what makes it worth exploring now?
              </div>
            </div>
            {brief.ideaSummary && (
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#4F46E5] p-4 text-sm leading-6 text-white shadow-[0_12px_36px_rgba(79,70,229,.25)]">
                {brief.ideaSummary}
              </div>
            )}
            <div className="flex max-w-[82%] gap-3">
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#4F46E5]/15 text-[#9ca3ff]"><Sparkles size={12} /></span>
              <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-white/70">
                I see the shape of it. <span className="text-white/90">{nextPrompt}</span>
              </div>
            </div>
            {message && (
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#4F46E5] p-4 text-sm leading-6 text-white">{message}</div>
            )}
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-2 focus-within:border-[#818CF8]/50 focus-within:ring-4 focus-within:ring-[#4F46E5]/10">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Add context or answer in your own words…"
                aria-label="Message the intake agent"
                rows={2}
                className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-white/85 outline-none placeholder:text-white/25"
              />
              <Button
                className="self-end px-3"
                aria-label="Send message"
                disabled={!message.trim()}
                icon={<Send size={15} />}
                onClick={() => {
                  if (!brief.ideaSummary) setField("ideaSummary", message);
                  else if (!brief.problem) setField("problem", message);
                  else if (!brief.targetUser) setField("targetUser", message);
                  setMessage("");
                }}
              />
            </div>
            <button type="button" onClick={() => setShowForm((value) => !value)} className="mt-3 text-xs font-semibold text-white/40 transition hover:text-white/70">
              {showForm ? "Hide structured editor" : "Prefer a form? Edit the structured brief"}
            </button>
          </div>
        </GlassCard>

        <div className="space-y-5">
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">Living brief</span>
                <h2 className="mt-1 font-['Plus_Jakarta_Sans'] text-xl font-semibold">What Aura understands</h2>
              </div>
              <span className="font-['JetBrains_Mono'] text-xs text-[#9ca3ff]">{progress}%</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className={`h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#818CF8] transition-all duration-500 ${progressWidth}`} />
            </div>

            <div className="mt-5 space-y-2">
              {fields.map(({ key, label }) => {
                const isFilled = Boolean(String(brief[key]).trim());
                return (
                  <div key={key} className="flex min-h-10 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3">
                    <span className={`grid h-5 w-5 place-items-center rounded-full ${isFilled ? "bg-[#63e6be]/10 text-[#63e6be]" : "border border-white/10 text-transparent"}`}>
                      <Check size={11} />
                    </span>
                    <span className={`text-xs font-medium ${isFilled ? "text-white/65" : "text-white/25"}`}>{label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {(["software", "physical"] as const).map((type) => {
                const Icon = type === "software" ? Smartphone : Package;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setField("productType", type)}
                    className={`flex min-h-[74px] flex-col items-start justify-center rounded-2xl border px-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] ${
                      brief.productType === type ? "border-[#818CF8]/40 bg-[#4F46E5]/12 text-white/85" : "border-white/10 bg-white/[0.025] text-white/35 hover:bg-white/[0.045]"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="mt-2 text-xs font-semibold capitalize">{type}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {submitted && !complete && <Alert tone="error" title="The brief needs more context">Complete every field in the structured editor before starting market discovery.</Alert>}

          <Button className="w-full" onClick={continueToDiscovery} icon={<ArrowRight size={16} />}>
            Start whitespace discovery
          </Button>
          <p className="text-center text-[11px] leading-5 text-white/30">This starts source-backed market analysis. You will approve the Brand Brief before anything moves forward.</p>
        </div>
      </div>

      {showForm && (
        <GlassCard className="mt-5">
          <div className="mb-6 flex items-center gap-3">
            <MessageSquareText size={18} className="text-[#818CF8]" />
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold">Structured brief editor</h2>
              <p className="mt-1 text-xs text-white/40">Changes here update the same project context as the conversation.</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Idea name"><input className="h-12 w-full rounded-[14px] border border-white/10 bg-white/[0.045] px-3.5 text-sm outline-none focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15" value={brief.ideaName} onChange={(event) => setField("ideaName", event.target.value)} /></Field>
            <Field label="Category"><input className="h-12 w-full rounded-[14px] border border-white/10 bg-white/[0.045] px-3.5 text-sm outline-none focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15" value={brief.category} onChange={(event) => setField("category", event.target.value)} /></Field>
            <Field label="Problem statement"><textarea className="min-h-[108px] w-full resize-y rounded-[14px] border border-white/10 bg-white/[0.045] p-3.5 text-sm leading-relaxed outline-none focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15" value={brief.problem} onChange={(event) => setField("problem", event.target.value)} /></Field>
            <Field label="Primary user"><textarea className="min-h-[108px] w-full resize-y rounded-[14px] border border-white/10 bg-white/[0.045] p-3.5 text-sm leading-relaxed outline-none focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15" value={brief.targetUser} onChange={(event) => setField("targetUser", event.target.value)} /></Field>
            <Field label="Known competitors"><input className="h-12 w-full rounded-[14px] border border-white/10 bg-white/[0.045] px-3.5 text-sm outline-none focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15" value={brief.competitors} onChange={(event) => setField("competitors", event.target.value)} /></Field>
            <Field label="Budget constraint"><input className="h-12 w-full rounded-[14px] border border-white/10 bg-white/[0.045] px-3.5 text-sm outline-none focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15" value={brief.budget} onChange={(event) => setField("budget", event.target.value)} /></Field>
            <Field label="Timeline constraint"><input className="h-12 w-full rounded-[14px] border border-white/10 bg-white/[0.045] px-3.5 text-sm outline-none focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15" value={brief.timeline} onChange={(event) => setField("timeline", event.target.value)} /></Field>
          </div>
        </GlassCard>
      )}
    </WorkflowShell>
  );
}
