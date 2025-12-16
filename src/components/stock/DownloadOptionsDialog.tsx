"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

export type DownloadOptionsDialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  onConfirm(): void;
};

export default function DownloadOptionsDialog({
  open,
  onOpenChange,
  onConfirm,
}: DownloadOptionsDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="bg-background text-foreground fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold">
            Download QR Labels
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mt-2">
            This will generate a label file for printing. QR code sizes and print layout settings are automatically determined by each product&apos;s configuration.
          </Dialog.Description>

          <div className="mt-4 rounded-lg bg-muted/50 border p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Ready to Download</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Each product&apos;s QR size and items-per-row settings will be applied automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Download</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
