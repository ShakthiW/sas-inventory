"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
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

const categories = [
  { label: "Electronics", value: "electronics" },
  { label: "Clothing", value: "clothing" },
  { label: "Furniture", value: "furniture" },
  { label: "Other", value: "other" },
];

const subCategories = [
  { label: "Electronics", value: "electronics" },
  { label: "Clothing", value: "clothing" },
  { label: "Furniture", value: "furniture" },
  { label: "Other", value: "other" },
];

const brands = [
  { label: "Electronics", value: "electronics" },
  { label: "Clothing", value: "clothing" },
  { label: "Furniture", value: "furniture" },
  { label: "Other", value: "other" },
];

const formSchema = z.object({
  name: z.string().min(1).min(3),
  slug: z.string().optional(),
  sku: z.string().min(1).min(3).optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
});

type ProductInformationProps = {
  onChange?: (values: ProductInformationForm) => void;
};

export default function MyForm({ onChange }: ProductInformationProps) {
  const form = useForm<ProductInformationForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      category: "",
      subCategory: "",
      brand: "",
      unit: "",
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
                    <Input placeholder="Product name" type="text" {...field} />
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
                      {categories.map((category) => (
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
                      {subCategories.map((subCategory) => (
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
                      {brands.map((brand) => (
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
