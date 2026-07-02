import { Check } from "lucide-react";
import { STAGES } from "../../constants/workflow";
import { stageIndex } from "../../lib/workflow";
import type { StageId } from "../../types/workflow";

export function ProgressStrip({ stage }: { stage: StageId }) {
  const activeIndex = stageIndex(stage);
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-[#070a11]/60 px-4 py-3 backdrop-blur-xl" aria-label={`Workflow progress: step ${activeIndex + 1} of ${STAGES.length}`}>
      <div className="flex items-center gap-1.5">
        {STAGES.map((item, index) => (
          <div key={item.id} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-['JetBrains_Mono'] text-[9px] font-semibold ${
                index < activeIndex
                  ? "bg-[#4F46E5] text-white"
                  : index === activeIndex
                    ? "border border-[#818CF8]/60 bg-[#4F46E5]/20 text-[#aeb3ff]"
                    : "border border-white/10 bg-white/[0.03] text-white/25"
              }`}
            >
              {index < activeIndex ? <Check size={12} aria-hidden /> : index + 1}
            </span>
            <span className={`hidden truncate text-[10px] font-semibold xl:block ${index === activeIndex ? "text-white/75" : "text-white/25"}`}>{item.shortLabel}</span>
            {index < STAGES.length - 1 && <span className={`h-px flex-1 ${index < activeIndex ? "bg-[#4F46E5]/70" : "bg-white/[0.08]"}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}
