"use client";

import React from "react";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function slugifyCategoryName(input: string) {
  return input
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function useCategoryForm(
  defaultValues?: Partial<CategoryFormValues>
): UseFormReturn<CategoryFormValues> {
  return useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true,
      ...defaultValues,
    },
  });
}

type CategoryFormProps = {
  form: UseFormReturn<CategoryFormValues>;
  onSubmit: (values: CategoryFormValues) => void | Promise<void>;
  saving?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  autoSlug?: boolean;
  allowSlugEditing?: boolean;
  allowSlugRegenerate?: boolean;
  children?: React.ReactNode;
};

export function CategoryForm({
  form,
  onSubmit,
  saving = false,
  submitLabel = "Save Category",
  cancelLabel = "Cancel",
  onCancel,
  autoSlug = true,
  allowSlugEditing = false,
  allowSlugRegenerate = false,
  children,
}: CategoryFormProps) {
  const nameWatch = form.watch("name");
  const slugWatch = form.watch("slug");
  const activeId = React.useId();

  React.useEffect(() => {
    if (!autoSlug) return;
    const nextSlug = slugifyCategoryName(nameWatch || "");
    if (nextSlug && nextSlug !== slugWatch) {
      form.setValue("slug", nextSlug, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
    if (!nextSlug && slugWatch) {
      form.setValue("slug", "", {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [autoSlug, form, nameWatch, slugWatch]);

  const handleRegenerateSlug = React.useCallback(() => {
    const nextSlug = slugifyCategoryName(form.getValues("name") ?? "");
    form.setValue("slug", nextSlug, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [form]);

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
                <Input placeholder="e.g. Electronics" {...field} />
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
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="auto-generated"
                    {...field}
                    disabled={!allowSlugEditing}
                  />
                </FormControl>
                {allowSlugRegenerate && !autoSlug && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRegenerateSlug}
                    disabled={saving}
                  >
                    Generate
                  </Button>
                )}
              </div>
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
                  Active category
                </Label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {children}

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


