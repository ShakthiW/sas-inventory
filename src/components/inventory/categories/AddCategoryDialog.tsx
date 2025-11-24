"use client";

import React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { CategoryCreatePayload } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  CategoryForm,
  type CategoryFormValues,
  useCategoryForm,
} from "./CategoryForm";
import { FormControl, FormLabel } from "@/components/ui/form";

type AddCategoryDialogProps = { onCreated?: () => void };

export default function AddCategoryDialog({
  onCreated,
}: AddCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [subName, setSubName] = React.useState("");
  const [subNames, setSubNames] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const form = useCategoryForm();

  async function onSubmit(values: CategoryFormValues) {
    if (saving) return;
    setSaving(true);
    try {
      const payload = values as CategoryCreatePayload;
      const res = await fetch("/api/inventory/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          (body as { error?: string }).error ??
          "Failed to create category. Please try again.";
        throw new Error(message);
      }
      const created = body as { insertedId?: string };

      // Create subcategories if provided
      if (created?.insertedId && subNames.length) {
        await Promise.allSettled(
          subNames.map((n) =>
            fetch("/api/inventory/categories/subcategories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: n,
                isActive: values.isActive ?? true,
                parentCategoryId: created.insertedId,
              }),
            })
          )
        );
      }
      toast.success("Category created");
      setOpen(false);
      form.reset();
      setSubNames([]);
      setSubName("");
      onCreated?.();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not create category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Add Category</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Create a new product category.</DialogDescription>
        </DialogHeader>

        <CategoryForm
          form={form}
          onSubmit={onSubmit}
          saving={saving}
          onCancel={() => {
            setOpen(false);
            form.reset();
            setSubNames([]);
            setSubName("");
          }}
        >
          <div className="grid gap-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FormLabel className="mb-2">
                  Add Sub Categories (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Smartphones"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                  />
                </FormControl>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const n = subName.trim();
                  if (!n) return;
                  if (!subNames.includes(n)) setSubNames((s) => [...s, n]);
                  setSubName("");
                }}
                disabled={saving}
              >
                Add
              </Button>
            </div>
            {subNames.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {subNames.map((n) => (
                  <Badge key={n} variant="secondary" className="gap-2">
                    {n}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setSubNames((s) => s.filter((x) => x !== n))
                      }
                      aria-label={`Remove ${n}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CategoryForm>
      </DialogContent>
    </Dialog>
  );
}
