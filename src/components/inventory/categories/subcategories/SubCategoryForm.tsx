"use client";

import React from "react";
import { z } from "zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateSlug } from "@/lib/utils";

export const subCategoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentCategoryId: z.string().min(1, "Parent category is required"),
});

export type SubCategoryFormValues = z.infer<typeof subCategoryFormSchema>;

export function useSubCategoryForm(
  defaultValues?: Partial<SubCategoryFormValues>
): UseFormReturn<SubCategoryFormValues> {
  return useForm<SubCategoryFormValues>({
    resolver: zodResolver(subCategoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parentCategoryId: "",
      ...defaultValues,
    },
  });
}

type CategoryOption = {
  id: string;
  name: string;
};

type SubCategoryFormProps = {
  form: UseFormReturn<SubCategoryFormValues>;
  onSubmit: (values: SubCategoryFormValues) => void | Promise<void>;
  categories: CategoryOption[];
  saving?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  autoSlug?: boolean;
  allowSlugEditing?: boolean;
  allowSlugRegenerate?: boolean;
};

export function SubCategoryForm({
  form,
  onSubmit,
  categories,
  saving = false,
  submitLabel = "Save Subcategory",
  cancelLabel = "Cancel",
  onCancel,
  autoSlug = true,
  allowSlugEditing = false,
  allowSlugRegenerate = false,
}: SubCategoryFormProps) {
  const nameWatch = form.watch("name");

  React.useEffect(() => {
    if (autoSlug && !form.formState.dirtyFields.slug) {
      const generated = generateSlug(nameWatch);
      form.setValue("slug", generated, { shouldValidate: true });
    }
  }, [nameWatch, autoSlug, form]);

  const handleRegenerateSlug = React.useCallback(() => {
    const currentName = form.getValues("name");
    const generated = generateSlug(currentName);
    form.setValue("slug", generated, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="parentCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Wireless Keyboards" {...field} />
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
                {allowSlugRegenerate && (
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
