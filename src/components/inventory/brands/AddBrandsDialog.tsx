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
import type { BrandCreatePayload } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(1).min(2),
  description: z.string().optional(),
  logoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isActive: z.boolean().default(true),
});

type AddBrandsDialogProps = { onCreated?: () => void };

export default function AddBrandsDialog({ onCreated }: AddBrandsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", logoUrl: "", isActive: true },
  });

  async function onSubmit(values: z.input<typeof formSchema>) {
    try {
      const payload: BrandCreatePayload = {
        name: values.name,
        description: values.description,
        isActive: values.isActive ?? true,
        logoUrl:
          values.logoUrl && values.logoUrl.trim() !== ""
            ? values.logoUrl
            : undefined,
      };
      const res = await fetch("/api/inventory/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create brand");
      toast.success("Brand created");
      setOpen(false);
      form.reset();
      onCreated?.();
    } catch (e) {
      console.error(e);
      toast.error("Could not create brand");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Add Brand</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Brand</DialogTitle>
          <DialogDescription>Create a new brand.</DialogDescription>
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
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save Brand</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
