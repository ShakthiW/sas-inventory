"use client";

import React from "react";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

export const supplierFormSchema = z.object({
  supplierType: z.enum(["individual", "company"]),
  name: z.string().min(1, "Supplier name is required").min(3),
  code: z.string().min(1, "Supplier code is required"),
  isActive: z.boolean(),
  phone: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonPhone: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export function useSupplierForm(
  defaultValues?: Partial<SupplierFormValues>
): UseFormReturn<SupplierFormValues> {
  return useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      supplierType: "individual",
      name: "",
      code: "",
      isActive: true,
      phone: "",
      contactPersonName: "",
      contactPersonPhone: "",
      ...defaultValues,
    },
  });
}

export function generateSupplierCode(name?: string) {
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
    .map((part) => part.slice(0, 3))
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "SUP"}-${random(5)}`;
}

type SupplierFormProps = {
  form: UseFormReturn<SupplierFormValues>;
  onSubmit: (values: SupplierFormValues) => void | Promise<void>;
  saving?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  renderFooter?: (ctx: {
    saving: boolean;
    onCancel?: () => void;
    submitLabel: string;
    cancelLabel: string;
  }) => React.ReactNode;
};

export function SupplierForm({
  form,
  onSubmit,
  saving = false,
  submitLabel = "Save Supplier",
  cancelLabel = "Cancel",
  onCancel,
  renderFooter,
}: SupplierFormProps) {
  const supplierTypeWatch = form.watch("supplierType");
  const nameWatch = form.watch("name");
  const activeId = React.useId();

  React.useEffect(() => {
    if (!form.getValues("code")) {
      const generated = generateSupplierCode(nameWatch);
      form.setValue("code", generated, {
        shouldDirty: !form.formState.isDirty,
        shouldValidate: false,
      });
    }
  }, [nameWatch, form]);

  const handleRegenerate = React.useCallback(() => {
    const next = generateSupplierCode(form.getValues("name"));
    form.setValue("code", next, { shouldDirty: true, shouldValidate: true });
  }, [form]);

  const footerContent = renderFooter
    ? renderFooter({ saving, onCancel, submitLabel, cancelLabel })
    : (
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      );

  return (
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

        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
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
                      disabled={saving}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    onCheckedChange={(value) => field.onChange(Boolean(value))}
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        {footerContent}
      </form>
    </Form>
  );
}


