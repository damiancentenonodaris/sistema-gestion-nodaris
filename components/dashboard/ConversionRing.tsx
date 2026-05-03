"use client";

interface Props {
  leads: number;
  activos: number;
}

export function ConversionRing({ leads, activos }: Props) {
  const total = leads + activos;
  const ratio = total === 0 ? 0 : activos / total;
  const pct = Math.round(ratio * 100);

  const r = 58;
  const c = 2 * Math.PI * r;
  const dash = c * ratio;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[140px] w-[140px]">
        <svg viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#E2E8F0" strokeWidth="10" />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" />
              <stop offset="1" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-ink leading-none">{pct}%</span>
          <span className="text-2xs text-ink-faint mt-1">conversión</span>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <div className="flex items-center gap-2 text-ink-subtle">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            <span className="text-xs">Activos</span>
          </div>
          <p className="text-lg font-semibold text-ink mt-0.5">{activos}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 text-ink-subtle">
            <span className="h-2 w-2 rounded-full bg-surface-border" />
            <span className="text-xs">Leads</span>
          </div>
          <p className="text-lg font-semibold text-ink mt-0.5">{leads}</p>
        </div>
      </div>
    </div>
  );
}
