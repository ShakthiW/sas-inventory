"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DownloadOptionsDialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  onConfirm(itemsPerRow: number): void;
};

export default function DownloadOptionsDialog({
  open,
  onOpenChange,
  onConfirm,
}: DownloadOptionsDialogProps) {
  const [itemsPerRow, setItemsPerRow] = React.useState<number>(2);

  const handleConfirm = () => {
    onConfirm(itemsPerRow);
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
            Configure the layout for your printer. QR code sizes are automatically determined by each product&apos;s settings.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="itemsPerRow" className="text-sm font-medium">
                Items Per Row
              </Label>
              <Input
                id="itemsPerRow"
                type="number"
                min={1}
                max={10}
                value={itemsPerRow}
                onChange={(e) => setItemsPerRow(parseInt(e.target.value) || 1)}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Number of labels printed horizontally across the page/roll.
              </p>
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
