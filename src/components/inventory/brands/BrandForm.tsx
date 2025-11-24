"use client";

import React from "react";
import { z } from "zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

export const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required").min(2, "Brand name must be at least 2 characters"),
  description: z.string().optional(),
  logoUrl: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
  isActive: z.boolean(),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;

export function useBrandForm(
  defaultValues?: Partial<BrandFormValues>
): UseFormReturn<BrandFormValues> {
  return useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      description: "",
      logoUrl: "",
      isActive: true,
      ...defaultValues,
    },
  });
}

type BrandFormProps = {
  form: UseFormReturn<BrandFormValues>;
  onSubmit: (values: BrandFormValues) => void | Promise<void>;
  saving?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

export function BrandForm({
  form,
  onSubmit,
  saving = false,
  submitLabel = "Save Brand",
  cancelLabel = "Cancel",
  onCancel,
}: BrandFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Acme" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Optional description"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://…" {...field} />
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
                  id="brand-active"
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                />
                <Label
                  htmlFor="brand-active"
                  className="cursor-pointer select-none"
                >
                  Active brand
                </Label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
      </form>
    </Form>
  );
}
