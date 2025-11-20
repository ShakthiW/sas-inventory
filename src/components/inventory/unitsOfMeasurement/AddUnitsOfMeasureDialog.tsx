"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { UnitOfMeasureCreatePayload, UnitSortField } from "@/lib/types";

const formSchema = z
  .object({
    name: z.string().min(1).min(2),
    shortName: z.string().optional(),
    kind: z.enum(["base", "pack"]),
    isActive: z.boolean().default(true),
    baseUnitId: z.string().optional(),
    unitsPerPack: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (v) =>
      v.kind === "base" ||
      (v.kind === "pack" && !!v.baseUnitId && !!v.unitsPerPack),
    { message: "Pack units require base unit and quantity" }
  );

type AddUnitsOfMeasureDialogProps = { onCreated?: () => void };

export default function AddUnitsOfMeasureDialog({
  onCreated,
}: AddUnitsOfMeasureDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [baseUnits, setBaseUnits] = React.useState<
    Array<{ id: string; name: string }>
  >([]);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      shortName: "",
      kind: "base",
      isActive: true,
      baseUnitId: "",
      unitsPerPack: undefined,
    },
  });

  const kindWatch = form.watch("kind");

  const loadBaseUnits = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        sort: "name" as UnitSortField,
        dir: "asc",
        page: "1",
        limit: "200",
      });
      const res = await fetch(`/api/inventory/units?${params.toString()}`);
      const json: {
        data?: Array<{
          id?: string;
          _id?: string;
          name: string;
          kind: string;
        }>;
      } = await res.json();
      const opts = (json.data || [])
        .filter((u) => u.kind === "base")
        .map((u) => ({ id: (u.id || u._id || "") as string, name: u.name }));
      setBaseUnits(opts);
    } catch {
      setBaseUnits([]);
    }
  }, []);

  React.useEffect(() => {
    loadBaseUnits();
  }, [loadBaseUnits]);

  React.useEffect(() => {
    if (open) {
      // refresh base units whenever dialog opens
      loadBaseUnits();
    }
  }, [open, loadBaseUnits]);

  async function onSubmit(values: z.input<typeof formSchema>) {
    if (saving) return;
    setSaving(true);
    try {
      const payload = values as UnitOfMeasureCreatePayload;
      const res = await fetch("/api/inventory/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          (body as { error?: string }).error ?? "Failed to create unit";
        throw new Error(message);
      }
      const created = body as { insertedId?: string };
      if (values.kind === "base" && created?.insertedId) {
        // Optimistically add to baseUnits so it's immediately selectable
        setBaseUnits((prev) => [
          ...prev,
          { id: created.insertedId as string, name: values.name },
        ]);
      }
      toast.success("Unit created");
      setOpen(false);
      form.reset();
      onCreated?.();
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Could not create unit"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Add Unit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Unit of Measure</DialogTitle>
          <DialogDescription>
            Define a base unit or a pack of base units.
          </DialogDescription>
        </DialogHeader>

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
                    >
                      <label className="inline-flex items-center gap-2">
                        <RadioGroupItem value="base" />
                        <span>Base unit</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <RadioGroupItem value="pack" />
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                          value={
                            (field.value as unknown as number | string) ?? ""
                          }
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

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Unit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
