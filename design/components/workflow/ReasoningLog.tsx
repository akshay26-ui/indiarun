"use client";

import { Check, ChevronDown, LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";

export function ReasoningLog({
  steps,
  title = "Agent reasoning",
  running = false,
}: {
  steps: Array<{ title: string; detail: string; duration?: string }>;
  title?: string;
  running?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#080b12]/65 backdrop-blur-2xl">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 text-left transition hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#818CF8]"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#4F46E5]/15 text-[#9ca3ff]"><Sparkles size={15} aria-hidden /></span>
          <span>
            <strong className="block text-sm">{title}</strong>
            <span className="block text-[11px] text-white/35">{running ? "Analysis in progress" : `${steps.length} transparent steps · complete`}</span>
          </span>
        </span>
        <ChevronDown size={17} className={`text-white/35 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <ol className="border-t border-white/10 px-5 py-2">
          {steps.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[24px_minmax(0,1fr)_auto] gap-3 border-b border-white/[0.06] py-4 last:border-0">
              <span className={`mt-px grid h-6 w-6 place-items-center rounded-full ${running && index === steps.length - 1 ? "bg-[#818CF8]/15 text-[#818CF8]" : "bg-[#63e6be]/10 text-[#63e6be]"}`}>
                {running && index === steps.length - 1 ? <LoaderCircle size={12} className="animate-spin" /> : <Check size={12} />}
              </span>
              <span>
                <strong className="block text-[13px] font-semibold text-white/80">{step.title}</strong>
                <span className="mt-1 block text-xs leading-5 text-white/40">{step.detail}</span>
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-white/25">{step.duration}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
