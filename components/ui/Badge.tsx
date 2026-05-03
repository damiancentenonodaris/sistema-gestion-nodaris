import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "violet" | "slate";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-surface-subtle text-ink-soft border-surface-border",
  blue: "bg-brand-50 text-brand-700 border-brand-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-rose-50 text-rose-700 border-rose-100",
  violet: "bg-violet-50 text-violet-700 border-violet-100",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-medium tracking-wide whitespace-nowrap",
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-slate-400": tone === "neutral" || tone === "slate",
            "bg-brand-500": tone === "blue",
            "bg-emerald-500": tone === "green",
            "bg-amber-500": tone === "amber",
            "bg-rose-500": tone === "red",
            "bg-violet-500": tone === "violet",
          })}
        />
      )}
      {children}
    </span>
  );
}
