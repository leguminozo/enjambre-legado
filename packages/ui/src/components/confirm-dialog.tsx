'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Spinner } from './spinner';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'primary' | 'gold';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'destructive',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const [isActionPending, setIsActionPending] = React.useState(false);

  const isBusy = loading || isActionPending;

  const handleConfirm = async () => {
    try {
      setIsActionPending(true);
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Caller handles error toasts
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isBusy && onOpenChange(val)}>
      <DialogContent
        className="sm:max-w-md border-border bg-background shadow-2xl"
        showCloseButton={!isBusy}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground font-light">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-1 whitespace-pre-line">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex items-center justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            size="md"
            disabled={isBusy}
            onClick={handleConfirm}
          >
            {isBusy ? <Spinner size="sm" className="mr-2" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
