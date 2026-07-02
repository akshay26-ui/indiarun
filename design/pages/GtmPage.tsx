"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Download, IndianRupee, Sparkles, TrendingUp } from "lucide-react";
import { downloadText } from "../lib/workflow";
import { ActionBar, PageHeader, WorkflowShell } from "../layouts/WorkflowShell";
import { ProgressStrip } from "../components/workflow/ProgressStrip";
import { Alert, Button, Field, GlassCard } from "../components/ui/WorkflowUI";

type Tab = "plan" | "economics";

const initialPlan = [
  ["Objective", "Recruit 30 design partners and prove weekly decision-room usage."],
  ["Target market", "Independent product leads and founders at software teams of 2–10."],
  ["Positioning", "The evidence-first decision workspace between research and roadmap."],
  ["GTM motion", "Founder-led, product-led cohort with high-touch onboarding."],
  ["Packaging", "Free single decision room; ₹4,900/month for continuous product work."],
  ["Differentiators", "Source-linked claims · visible approvals · honest uncertainty."],
  ["Success metrics", "60% activation · 40% week-four retention · NPS above 35."],
];

export default function GtmPage({ projectId = "pulse" }: { projectId?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("plan");
  const [plan, setPlan] = useState(initialPlan);
  const [inputs, setInputs] = useState({ cac: 7200, arpu: 4900, cost: 900, lifetime: 14 });

  const metrics = useMemo(() => {
    const grossMargin = inputs.arpu - inputs.cost;
    const ltv = grossMargin * inputs.lifetime;
    return {
      grossMargin,
      marginPercent: inputs.arpu ? Math.round((grossMargin / inputs.arpu) * 100) : 0,
      ltv,
      payback: grossMargin > 0 ? inputs.cac / grossMargin : 0,
      ratio: inputs.cac > 0 ? ltv / inputs.cac : 0,
    };
  }, [inputs]);

  const invalid = Object.values(inputs).some((value) => value < 0) || inputs.cost >= inputs.arpu;

  const exportPack = () => {
    const content = `PULSE — LAUNCH PACK\n\nGTM PLAN\n${plan.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nUNIT ECONOMICS\nCAC: ₹${inputs.cac}\nARPU: ₹${inputs.arpu}\nGross margin: ₹${metrics.grossMargin}\nLTV: ₹${metrics.ltv}\nCAC payback: ${metrics.payback.toFixed(1)} months\nLTV:CAC: ${metrics.ratio.toFixed(1)}x`;
    downloadText("pulse-launch-pack.txt", content);
  };

  return (
    <WorkflowShell stage="gtm" projectId={projectId}>
      <PageHeader
        step="Stage 05 · Launch"
        title="Make the first market move legible."
        description="The launch plan inherits the positioning you approved. Economics stay deterministic—Aura explains the numbers but never invents the math."
        actions={<Button variant="secondary" icon={<Download size={14} />} onClick={exportPack}>Export Launch Pack</Button>}
      />
      <ProgressStrip stage="gtm" />

      <div className="mb-5 flex w-full gap-1 rounded-2xl border border-white/10 bg-[#030508]/55 p-1 sm:w-fit" role="tablist">
        {[["plan", "GTM plan"], ["economics", "Unit economics"]].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id as Tab)} className={`min-h-10 flex-1 rounded-xl px-5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] sm:flex-none ${tab === id ? "bg-white/[0.09] text-white/90" : "text-white/45 hover:text-white/70"}`}>{label}</button>
        ))}
      </div>

      {tab === "plan" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#06090f]/65 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div><h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold">Market entry canvas</h2><p className="mt-1 text-xs text-white/35">Edit any row; the full plan exports as one artifact.</p></div>
              <span className="rounded-full bg-[#63e6be]/10 px-2.5 py-1 text-[10px] font-semibold text-[#63e6be]">Auto-filled</span>
            </div>
            {plan.map(([label, value], index) => (
              <div key={label} className="grid gap-3 border-b border-white/[0.07] p-5 last:border-0 md:grid-cols-[150px_1fr]">
                <label htmlFor={`gtm-${index}`} className="pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">{label}</label>
                <textarea
                  id={`gtm-${index}`}
                  value={value}
                  rows={2}
                  onChange={(event) => setPlan((current) => current.map((row, rowIndex) => rowIndex === index ? [row[0], event.target.value] : row))}
                  className="min-h-[58px] resize-none rounded-xl border border-transparent bg-transparent p-2 text-sm leading-6 text-white/65 outline-none transition hover:bg-white/[0.025] focus:border-[#818CF8]/50 focus:bg-white/[0.035] focus:ring-4 focus:ring-[#4F46E5]/10"
                />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <GlassCard>
              <Sparkles size={19} className="text-[#818CF8]" />
              <h3 className="mt-4 font-['Plus_Jakarta_Sans'] text-lg font-semibold">Why this motion</h3>
              <p className="mt-3 text-xs leading-5 text-white/45">The product asks teams to trust a new decision workflow. A small, founder-led cohort creates the evidence and language needed before product-led acquisition scales.</p>
            </GlassCard>
            <GlassCard>
              <span className="font-['JetBrains_Mono'] text-3xl font-semibold text-[#aeb3ff]">30</span>
              <span className="mt-2 block text-xs text-white/40">Design partners in the first cohort</span>
              <div className="mt-5 flex gap-1">{[1, 2, 3, 4, 5].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= 2 ? "bg-[#4F46E5]" : "bg-white/[0.08]"}`} />)}</div>
              <span className="mt-2 block text-[10px] text-white/25">12 currently qualified</span>
            </GlassCard>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <GlassCard>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#4F46E5]/15 text-[#9ca3ff]"><IndianRupee size={17} /></span>
              <div><h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold">Economic inputs</h2><p className="text-[11px] text-white/35">Monthly values in INR</p></div>
            </div>
            <div className="mt-6 space-y-5">
              {[
                ["cac", "Customer acquisition cost", "Blended spend to acquire one account"],
                ["arpu", "Average revenue / month", "Expected recurring account revenue"],
                ["cost", "Service delivery cost", "Infrastructure and direct support"],
                ["lifetime", "Customer lifetime (months)", "Expected active paid duration"],
              ].map(([key, label, hint]) => (
                <Field key={key} label={label} hint={hint}>
                  <input
                    type="number"
                    min="0"
                    value={inputs[key as keyof typeof inputs]}
                    onChange={(event) => setInputs((current) => ({ ...current, [key]: Number(event.target.value) }))}
                    className="h-12 w-full rounded-[14px] border border-white/10 bg-white/[0.045] px-3.5 font-['JetBrains_Mono'] text-sm outline-none focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15"
                  />
                </Field>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-5">
            {invalid ? (
              <Alert tone="error" title="Check the model inputs">Values cannot be negative, and service delivery cost must remain below ARPU to produce a viable gross margin.</Alert>
            ) : (
              <Alert tone="success" title="Healthy early model">The projected LTV:CAC ratio clears 3× and acquisition cost is recovered in under two months. Validate lifetime with cohort data before scaling spend.</Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Gross margin", `₹${metrics.grossMargin.toLocaleString("en-IN")}`, `${metrics.marginPercent}% of ARPU`],
                ["Lifetime value", `₹${metrics.ltv.toLocaleString("en-IN")}`, `${inputs.lifetime} month lifetime`],
                ["CAC payback", `${metrics.payback.toFixed(1)} mo`, "Target under 12 months"],
                ["LTV : CAC", `${metrics.ratio.toFixed(1)}×`, "Healthy threshold above 3×"],
              ].map(([label, value, note], index) => (
                <GlassCard key={label} className={index === 3 ? "border-[#818CF8]/30 bg-[#4F46E5]/10" : ""}>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">{label}</span>
                  <strong className={`mt-3 block font-['JetBrains_Mono'] text-3xl tracking-[-0.05em] ${index === 3 ? "text-[#b7bbff]" : "text-white/85"}`}>{value}</strong>
                  <span className="mt-2 block text-[11px] text-white/30">{note}</span>
                </GlassCard>
              ))}
            </div>
            <GlassCard className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#63e6be]/10 text-[#63e6be]"><TrendingUp size={18} /></span>
              <div><h3 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold">Plain-language verdict</h3><p className="mt-2 text-sm leading-6 text-white/45">The model has room to work, but its strongest assumption is customer lifetime. Launch with cohort retention as the primary economic learning goal.</p></div>
            </GlassCard>
          </div>
        </div>
      )}

      <ActionBar
        note={<span className="inline-flex items-center gap-2"><CheckCircle2 size={13} className="text-[#63e6be]" /> Draft changes are persisted to this product.</span>}
        secondary={<Button variant="secondary" onClick={exportPack} icon={<Download size={14} />}>Download Launch Pack</Button>}
        primary={<Button disabled={invalid} onClick={() => router.push(`/project/${projectId}/tracking`)} icon={<ArrowRight size={15} />}>Continue to Tracking</Button>}
      />
    </WorkflowShell>
  );
}
