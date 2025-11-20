"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import type { SupplierCreatePayload } from "@/lib/types";

const formSchema = z.object({
  supplierType: z.enum(["individual", "company"]),
  name: z.string().min(1, "Supplier name is required").min(3),
  code: z.string().min(1),
  isActive: z.boolean().default(true),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  contactPersonName: z.string().optional(),
  contactPersonPhone: z.string().optional(),
});

type AddSupplierDialogProps = {
  onCreated?: () => void;
};

function generateSupplierCode(name?: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = (len: number) =>
    Array.from({ length: len })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join("");
  const base = (name || "SUP")
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.slice(0, 3))
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "SUP"}-${random(5)}`;
}

export default function AddSupplierDialog({
  onCreated,
}: AddSupplierDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierType: "individual",
      name: "",
      code: "",
      isActive: true,
      phone: "",
      contactPersonName: "",
      contactPersonPhone: "",
    },
  });

  const activeId = React.useId();

  const nameWatch = form.watch("name");
  const supplierTypeWatch = form.watch("supplierType");
  React.useEffect(() => {
    if (!form.getValues("code")) {
      form.setValue("code", generateSupplierCode(nameWatch));
    }
  }, [nameWatch, form]);

  function handleRegenerate() {
    const next = generateSupplierCode(form.getValues("name"));
    form.setValue("code", next, { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit(values: z.input<typeof formSchema>) {
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="supplierType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-3"
                    >
                      <label className="inline-flex items-center gap-2">
                        <RadioGroupItem value="individual" />
                        <span>Individual</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <RadioGroupItem value="company" />
                        <span>Company</span>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ABC Traders" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="sm:col-span-1">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Code</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Auto" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRegenerate}
                        >
                          Generate
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +94 77 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox
                        id={activeId}
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                      <Label
                        htmlFor={activeId}
                        className="cursor-pointer select-none"
                      >
                        Active supplier
                      </Label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {supplierTypeWatch === "company" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="contactPersonName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Name (Company)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPersonPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Phone (Company)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. +1 555 987 6543" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Supplier"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
