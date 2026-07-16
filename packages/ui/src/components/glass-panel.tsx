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
    default: "bg-card/60 backdrop-blur-xl border border-foreground/20",
    strong: "bg-card/70 backdrop-blur-2xl border border-foreground/25",
    raised: "bg-surface-raised/70 backdrop-blur-xl border border-border/50 shadow-lg",
  }[variant];

  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-300",
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