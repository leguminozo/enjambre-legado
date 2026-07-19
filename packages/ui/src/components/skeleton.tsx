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