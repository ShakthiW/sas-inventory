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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateSlug } from "@/lib/utils";

export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required").min(3),
  slug: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  qtyAlert: z.number().int().min(0).optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function useProductForm(
  defaultValues?: Partial<ProductFormValues>
): UseFormReturn<ProductFormValues> {
  return useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      category: "",
      subCategory: "",
      brand: "",
      unit: "",
      description: "",
      price: undefined,
      quantity: undefined,
      qtyAlert: undefined,
      ...defaultValues,
    },
  });
}

type Option = {
  id: string;
  name: string;
};

type ProductFormProps = {
  form: UseFormReturn<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  categories: Option[];
  subcategories: Option[];
  brands: Option[];
  units: Option[];
  saving?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  autoSlug?: boolean;
  allowSlugEditing?: boolean;
};

export function ProductForm({
  form,
  onSubmit,
  categories,
  subcategories,
  brands,
  units,
  saving = false,
  submitLabel = "Save Product",
  cancelLabel = "Cancel",
  onCancel,
  autoSlug = true,
  allowSlugEditing = false,
}: ProductFormProps) {
  const nameWatch = form.watch("name");

  React.useEffect(() => {
    if (autoSlug && !form.formState.dirtyFields.slug) {
      const generated = generateSlug(nameWatch || "");
      form.setValue("slug", generated, { shouldValidate: true });
    }
  }, [nameWatch, autoSlug, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Laptop Pro 15" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. LAP-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  placeholder="auto-generated"
                  {...field}
                  disabled={!allowSlugEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
            name="subCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategory</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
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
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Product description"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="qtyAlert"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alert Level</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
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
