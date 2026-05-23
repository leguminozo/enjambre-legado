'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';

export function Progress({ className = '', value = 0, ...props }: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className}`} {...props}>
      <ProgressPrimitive.Indicator className="h-full w-full flex-1 bg-primary transition-all" style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
    </ProgressPrimitive.Root>
  );
}
