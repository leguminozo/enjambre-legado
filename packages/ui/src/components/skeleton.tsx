"use client";

import { cn } from "../lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string;
  height?: string;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const variantClass = {
    text: "h-4 rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-2xl",
  }[variant];

  return (
    <div
      className={cn(
        "animate-shimmer bg-gradient-to-r from-surface-sunken via-surface-raised to-surface-sunken bg-[length:200%_100%]",
        variantClass,
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonGroupProps {
  count?: number;
  className?: string;
  variant?: SkeletonProps["variant"];
  spacing?: string;
}

export function SkeletonGroup({
  count = 3,
  className,
  variant = "text",
  spacing = "space-y-3",
}: SkeletonGroupProps) {
  return (
    <div className={cn(spacing, className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 space-y-4", className)} aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-1/3 h-5" />
        <Skeleton variant="circular" className="w-6 h-6" />
      </div>
      <SkeletonGroup count={lines} spacing="space-y-2.5" />
    </div>
  );
}

interface SkeletonKpiProps {
  className?: string;
}

export function SkeletonKpi({ className }: SkeletonKpiProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 space-y-3", className)} aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-24 h-3.5" />
        <Skeleton variant="rectangular" className="w-5 h-5 rounded-md" />
      </div>
      <Skeleton variant="text" className="w-28 h-7" />
      <Skeleton variant="text" className="w-36 h-3" />
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)} aria-hidden="true">
      <div className="flex items-center gap-4 px-6 py-3.5 bg-surface-sunken border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-3.5" />
        ))}
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} variant="text" className={cn("flex-1 h-4", c === 0 ? "w-1/4" : "")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}