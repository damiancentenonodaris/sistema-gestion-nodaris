import { cn } from "@/lib/utils";

interface NodarisLogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  tone?: "light" | "dark";
}

/**
 * Marca Nodaris: nodos conectados sobre un hexágono.
 * Concepto: red astral / sistema que alinea.
 */
export function NodarisLogo({ size = 28, className, withWordmark = false, tone = "light" }: NodarisLogoProps) {
  const isDark = tone === "dark";
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="nodaris-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <path
          d="M16 2.5L28 9v14L16 29.5 4 23V9L16 2.5z"
          fill="url(#nodaris-grad)"
          opacity="0.12"
          stroke="url(#nodaris-grad)"
          strokeWidth="1.2"
        />
        {/* Nodos */}
        <circle cx="16" cy="9" r="2" fill="url(#nodaris-grad)" />
        <circle cx="9" cy="13" r="1.6" fill="url(#nodaris-grad)" />
        <circle cx="23" cy="13" r="1.6" fill="url(#nodaris-grad)" />
        <circle cx="11" cy="22" r="1.6" fill="url(#nodaris-grad)" />
        <circle cx="21" cy="22" r="1.6" fill="url(#nodaris-grad)" />
        <circle cx="16" cy="17" r="2.4" fill="url(#nodaris-grad)" />
        {/* Conexiones */}
        <g stroke="url(#nodaris-grad)" strokeWidth="1" opacity="0.7">
          <line x1="16" y1="9" x2="16" y2="17" />
          <line x1="9" y1="13" x2="16" y2="17" />
          <line x1="23" y1="13" x2="16" y2="17" />
          <line x1="11" y1="22" x2="16" y2="17" />
          <line x1="21" y1="22" x2="16" y2="17" />
        </g>
      </svg>
      {withWordmark && (
        <span
          className={cn(
            "font-semibold tracking-tight text-[15px]",
            isDark ? "text-white" : "text-ink",
          )}
        >
          Nodaris<span className="text-brand-500">.</span>
        </span>
      )}
    </div>
  );
}
