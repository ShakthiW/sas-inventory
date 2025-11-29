"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DownloadOptionsDialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  onConfirm(size: string, itemsPerRow: number): void;
};

export default function DownloadOptionsDialog({
  open,
  onOpenChange,
  onConfirm,
}: DownloadOptionsDialogProps) {
  const [size, setSize] = React.useState<string>("25x25");
  const [itemsPerRow, setItemsPerRow] = React.useState<number>(4);

  // Update default items per row when size changes
  React.useEffect(() => {
    if (size === "25x25") {
      setItemsPerRow(4);
    } else {
      setItemsPerRow(2);
    }
  }, [size]);

  const handleConfirm = () => {
    onConfirm(size, itemsPerRow);
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
            Select the label size and layout configuration for your printer.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="size" className="text-sm font-medium">
                Label Size
              </Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25x25">25x25 mm (Small)</SelectItem>
                  <SelectItem value="100x50">100x50 mm (Medium)</SelectItem>
                  <SelectItem value="100x150">100x150 mm (Large)</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
