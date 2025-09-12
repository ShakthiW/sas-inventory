"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { CategorySortField, SubCategoryCreatePayload } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(1).min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  parentCategoryId: z.string().min(1),
});

type AddSubCategoryDialogProps = { onCreated?: () => void };

function slugify(input: string) {
  return input
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AddSubCategoryDialog({
  onCreated,
}: AddSubCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true,
      parentCategoryId: "",
    },
  });

  const nameWatch = form.watch("name");
  React.useEffect(() => {
    const s = slugify(nameWatch || "");
    form.setValue("slug", s);
  }, [nameWatch, form]);

  // load categories for parent select
  React.useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams({
          sort: "name" as CategorySortField,
          dir: "asc",
          page: "1",
          limit: "200",
        });
        const res = await fetch(
          `/api/inventory/categories?${params.toString()}`
        );
        const json: {
          data?: Array<{ id?: string; _id?: string; name: string }>;
        } = await res.json();
        const opts = (json.data || []).map((c) => ({
          id: (c.id || c._id || "") as string,
          name: c.name,
        }));
        setCategories(opts);
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  async function onSubmit(values: z.input<typeof formSchema>) {
    try {
      const payload = values as SubCategoryCreatePayload;
      const res = await fetch("/api/inventory/categories/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create sub category");
      toast.success("Sub category created");
      setOpen(false);
      form.reset();
      onCreated?.();
    } catch (e) {
      console.error(e);
      toast.error("Could not create sub category");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Add Sub Category</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Sub Category</DialogTitle>
          <DialogDescription>
            Create a new product sub category.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Smartphones" {...field} />
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
                  <FormControl>
                    <Input disabled placeholder="auto-generated" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
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
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="subcat-active"
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                    <Label
                      htmlFor="subcat-active"
                      className="cursor-pointer select-none"
                    >
                      Active sub category
                    </Label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save Sub Category</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
