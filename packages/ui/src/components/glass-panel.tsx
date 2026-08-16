"use client";

import { cn } from "../lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "raised";
  glow?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({
  variant = "default",
  glow = false,
  children,
  className,
  ...props
}: GlassPanelProps) {
  const variantClass = {
    default: "glass-panel",
    strong: "glass-strong",
    raised: "glass-panel shadow-glass",
  }[variant];

  return (
    <div
      className={cn(
        "rounded-lg transition-colors",
        variantClass,
        glow && "shadow-glow",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}