'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { 
  CheckCircleIcon as CheckCircle, 
  AlertCircleIcon as AlertCircle, 
  AlertTriangleIcon as AlertTriangle, 
  InfoIcon as Info, 
  Loader2Icon as Loader2, 
  XIcon as X 
} from '../icons';

type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface ToastPromise<T> {
  promise: Promise<T>;
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
}

interface Toast {
  id: string;
  title?: string;
  message: string;
  description?: string;
  variant: ToastVariant;
  persistent?: boolean;
  action?: ToastAction;
  promise?: ToastPromise<unknown>;
  createdAt: number;
  isPromise?: boolean;
  promiseState?: 'pending' | 'success' | 'error';
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'createdAt' | 'isPromise' | 'promiseState'>) => string;
  removeToast: (id: string) => void;
  dismissAll: () => void;
  promise: <T>(promise: Promise<T>, options: ToastPromise<T>) => Promise<T>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [history, setHistory] = useState<Toast[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('enjambre-toast-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(-50));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('enjambre-toast-history', JSON.stringify(history.slice(-50)));
    } catch {
      // Ignore localStorage errors
    }
  }, [history]);

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'createdAt' | 'isPromise' | 'promiseState'>) => {
    const id = crypto.randomUUID();
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: Date.now(),
      isPromise: false,
      promiseState: undefined,
    };
    setToasts((prev) => [...prev, newToast]);
    setHistory((prev) => [...prev, newToast].slice(-50));

    if (!toast.persistent) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.variant === 'error' ? 8000 : 5000);
    }
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const promise = useCallback(async <T extends unknown>(promise: Promise<T>, options: ToastPromise<T>) => {
    const id = crypto.randomUUID();
    const loadingToast: Toast = {
      id,
      message: options.loading,
      variant: 'info',
      createdAt: Date.now(),
      isPromise: true,
      promiseState: 'pending',
      persistent: true,
    };
    setToasts((prev) => [...prev, loadingToast]);

    try {
      const data = await promise;
      const successMessage = typeof options.success === 'function' ? options.success(data) : options.success;
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, message: successMessage, variant: 'success', promiseState: 'success', persistent: false }
            : t
        )
      );
      setHistory((prev) => [...prev, { ...loadingToast, message: successMessage, variant: 'success', promiseState: 'success', persistent: false } as Toast].slice(-50));
      setTimeout(() => removeToast(id), 4000);
      return data;
    } catch (error) {
      const errorMessage = typeof options.error === 'function' ? options.error(error) : options.error;
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, message: errorMessage, variant: 'error', promiseState: 'error', persistent: true }
            : t
        )
      );
      setHistory((prev) => [...prev, { ...loadingToast, message: errorMessage, variant: 'error', promiseState: 'error', persistent: true } as Toast].slice(-50));
      throw error;
    }
  }, [removeToast]);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, addToast, removeToast, dismissAll, promise }),
    [toasts, addToast, removeToast, dismissAll, promise]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} containerRef={containerRef} />
    </ToastContext.Provider>
  );
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-card text-foreground border-border',
  success: 'bg-success/15 text-success border-accent/40', // OYZ: Oro Miel accent on success for brand warmth
  warning: 'bg-warning/15 text-warning border-warning/40',
  error: 'bg-destructive/15 text-destructive border-destructive/40',
  info: 'bg-primary/15 text-primary border-primary/30',
};

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="h-5 w-5 shrink-0" />,
  success: <CheckCircle className="h-5 w-5 shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 shrink-0" />,
  error: <AlertCircle className="h-5 w-5 shrink-0" />,
  info: <Info className="h-5 w-5 shrink-0" />,
};

function ToastContainer({
  toasts,
  onDismiss,
  containerRef,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm sm:max-w-md pointer-events-none"
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.animate(
        [
          { opacity: 0, transform: 'translateX(100%)', filter: 'blur(8px)' },
          { opacity: 1, transform: 'translateX(0)', filter: 'blur(0)' },
        ],
        { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
      );
    }
  }, []);

  useEffect(() => {
    if (isExiting && elementRef.current) {
      elementRef.current.animate(
        [
          { opacity: 1, transform: 'translateX(0)', filter: 'blur(0)' },
          { opacity: 0, transform: 'translateX(100%)', filter: 'blur(8px)' },
        ],
        { duration: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
      );
    }
  }, [isExiting]);

  const isPromisePending = toast.isPromise && toast.promiseState === 'pending';

  return (
    <div
      ref={elementRef}
      className={`
        pointer-events-auto
        flex items-start gap-3
        px-4 py-3.5
        rounded-xl border
        backdrop-blur-xl shadow-xl
        ${variantStyles[toast.variant]}
        ${toast.variant === 'success' ? 'border-l-2 border-l-accent pl-3.5' : ''}
        ${isPromisePending ? 'animate-pulse' : ''}
        ${isExiting ? 'opacity-50' : ''}
      `}
      role="alert"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex-shrink-0 pt-0.5 text-current">
        {isPromisePending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          variantIcons[toast.variant]
        )}
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-medium text-sm tracking-tight">{toast.title}</p>
        )}
        <p className={toast.title ? 'mt-1 text-sm' : 'text-sm'}>{toast.message}</p>
        {toast.description && (
          <p className="mt-1.5 text-xs text-muted-foreground">{toast.description}</p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              if (!toast.persistent) onDismiss(toast.id);
            }}
            className={`
              mt-2.5 text-xs font-medium transition-colors
              ${toast.action.variant === 'primary'
                ? 'text-primary hover:underline'
                : toast.action.variant === 'secondary'
                ? 'text-foreground hover:text-muted-foreground border-b border-transparent hover:border-current'
                : 'text-muted-foreground hover:text-foreground'}
            `}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      {!toast.persistent && !isPromisePending && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function useToastHistory() {
  const { toasts } = useToast();
  const [history, setHistory] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('enjambre-toast-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(-50).reverse());
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  return history;
}

export type { Toast, ToastVariant, ToastAction, ToastPromise };
