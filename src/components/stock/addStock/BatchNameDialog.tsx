"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type BatchNameDialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  onConfirm(batchName: string): void;
  itemCount: number;
};

export default function BatchNameDialog({
  open,
  onOpenChange,
  onConfirm,
  itemCount,
}: BatchNameDialogProps) {
  const [batchName, setBatchName] = React.useState<string>("");

  // Auto-generate a default batch name when dialog opens
  React.useEffect(() => {
    if (open && !batchName) {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
      setBatchName(`BATCH-${dateStr}-${timeStr}`);
    }
  }, [open]);

  const handleConfirm = () => {
    const name = batchName.trim();
    if (!name) return;
    onConfirm(name);
    setBatchName("");
  };

  const handleCancel = () => {
    setBatchName("");
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="bg-background text-foreground fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold">
            Confirm Stock Addition
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mt-2">
            You are about to add {itemCount} item{itemCount !== 1 ? "s" : ""} to
            stock. Please provide a batch name for this stock entry.
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="batchName" className="text-sm font-medium">
                Batch Name
              </Label>
              <Input
                id="batchName"
                type="text"
                value={batchName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBatchName(e.target.value)
                }
                placeholder="e.g., BATCH-2025-11-24"
                className="mt-1.5"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && batchName.trim()) {
                    handleConfirm();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                This name will be used to identify this stock batch and will appear
                on QR labels.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              disabled={!batchName.trim()}
              onClick={handleConfirm}
            >
              Confirm & Add Stock
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

