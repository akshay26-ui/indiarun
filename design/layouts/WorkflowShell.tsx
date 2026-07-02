"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Menu, PanelLeftClose, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import Prism from "../components/landing/Prism";
import { STAGES } from "../constants/workflow";
import { stageHref, stageIndex } from "../lib/workflow";
import type { StageId } from "../types/workflow";
import { Button } from "../components/ui/WorkflowUI";

export function PrismBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-[#030508]" aria-hidden>
      <div className="absolute inset-0 opacity-65">
        <Prism
          animationType="rotate"
          timeScale={0.18}
          height={3.5}
          baseWidth={5.1}
          scale={2.5}
          colorFrequency={0.6}
          noise={0.12}
          glow={0.9}
          bloom={0.9}
          suspendWhenOffscreen
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,transparent_0,rgba(3,5,8,0.12)_38%,#030508_88%),linear-gradient(180deg,rgba(3,5,8,0.2),rgba(3,5,8,0.86))]" />
    </div>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="inline-flex items-center gap-3 rounded-lg text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]">
      <div className="flex flex-col items-end gap-[3.5px] shrink-0">
        <div className="h-[2px] rounded-full" style={{ width: '5px', background: '#818CF8', opacity: 0.5, boxShadow: '0 0 4px #818CF8' }} />
        <div className="h-[2px] rounded-full" style={{ width: '10px', background: '#818CF8', opacity: 0.8, boxShadow: '0 0 6px #818CF8' }} />
        <div className="h-[2px] rounded-full" style={{ width: '16px', background: '#818CF8', boxShadow: '0 0 8px #818CF8' }} />
      </div>
      <span className="font-['Plus_Jakarta_Sans'] text-base font-bold tracking-tight">Aura Agent</span>
    </Link>
  );
}

function StageNavigation({ stage, projectId, onNavigate }: { stage: StageId; projectId: string; onNavigate?: () => void }) {
  const activeIndex = stageIndex(stage);
  return (
    <nav aria-label="Product workflow" className="mt-8 space-y-1.5">
      <p className="mb-3 px-3 font-['JetBrains_Mono'] text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">Workflow</p>
      {STAGES.map((item, index) => {
        const Icon = item.icon;
        const current = item.id === stage;
        const complete = index < activeIndex;
        return (
          <Link
            key={item.id}
            href={stageHref(projectId, item.id)}
            onClick={onNavigate}
            aria-current={current ? "step" : undefined}
            className={`group flex min-h-[52px] items-center gap-3 rounded-2xl px-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] ${
              current
                ? "border border-[#818CF8]/20 bg-[#4F46E5]/15 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                : "border border-transparent text-white/45 hover:bg-white/[0.04] hover:text-white/75"
            }`}
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${current ? "bg-[#4F46E5] text-white" : complete ? "bg-[#4F46E5]/20 text-[#9da4ff]" : "bg-white/[0.04]"}`}>
              <Icon size={15} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">{item.label}</span>
              <span className="block truncate text-[10px] text-white/30">{complete ? "Complete" : current ? "In progress" : item.description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function WorkflowShell({
  stage,
  projectId = "pulse",
  children,
}: {
  stage: StageId;
  projectId?: string;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#030508] font-['Hanken_Grotesk'] text-white/90 selection:bg-[#818CF8]/20">
      <PrismBackdrop />
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[#030508]/75 px-4 backdrop-blur-2xl lg:hidden">
        <Brand />
        <Button variant="ghost" className="min-w-11 px-0" aria-label="Open workflow navigation" onClick={() => setMobileOpen(true)} icon={<Menu size={19} />} />
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMobileOpen(false)}>
          <aside className="h-full w-[min(88vw,310px)] overflow-y-auto border-r border-white/10 bg-[#06080e]/95 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <Button variant="ghost" className="min-w-11 px-0" aria-label="Close workflow navigation" onClick={() => setMobileOpen(false)} icon={<X size={18} />} />
            </div>
            <StageNavigation stage={stage} projectId={projectId} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-white/10 bg-[#030508]/72 p-5 backdrop-blur-2xl lg:block">
          <div className="flex h-full flex-col">
            <div className="flex h-10 items-center justify-between">
              <Brand />
              <PanelLeftClose size={16} className="text-white/20" aria-hidden />
            </div>
            <StageNavigation stage={stage} projectId={projectId} />
            <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#818CF8] to-[#4F46E5] text-xs font-bold">AK</span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">Akshay Singh</span>
                  <span className="block truncate text-[10px] text-white/35">Personal workspace</span>
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main key={pathname} className="min-w-0 px-4 pb-16 pt-3 sm:px-6 lg:px-[clamp(32px,4vw,64px)] lg:pt-6">
          <div className="mx-auto w-full max-w-[1160px] animate-in fade-in slide-in-from-bottom-2 duration-500">
            {stage !== "intake" && (
              <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-1 text-xs font-semibold text-white/40 transition hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]">
                <ChevronLeft size={14} aria-hidden />
                All projects
              </Link>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  step,
  title,
  description,
  actions,
}: {
  step: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 mt-6 flex flex-col items-start justify-between gap-6 sm:mt-8 lg:flex-row lg:items-end">
      <div>
        <div className="mb-3 flex items-center gap-2 font-['JetBrains_Mono'] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#818CF8]">
          <span className="h-px w-5 bg-[#818CF8]/60" />
          {step}
        </div>
        <h1 className="m-0 max-w-[760px] font-['Plus_Jakarta_Sans'] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.045em]">{title}</h1>
        <p className="mt-3 max-w-[680px] text-base leading-relaxed text-white/60">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function ActionBar({
  note,
  secondary,
  primary,
}: {
  note: ReactNode;
  secondary?: ReactNode;
  primary: ReactNode;
}) {
  return (
    <div className="sticky bottom-4 z-30 mt-8 flex flex-col gap-3 rounded-[20px] border border-white/10 bg-[#090c14]/85 p-3 pl-[18px] shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs leading-5 text-white/45">{note}</div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {secondary}
        {primary}
      </div>
    </div>
  );
}
