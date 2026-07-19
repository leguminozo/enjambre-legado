"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  variant?: "default" | "success" | "accent";
  className?: string;
}

export function Progress({
  value = 0,
  variant = "default",
  className,
  ...props
}: ProgressProps) {
  const indicatorColor = {
    default: "bg-primary",
    success: "bg-success",
    accent: "bg-accent",
  }[variant];

  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all duration-500 ease-elegant",
          indicatorColor,
        )}
        style={{ transform: `translateX(-${100 - Math.min(Math.max(value, 0), 100)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}