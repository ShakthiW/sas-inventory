"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PricingStockForm } from "@/lib/types";
import {
  Form,
  FormControl,
  FormDescription,
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
import React from "react";

const formSchema = z.object({
  quantity: z.number().min(0).optional(),
  qtyAlert: z.number().min(0).optional(),
  price: z.number().optional(),
  warehouse: z.enum(["warehouse-1", "warehouse-2"]).optional(),
});

type PricingStockProps = {
  onChange?: (values: PricingStockForm) => void;
};

export default function MyForm({ onChange }: PricingStockProps) {
  const form = useForm<PricingStockForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: undefined,
      qtyAlert: undefined,
      price: undefined,
      warehouse: "warehouse-1",
    },
  });

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

  // Lift values up when they change
  React.useEffect(() => {
    if (!onChange) return;
    const subscription = form.watch((values) => {
      onChange(values as PricingStockForm);
    });
    onChange(form.getValues());
    return () => subscription.unsubscribe();
  }, [form, onChange]);

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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (Pieces)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Quantity"
                      type="number"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-6">
            <FormField
              control={form.control}
              name="warehouse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="warehouse-1">Main Warehouse</SelectItem>
                      <SelectItem value="warehouse-2">Secondary Warehouse</SelectItem>
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
              name="qtyAlert"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Alert</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Quantity"
                      type="number"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Alert user when the stocks reach this thresold
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (LKR)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Price"
                      type="number"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        {/* <Button type="submit">Submit</Button> */}
      </form>
    </Form>
  );
}
