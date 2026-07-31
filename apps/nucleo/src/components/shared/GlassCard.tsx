'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'glass-strong' | 'accent';
  glow?: boolean;
  animateHover?: boolean;
}

export function GlassCard({
  children,
  variant = 'glass',
  glow = false,
  animateHover = true,
  className,
  ...props
}: GlassCardProps) {
  const baseStyles = cn(
    "rounded-2xl overflow-hidden transition-all duration-300",
    variant === 'default' && "bg-card border border-border shadow-md",
    variant === 'glass' && "glass shadow-glass",
    variant === 'glass-strong' && "glass-strong shadow-glass",
    variant === 'accent' && "bg-primary text-primary-foreground border border-primary/20",
    glow && "card-glow",
    className
  );

  if (animateHover) {
    const motionProps = props as HTMLMotionProps<'div'>;
    return (
      <motion.div
        className={baseStyles}
        whileHover={{ scale: 1.008, y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseStyles} {...props}>
      {children}
    </div>
  );
}
