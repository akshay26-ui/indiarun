"use client";

import { AlertCircle, Check, Info, LoaderCircle, X } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
};

export function Button({ variant = "primary", icon, className = "", children, ...props }: ButtonProps) {
  const variants = {
    primary: "border-transparent bg-gradient-to-br from-[#5b52ed] to-[#4F46E5] text-white shadow-[0_12px_36px_rgba(79,70,229,0.3)]",
    secondary: "border-white/[0.14] bg-white/[0.055] text-white/90",
    ghost: "border-transparent bg-transparent text-white/60 hover:bg-white/[0.055] hover:text-white/90",
    danger: "border-[#ff3366]/25 bg-[#ff3366]/10 text-[#ff8cab]",
  };
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border px-[18px] text-sm font-semibold transition duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030508] disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function GlassCard({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.02)_42%),rgba(9,12,20,0.68)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-2xl backdrop-saturate-150 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold tracking-[0.01em] text-white/60">{label}</span>
      {children}
      {(hint || error) && (
        <span className={`mt-[7px] block text-xs ${error ? "text-[#ff8cab]" : "text-white/40"}`}>
          {error ?? hint}
        </span>
      )}
    </label>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "error";
  title: string;
  children: ReactNode;
}) {
  const Icon = tone === "success" ? Check : tone === "error" ? AlertCircle : Info;
  const color = tone === "success" ? "#63e6be" : tone === "error" ? "#ff8cab" : "#a9b0ff";
  const tones = {
    success: "border-[#63e6be]/20 bg-[#63e6be]/[0.05]",
    error: "border-[#ff8cab]/20 bg-[#ff8cab]/[0.05]",
    info: "border-[#a9b0ff]/20 bg-[#a9b0ff]/[0.05]",
  };
  const textTones = {
    success: "text-[#63e6be]",
    error: "text-[#ff8cab]",
    info: "text-[#a9b0ff]",
  };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-2xl border p-[14px] ${tones[tone]}`}
    >
      <Icon size={18} color={color} className="mt-px shrink-0" aria-hidden />
      <div>
        <strong className={`block text-[13px] ${textTones[tone]}`}>{title}</strong>
        <div className="mt-[3px] text-[13px] leading-6 text-white/60">{children}</div>
      </div>
    </div>
  );
}

export function Modal({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-6 backdrop-blur-[10px]" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="w-full max-w-[520px] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.02)_42%),rgba(9,12,20,0.9)] p-7 shadow-2xl backdrop-blur-2xl" role="dialog" aria-modal="true" aria-labelledby="wf-modal-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="wf-modal-title" className="m-0 font-['Plus_Jakarta_Sans'] text-2xl tracking-[-0.03em]">{title}</h2>
            {description && <p className="mt-2 leading-relaxed text-white/60">{description}</p>}
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close dialog" className="min-w-11 px-0" icon={<X size={18} />} />
        </div>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}

export function LoadingState({ label = "Preparing your workspace" }: { label?: string }) {
  return (
    <GlassCard className="grid min-h-[280px] place-items-center text-center">
      <div>
        <LoaderCircle size={28} className="animate-spin text-[#818CF8]" aria-hidden />
        <p className="mt-4 font-semibold">{label}</p>
        <p className="mt-1.5 text-[13px] text-white/40">This usually takes only a moment.</p>
      </div>
    </GlassCard>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <GlassCard className="grid min-h-[300px] place-items-center text-center">
      <div className="max-w-[430px]">
        <div className="mx-auto mb-[18px] grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[#818CF8]/[0.12] text-[#818CF8]">{icon}</div>
        <h3 className="m-0 font-['Plus_Jakarta_Sans'] text-[22px]">{title}</h3>
        <p className="mb-5 mt-2.5 leading-relaxed text-white/60">{description}</p>
        {action}
      </div>
    </GlassCard>
  );
}
