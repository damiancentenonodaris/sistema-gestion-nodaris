import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: "h-6 w-6 text-2xs",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

// Hash determinista para asignar gradiente al nombre
function gradientFor(name: string) {
  const palettes = [
    "from-brand-500 to-brand-700",
    "from-violet-500 to-indigo-600",
    "from-sky-500 to-blue-700",
    "from-emerald-500 to-teal-700",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br text-white font-semibold tracking-wide shadow-soft",
        gradientFor(name),
        sizes[size],
        className,
      )}
      title={name}
    >
      {initials(name) || "?"}
    </span>
  );
}
