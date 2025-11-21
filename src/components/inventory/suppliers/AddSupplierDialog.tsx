"use client";

import React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import type { SupplierCreatePayload } from "@/lib/types";
import {
  SupplierForm,
  type SupplierFormValues,
  useSupplierForm,
} from "./SupplierForm";
import { Button } from "@/components/ui/button";

type AddSupplierDialogProps = {
  onCreated?: () => void;
};

export default function AddSupplierDialog({
  onCreated,
}: AddSupplierDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const form = useSupplierForm();

  async function onSubmit(values: SupplierFormValues) {
    if (saving) return;
    setSaving(true);
    try {
      const payload = values as SupplierCreatePayload;
      const res = await fetch("/api/inventory/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data?.error ?? "Failed to create supplier. Please try again.";
        throw new Error(message);
      }
      toast.success("Supplier created");
      // close dialog and reset
      setOpen(false);
      form.reset();
      onCreated?.();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Could not create supplier"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Add Supplier</Button>
      </DialogTrigger>
      <DialogContent className="z-[100000] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Supplier</DialogTitle>
          <DialogDescription>
            Provide supplier details and status.
          </DialogDescription>
        </DialogHeader>

        <SupplierForm
          form={form}
          saving={saving}
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
