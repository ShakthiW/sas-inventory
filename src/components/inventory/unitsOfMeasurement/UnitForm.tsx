"use client";

import React from "react";
import { z } from "zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

export const unitFormSchema = z
  .object({
    name: z.string().min(1, "Unit name is required").min(2),
    shortName: z.string().optional(),
    kind: z.enum(["base", "pack"]),
    isActive: z.boolean(),
    baseUnitId: z.string().optional(),
    unitsPerPack: z.number().int().positive().optional(),
  })
  .refine(
    (v) =>
      v.kind === "base" ||
      (v.kind === "pack" && !!v.baseUnitId && !!v.unitsPerPack),
    { message: "Pack units require base unit and quantity" }
  );

export type UnitFormValues = z.infer<typeof unitFormSchema>;

export function useUnitForm(
  defaultValues?: Partial<UnitFormValues>
): UseFormReturn<UnitFormValues> {
  return useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      name: "",
      shortName: "",
      kind: "base",
      isActive: true,
      baseUnitId: "",
      unitsPerPack: undefined,
      ...defaultValues,
    },
  });
}

type BaseUnit = {
  id: string;
  name: string;
};

type UnitFormProps = {
  form: UseFormReturn<UnitFormValues>;
  onSubmit: (values: UnitFormValues) => void | Promise<void>;
  baseUnits: BaseUnit[];
  saving?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  allowKindChange?: boolean;
};

export function UnitForm({
  form,
  onSubmit,
  baseUnits,
  saving = false,
  submitLabel = "Save Unit",
  cancelLabel = "Cancel",
  onCancel,
  allowKindChange = true,
}: UnitFormProps) {
  const kindWatch = form.watch("kind");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Piece, Box" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shortName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. pc, box" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-3"
                  disabled={!allowKindChange}
                >
                  <label className="inline-flex items-center gap-2">
                    <RadioGroupItem value="base" disabled={!allowKindChange} />
                    <span>Base unit</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <RadioGroupItem value="pack" disabled={!allowKindChange} />
                    <span>Pack</span>
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {kindWatch === "pack" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="baseUnitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Unit</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select base unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {baseUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
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
              name="unitsPerPack"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Units per Pack</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="e.g. 12"
                      value={(field.value as unknown as number | string) ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="uom-active"
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                />
                <Label
                  htmlFor="uom-active"
                  className="cursor-pointer select-none"
                >
                  Active
                </Label>
              </div>
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
