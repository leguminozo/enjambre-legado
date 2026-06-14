'use client';

import { toast as sonnerToast } from 'sonner';

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  description?: string;
}

interface EnhancedToast {
  (message: string, options?: ToastOptions & { type?: ToastType }): string | number;
  success(message: string, options?: ToastOptions): string | number;
  error(message: string, options?: ToastOptions): string | number;
  warning(message: string, options?: ToastOptions): string | number;
  info(message: string, options?: ToastOptions): string | number;
}

export const toast: EnhancedToast = Object.assign(
  (message: string, options?: ToastOptions & { type?: ToastType }) => {
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
  },
  {
    success: (message: string, options?: ToastOptions) =>
      sonnerToast.success(message, { duration: options?.duration ?? 4000, description: options?.description }),
    error: (message: string, options?: ToastOptions) =>
      sonnerToast.error(message, { duration: options?.duration ?? 4000, description: options?.description }),
    warning: (message: string, options?: ToastOptions) =>
      sonnerToast.warning(message, { duration: options?.duration ?? 4000, description: options?.description }),
    info: (message: string, options?: ToastOptions) =>
      sonnerToast(message, { duration: options?.duration ?? 4000, description: options?.description, icon: 'ℹ️' }),
  }
);

export { toast as toaster };
