"use client";

import * as React from "react";
import { AlertTriangleIcon, Loader2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type ConfirmDialogProps = {
  trigger: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  loadingLabel?: React.ReactNode;
  icon?: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  onOpenChange?: (open: boolean) => void;
};

export default function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loadingLabel = "Working…",
  icon,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const defaultIcon = React.useMemo(
    () => <AlertTriangleIcon className="size-5" aria-hidden="true" />,
    []
  );

  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      if (loading) {
        return;
      }
      setOpen(value);
      onOpenChange?.(value);
    },
    [loading, onOpenChange]
  );

  const handleConfirm = React.useCallback(async () => {
    try {
      setLoading(true);
      await Promise.resolve(onConfirm());
      setOpen(false);
      onOpenChange?.(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [onConfirm, onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            {icon ?? defaultIcon}
          </div>
          <AlertDialogHeader className="flex-1 gap-1 text-left">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description ? (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
                {loadingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

