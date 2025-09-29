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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

type Option = { label: string; value: string };

const productTypes = [
  { label: "Single Product", value: "single-product" },
  { label: "Variable Product", value: "variable-product" },
  { label: "Bundle Product", value: "bundle-product" },
];

const formSchema = z.object({
  productType: z
    .enum(["single-product", "variable-product", "bundle-product"]) // matches ProductType
    .optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  qtyAlert: z.number().min(0).optional(),
  price: z.number().optional(),
});

type PricingStockProps = {
  onChange?: (values: PricingStockForm) => void;
};

export default function MyForm({ onChange }: PricingStockProps) {
  const [unitOptions, setUnitOptions] = React.useState<Option[]>([]);
  const form = useForm<PricingStockForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productType: undefined,
      quantity: undefined,
      unit: "",
      qtyAlert: undefined,
      price: undefined,
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

  // Fetch units once
  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch(
          "/api/inventory/units?limit=200&sort=name&dir=asc"
        );
        const json = await res.json();
        type UnitRow = {
          id?: string;
          _id?: string;
          name: string;
          shortName?: string;
        };
        const units: Option[] = ((json?.data as UnitRow[]) || []).map((u) => ({
          value: u.name,
          label: u.shortName ? `${u.name} (${u.shortName})` : u.name,
        }));
        if (mounted) setUnitOptions(units);
      } catch {
        // ignore
      } finally {
        // no-op
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 mx-auto"
      >
        <FormField
          control={form.control}
          name="productType"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Product Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4"
                >
                  {productTypes.map((option, index) => (
                    <FormItem
                      className="flex items-center space-y-0"
                      key={index}
                    >
                      <FormControl>
                        <RadioGroupItem value={option.value} />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {option.label}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
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
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the Unit of Measure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
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
