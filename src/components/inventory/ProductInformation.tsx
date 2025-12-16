"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import React from "react";
import type { ProductInformationForm } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Option = { label: string; value: string };

const formSchema = z.object({
  name: z.string().min(1).min(3),
  slug: z.string().optional(),
  sku: z.string().min(1).min(3).optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  supplier: z.string().optional(),
  unit: z.string().optional(),
  qrSize: z.enum(["100x50", "100x150", "25x25"]).optional(),
  itemsPerRow: z.number().int().min(1).max(10).optional(),
  description: z.string().optional(),
});

type ProductInformationProps = {
  onChange?: (values: ProductInformationForm) => void;
};

export default function MyForm({ onChange }: ProductInformationProps) {
  const [categoryOptions, setCategoryOptions] = React.useState<Option[]>([]);
  const [brandOptions, setBrandOptions] = React.useState<Option[]>([]);
  const [supplierOptions, setSupplierOptions] = React.useState<Option[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = React.useState<Option[]>(
    []
  );
  // Removed loading flag to avoid unused var while keeping simple UX

  const form = useForm<ProductInformationForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      category: "",
      subCategory: "",
      brand: "",
      supplier: "",
      unit: "",
      qrSize: "100x50",
      itemsPerRow: 2,
      description: "",
    },
  });

  const slugify = (input: string) => {
    return input
      .toString()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const watchedName = form.watch("name");
  const watchedCategory = form.watch("category");
  const watchedSubCategory = form.watch("subCategory");
  const watchedBrand = form.watch("brand");

  // Auto-generate product name from Brand - Category - Subcategory
  useEffect(() => {
    const brand = brandOptions.find(b => b.value === watchedBrand)?.label || "";
    const category = categoryOptions.find(c => c.value === watchedCategory)?.label || "";
    const subCategory = subCategoryOptions.find(s => s.value === watchedSubCategory)?.label || "";
    
    // Only auto-generate if we have at least brand and category
    if (brand && category) {
      const parts = [brand, category];
      if (subCategory) {
        parts.push(subCategory);
      }
      const generatedName = parts.join(" - ");
      
      // Only set if the current name is empty or was previously auto-generated
      const currentName = form.getValues("name");
      const shouldUpdate = !currentName || currentName.includes(" - ");
      
      if (shouldUpdate) {
        form.setValue("name", generatedName, { shouldValidate: true });
      }
    }
  }, [watchedBrand, watchedCategory, watchedSubCategory, brandOptions, categoryOptions, subCategoryOptions, form]);

  useEffect(() => {
    if (typeof watchedName === "string") {
      const nextSlug = slugify(watchedName);
      form.setValue("slug", nextSlug, { shouldValidate: true });
    }
  }, [watchedName, form]);

  // Lift values up when they change
  useEffect(() => {
    if (!onChange) return;
    const subscription = form.watch((values) => {
      onChange(values as ProductInformationForm);
    });
    // Fire once with initial values
    onChange(form.getValues());
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  // Fetch categories, brands, and suppliers once
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const [catRes, brandRes, supplierRes] = await Promise.all([
          fetch("/api/inventory/categories?limit=200&sort=name&dir=asc"),
          fetch("/api/inventory/brands?limit=200&sort=name&dir=asc"),
          fetch("/api/inventory/suppliers?limit=200&sort=name&dir=asc"),
        ]);
        const catJson = await catRes.json();
        const brandJson = await brandRes.json();
        const supplierJson = await supplierRes.json();
        type CategoryRow = { id?: string; _id?: string; name: string };
        type BrandRow = { id?: string; _id?: string; name: string };
        type SupplierRow = { id?: string; _id?: string; name: string };
        const cats: Option[] = ((catJson?.data as CategoryRow[]) || [])
          .map((c) => {
            const id = (c.id || c._id) as string | undefined;
            return id ? { value: id, label: c.name } : null;
          })
          .filter((v): v is Option => v !== null);
        const brands: Option[] = ((brandJson?.data as BrandRow[]) || [])
          .map((b) => {
            const id = (b.id || b._id) as string | undefined;
            return id ? { value: id, label: b.name } : null;
          })
          .filter((v): v is Option => v !== null);
        const suppliers: Option[] = ((supplierJson?.data as SupplierRow[]) || [])
          .map((s) => {
            const id = (s.id || s._id) as string | undefined;
            return id ? { value: id, label: s.name } : null;
          })
          .filter((v): v is Option => v !== null);
        if (mounted) {
          setCategoryOptions(cats);
          setBrandOptions(brands);
          setSupplierOptions(suppliers);
        }
      } catch {
        // ignore for now
      } finally {
        // no-op
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!watchedCategory) {
        setSubCategoryOptions([]);
        form.setValue("subCategory", "");
        return;
      }
      try {
        const res = await fetch(
          `/api/inventory/categories/subcategories?limit=200&sort=name&dir=asc&parent=${encodeURIComponent(
            watchedCategory
          )}`
        );
        const json = await res.json();
        type SubRow = { id?: string; _id?: string; name: string };
        const subs: Option[] = ((json?.data as SubRow[]) || [])
          .map((s) => {
            const id = (s.id || s._id) as string | undefined;
            return id ? { value: id, label: s.name } : null;
          })
          .filter((v): v is Option => v !== null);
        if (mounted) setSubCategoryOptions(subs);
      } catch (e) {
        // ignore
        console.error(e);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [watchedCategory, form]);

  const generateRandomSegment = (length: number) => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoids 0/O and 1/I
    let result = "";
    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
  };

  const derivePrefixFromName = (name: string) => {
    const cleaned = name
      .toUpperCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9\s-]/g, " ")
      .trim();

    if (!cleaned) return "SKU";

    const parts = cleaned.split(/\s+|-/).filter(Boolean);
    const first = (parts[0] || "").slice(0, 3);
    const second = (parts[1] || "").slice(0, 3);
    const prefix = (first + (second ? "-" + second : "")).replace(
      /[^A-Z0-9-]/g,
      ""
    );
    return prefix || "SKU";
  };

  const handleGenerateSku = () => {
    const name = form.getValues("name") || "";
    const prefix = derivePrefixFromName(name);
    const randomPart = generateRandomSegment(6);
    const candidate = `${prefix}-${randomPart}`.replace(/-+/g, "-");
    form.setValue("sku", candidate, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(values);
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      );
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 mx-auto"
      >
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" type="text" {...field} value={form.getValues("name")}/>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-6">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="auto-generated"
                      disabled
                      type="text"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-11">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add or Generate Automatically"
                      type="text"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-1 flex justify-end">
            <Button variant="default" type="button" onClick={handleGenerateSku}>
              Generate
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-6">
            <FormField
              control={form.control}
              name="subCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Category (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sub category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subCategoryOptions.map((subCategory) => (
                        <SelectItem
                          key={subCategory.value}
                          value={subCategory.value}
                        >
                          {subCategory.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brandOptions.map((brand) => (
                        <SelectItem key={brand.value} value={brand.value}>
                          {brand.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-6">
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supplierOptions.map((supplier) => (
                        <SelectItem key={supplier.value} value={supplier.value}>
                          {supplier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="qrSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>QR Code Size</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select QR code size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="100x50">100x50 mm</SelectItem>
                      <SelectItem value="100x150">100x150 mm</SelectItem>
                      <SelectItem value="25x25">25x25 mm</SelectItem>
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-6">
            <FormField
              control={form.control}
              name="itemsPerRow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Items Per Row (Print Layout)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      placeholder="e.g., 2"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of labels printed horizontally across the page
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Type your message"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        {/* <Button type="submit">Submit</Button> */}
      </form>
    </Form>
  );
}
