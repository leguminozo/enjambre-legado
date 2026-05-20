'use client';

import { toast as sonnerToast } from 'sonner';

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  description?: string;
}

export function toast(message: string, options?: ToastOptions & { type?: ToastType }) {
  const type = options?.type ?? 'default';
  const duration = options?.duration ?? 4000;

  const commonProps = {
    duration,
    description: options?.description,
  };

  switch (type) {
    case 'success':
      return sonnerToast.success(message, commonProps);
    case 'error':
      return sonnerToast.error(message, commonProps);
    case 'warning':
      return sonnerToast.warning(message, commonProps);
    case 'info':
      return sonnerToast(message, { ...commonProps, icon: 'ℹ️' });
    default:
      return sonnerToast(message, commonProps);
  }
}

export { toast as toaster };
