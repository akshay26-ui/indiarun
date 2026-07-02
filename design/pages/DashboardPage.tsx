"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Boxes, Command, MoreHorizontal, Plus, Search, Sparkles } from "lucide-react";
import { DEMO_PROJECTS, PRODUCT_TYPE_META, STAGES } from "../constants/workflow";
import { stageHref } from "../lib/workflow";
import { PrismBackdrop } from "../layouts/WorkflowShell";
import { Button, EmptyState, GlassCard } from "../components/ui/WorkflowUI";

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const projects = useMemo(
    () => DEMO_PROJECTS.filter((project) => project.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <div className="min-h-screen bg-[#030508] font-['Hanken_Grotesk'] text-white/90 selection:bg-[#818CF8]/20">
      <PrismBackdrop />
      <div className="relative z-10">
        <header className="border-b border-white/10 bg-[#030508]/65 backdrop-blur-2xl">
          <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
            <Link href="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]">
              <div className="flex flex-col items-end gap-[3.5px] shrink-0">
                <div className="h-[2px] rounded-full" style={{ width: '5px', background: '#818CF8', opacity: 0.5, boxShadow: '0 0 4px #818CF8' }} />
                <div className="h-[2px] rounded-full" style={{ width: '10px', background: '#818CF8', opacity: 0.8, boxShadow: '0 0 6px #818CF8' }} />
                <div className="h-[2px] rounded-full" style={{ width: '16px', background: '#818CF8', boxShadow: '0 0 8px #818CF8' }} />
              </div>
              <span className="font-['Plus_Jakarta_Sans'] font-bold">Aura Agent</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-white/35 sm:inline">Personal workspace</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#818CF8] to-[#4F46E5] text-xs font-bold">AK</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.14em] text-[#818CF8]">
                <Sparkles size={13} aria-hidden />
                Product command
              </div>
              <h1 className="font-['Plus_Jakarta_Sans'] text-[clamp(2.25rem,5vw,4.25rem)] font-bold leading-none tracking-[-0.055em]">
                Ideas in motion.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/55">Pick up a product decision where you left it, or open a fresh line of inquiry.</p>
            </div>
            <Link href="/project/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-transparent bg-gradient-to-br from-[#5b52ed] to-[#4F46E5] px-[18px] text-sm font-semibold text-white shadow-[0_12px_36px_rgba(79,70,229,0.3)] transition duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030508]">
              <Plus size={16} /> Start a new product
            </Link>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              ["03", "Active products"],
              ["14", "Artifacts created"],
              ["02", "Decisions awaiting you"],
            ].map(([value, label], index) => (
              <GlassCard key={label} className={index === 2 ? "border-[#818CF8]/25 bg-[#4F46E5]/[0.08]" : ""}>
                <span className="font-['JetBrains_Mono'] text-3xl font-semibold tracking-[-0.05em] text-white/90">{value}</span>
                <span className="mt-2 block text-xs text-white/40">{label}</span>
              </GlassCard>
            ))}
          </div>

          <section className="mt-12" aria-labelledby="projects-heading">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 id="projects-heading" className="font-['Plus_Jakarta_Sans'] text-xl font-semibold tracking-tight">Your products</h2>
                <p className="mt-1 text-xs text-white/35">All research, decisions and artifacts stay attached to the product.</p>
              </div>
              <label className="relative block w-full sm:w-[280px]">
                <span className="sr-only">Search projects</span>
                <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products"
                  className="h-11 w-full rounded-[14px] border border-white/10 bg-white/[0.045] pl-10 pr-4 text-sm text-white/90 outline-none transition placeholder:text-white/25 focus:border-[#818CF8]/70 focus:ring-4 focus:ring-[#4F46E5]/15"
                />
              </label>
            </div>

            {projects.length === 0 ? (
              <EmptyState
                icon={<Search size={22} />}
                title="No matching products"
                description="Try a broader name or clear the search to see your complete workspace."
                action={<Button variant="secondary" onClick={() => setQuery("")}>Clear product search</Button>}
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {projects.map((project) => {
                  const meta = PRODUCT_TYPE_META[project.type];
                  const TypeIcon = meta.icon;
                  const currentStage = STAGES.find((stage) => stage.id === project.stage);
                  const stagePosition = Math.max(1, STAGES.findIndex((stage) => stage.id === project.stage) + 1);
                  return (
                    <Link
                      key={project.id}
                      href={stageHref(project.id, project.stage)}
                      className="group rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030508]"
                    >
                      <GlassCard className="h-full transition duration-300 group-hover:-translate-y-1 group-hover:border-[#818CF8]/30">
                        <div className="flex items-start justify-between">
                          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#9ca3ff]">
                            <TypeIcon size={19} aria-hidden />
                          </span>
                          <MoreHorizontal size={18} className="text-white/25" aria-hidden />
                        </div>
                        <h3 className="mt-8 font-['Plus_Jakarta_Sans'] text-[22px] font-semibold tracking-[-0.025em]">{project.name}</h3>
                        <p className="mt-1.5 text-xs text-white/40">{meta.label} · Updated {project.updatedAt.toLowerCase()}</p>
                        <div className="my-6 h-px bg-white/[0.08]" />
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">Current stage</span>
                            <span className="mt-1.5 block text-sm font-semibold text-white/75">{currentStage?.label}</span>
                          </div>
                          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/40 transition group-hover:border-[#818CF8]/35 group-hover:bg-[#4F46E5] group-hover:text-white">
                            <ArrowRight size={15} aria-hidden />
                          </span>
                        </div>
                        <div className="mt-5 flex gap-1">
                          {STAGES.map((stage, index) => (
                            <span key={stage.id} className={`h-1 flex-1 rounded-full ${index < stagePosition ? "bg-[#4F46E5]" : "bg-white/[0.08]"}`} />
                          ))}
                        </div>
                      </GlassCard>
                    </Link>
                  );
                })}
                <Link href="/project/new" className="group min-h-[310px] rounded-3xl border border-dashed border-white/[0.14] bg-white/[0.018] p-6 transition hover:border-[#818CF8]/35 hover:bg-[#4F46E5]/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-white/40 transition group-hover:bg-[#4F46E5] group-hover:text-white"><Plus size={20} /></span>
                    <span className="mt-5 font-['Plus_Jakarta_Sans'] text-lg font-semibold">Start from an idea</span>
                    <span className="mt-2 max-w-[220px] text-xs leading-5 text-white/35">Shape a raw thought into an evidence-backed product case.</span>
                  </div>
                </Link>
              </div>
            )}
          </section>

          <div className="mt-12 flex items-center gap-2 text-[11px] text-white/25">
            <Command size={12} />
            Tip: press tab to move through every product and action.
          </div>
        </main>
      </div>
    </div>
  );
}
