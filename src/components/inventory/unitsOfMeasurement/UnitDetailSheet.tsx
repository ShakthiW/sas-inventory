"use client";

import React from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ActiveStatusBadge from "@/components/ActiveStatusBadge";
import {
  UnitForm,
  type UnitFormValues,
  useUnitForm,
} from "./UnitForm";

type UnitDetailSheetProps = {
  unitId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

type UnitDetail = {
  id: string;
  name: string;
  shortName?: string | null;
  kind: "base" | "pack";
  isActive: boolean;
  baseUnitId?: string | null;
  baseUnitName?: string | null;
  unitsPerPack?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type BaseUnit = {
  id: string;
  name: string;
};

export default function UnitDetailSheet({
  unitId,
  open,
  onOpenChange,
  onUpdated,
}: UnitDetailSheetProps) {
  const [detail, setDetail] = React.useState<UnitDetail | null>(null);
  const [baseUnits, setBaseUnits] = React.useState<BaseUnit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const form = useUnitForm();

  // Fetch base units for pack unit selection
  const fetchBaseUnits = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        sort: "name",
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
      const opts: BaseUnit[] = (json.data || [])
        .filter((u) => u.kind === "base")
        .map((u) => ({ id: (u.id || u._id || "") as string, name: u.name }))
        .filter((u) => u.id);
      setBaseUnits(opts);
    } catch {
      setBaseUnits([]);
    }
  }, []);

  React.useEffect(() => {
    fetchBaseUnits();
  }, [fetchBaseUnits]);

  const fetchDetail = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/inventory/units/${id}`);
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to load unit. Please try again.";
          throw new Error(message);
        }
        const json = await res.json();
        const nextDetail: UnitDetail = {
          id: json.id ?? id,
          name: json.name ?? "",
          shortName:
            json.shortName === undefined || json.shortName === null
              ? null
              : String(json.shortName),
          kind: json.kind === "pack" ? "pack" : "base",
          isActive: json.isActive ?? true,
          baseUnitId: json.baseUnitId ?? null,
          baseUnitName: json.baseUnitName ?? null,
          unitsPerPack: json.unitsPerPack ?? null,
          createdAt: json.createdAt ?? null,
          updatedAt: json.updatedAt ?? null,
        };
        setDetail(nextDetail);
        form.reset({
          name: nextDetail.name,
          shortName: nextDetail.shortName ?? "",
          kind: nextDetail.kind,
          isActive: nextDetail.isActive,
          baseUnitId: nextDetail.baseUnitId ?? "",
          unitsPerPack: nextDetail.unitsPerPack ?? undefined,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load unit. Please try again.";
        setError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  React.useEffect(() => {
    if (open && unitId) {
      setEditing(false);
      void fetchDetail(unitId);
    }
    if (!open) {
      setEditing(false);
      setDetail(null);
      setError(null);
      setSaving(false);
      form.reset();
    }
  }, [open, unitId, fetchDetail, form]);

  const handleSubmit = React.useCallback(
    async (values: UnitFormValues) => {
      if (!unitId) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/inventory/units/${unitId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to update unit. Please try again.";
          throw new Error(message);
        }
        toast.success("Unit updated");
        await fetchDetail(unitId);
        setEditing(false);
        onUpdated?.();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update unit. Please try again.";
        toast.error(message);
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
    [unitId, fetchDetail, onUpdated]
  );

  const handleCancelEdit = React.useCallback(() => {
    if (detail) {
      form.reset({
        name: detail.name,
        shortName: detail.shortName ?? "",
        kind: detail.kind,
        isActive: detail.isActive,
        baseUnitId: detail.baseUnitId ?? "",
        unitsPerPack: detail.unitsPerPack ?? undefined,
      });
    }
    setEditing(false);
  }, [detail, form]);

  const formatDate = React.useCallback((value?: string | null) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="sr-only">
          <SheetTitle>
            {editing ? "Edit unit" : "Unit details"}
          </SheetTitle>
        </SheetHeader>
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
            <div className="text-sm text-muted-foreground">{error}</div>
            <Button
              variant="outline"
              onClick={() => unitId && fetchDetail(unitId)}
            >
              Retry
            </Button>
          </div>
        ) : detail ? (
          editing ? (
            <>
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle>Edit Unit</SheetTitle>
                <SheetDescription>
                  Update the unit of measure information below.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <UnitForm
                  form={form}
                  baseUnits={baseUnits}
                  saving={saving}
                  submitLabel="Save Changes"
                  onSubmit={handleSubmit}
                  onCancel={handleCancelEdit}
                  allowKindChange={false}
                />
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle className="text-lg font-semibold">
                  {detail.name}
                  {detail.shortName && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({detail.shortName})
                    </span>
                  )}
                </SheetTitle>
                <SheetDescription className="capitalize">
                  {detail.kind} unit
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </span>
                  <ActiveStatusBadge active={detail.isActive} />
                </div>
                <div className="grid gap-4 text-sm">
                  <DetailItem label="Type">
                    <span className="capitalize">{detail.kind}</span>
                  </DetailItem>
                  {detail.kind === "pack" && (
                    <>
                      <DetailItem label="Base Unit">
                        {detail.baseUnitName ?? "—"}
                      </DetailItem>
                      <DetailItem label="Units per Pack">
                        {typeof detail.unitsPerPack === "number"
                          ? detail.unitsPerPack
                          : "—"}
                      </DetailItem>
                    </>
                  )}
                  <DetailItem label="Created At">
                    {formatDate(detail.createdAt)}
                  </DetailItem>
                  <DetailItem label="Updated At">
                    {formatDate(detail.updatedAt)}
                  </DetailItem>
                </div>
              </div>
              <div className="border-t px-4 py-4">
                <Button onClick={() => setEditing(true)} className="w-full">
                  Edit Unit
                </Button>
              </div>
            </>
          )
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Select a unit to view details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

type DetailItemProps = {
  label: string;
  children: React.ReactNode;
};

function DetailItem({ label, children }: DetailItemProps) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-base font-medium text-foreground">{children}</span>
    </div>
  );
}
