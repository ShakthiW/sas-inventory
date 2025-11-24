"use client";

import React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BrandCreatePayload } from "@/lib/types";
import {
  BrandForm,
  type BrandFormValues,
  useBrandForm,
} from "./BrandForm";

type AddBrandsDialogProps = { onCreated?: () => void };

export default function AddBrandsDialog({ onCreated }: AddBrandsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const form = useBrandForm();

  async function onSubmit(values: BrandFormValues) {
    if (saving) return;
    setSaving(true);
    try {
      const payload: BrandCreatePayload = {
        name: values.name,
        description: values.description,
        isActive: values.isActive ?? true,
        logoUrl:
          values.logoUrl && values.logoUrl.trim() !== ""
            ? values.logoUrl
            : undefined,
      };
      const res = await fetch("/api/inventory/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          (body as { error?: string }).error ??
          "Failed to create brand. Please try again.";
        throw new Error(message);
      }
      toast.success("Brand created");
      setOpen(false);
      form.reset();
      onCreated?.();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not create brand");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Add Brand</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Brand</DialogTitle>
          <DialogDescription>Create a new brand.</DialogDescription>
        </DialogHeader>

        <BrandForm
          form={form}
          saving={saving}
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
