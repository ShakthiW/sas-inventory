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
import { Textarea } from "@/components/ui/textarea";
import type { CategoryCreatePayload } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(1).min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type AddCategoryDialogProps = { onCreated?: () => void };

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

export default function AddCategoryDialog({
  onCreated,
}: AddCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [subName, setSubName] = React.useState("");
  const [subNames, setSubNames] = React.useState<string[]>([]);
  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", slug: "", description: "", isActive: true },
  });

  const nameWatch = form.watch("name");
  React.useEffect(() => {
    const s = slugify(nameWatch || "");
    form.setValue("slug", s);
  }, [nameWatch, form]);

  async function onSubmit(values: z.input<typeof formSchema>) {
    try {
      const payload = values as CategoryCreatePayload;
      const res = await fetch("/api/inventory/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create category");
      const created = (await res.json()) as { insertedId?: string };

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
      toast.error("Could not create category");
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
                  <FormControl>
                    <Input disabled placeholder="auto-generated" {...field} />
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
                      id="cat-active"
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                    <Label
                      htmlFor="cat-active"
                      className="cursor-pointer select-none"
                    >
                      Active category
                    </Label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional sub-categories */}
            <div className="grid gap-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <FormLabel className="mb-2">Add Sub Categories (optional)</FormLabel>
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
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save Category</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
