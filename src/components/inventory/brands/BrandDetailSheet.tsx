"use client";

import React from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";

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
  BrandForm,
  type BrandFormValues,
  useBrandForm,
} from "./BrandForm";

type BrandDetailSheetProps = {
  brandId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

type BrandDetail = {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export default function BrandDetailSheet({
  brandId,
  open,
  onOpenChange,
  onUpdated,
}: BrandDetailSheetProps) {
  const [detail, setDetail] = React.useState<BrandDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const form = useBrandForm();

  const fetchDetail = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/inventory/brands/${id}`);
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to load brand. Please try again.";
          throw new Error(message);
        }
        const json = await res.json();
        const nextDetail: BrandDetail = {
          id: json.id ?? id,
          name: json.name ?? "",
          description:
            json.description === undefined || json.description === null
              ? null
              : String(json.description),
          logoUrl:
            json.logoUrl === undefined || json.logoUrl === null
              ? null
              : String(json.logoUrl),
          isActive: json.isActive ?? true,
          createdAt: json.createdAt ?? null,
          updatedAt: json.updatedAt ?? null,
        };
        setDetail(nextDetail);
        form.reset({
          name: nextDetail.name,
          description: nextDetail.description ?? "",
          logoUrl: nextDetail.logoUrl ?? "",
          isActive: nextDetail.isActive,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load brand. Please try again.";
        setError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  React.useEffect(() => {
    if (open && brandId) {
      setEditing(false);
      void fetchDetail(brandId);
    }
    if (!open) {
      setEditing(false);
      setDetail(null);
      setError(null);
      setSaving(false);
      form.reset();
    }
  }, [open, brandId, fetchDetail, form]);

  const handleSubmit = React.useCallback(
    async (values: BrandFormValues) => {
      if (!brandId) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/inventory/brands/${brandId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to update brand. Please try again.";
          throw new Error(message);
        }
        toast.success("Brand updated");
        await fetchDetail(brandId);
        setEditing(false);
        onUpdated?.();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update brand. Please try again.";
        toast.error(message);
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
    [brandId, fetchDetail, onUpdated]
  );

  const handleCancelEdit = React.useCallback(() => {
    if (detail) {
      form.reset({
        name: detail.name,
        description: detail.description ?? "",
        logoUrl: detail.logoUrl ?? "",
        isActive: detail.isActive,
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
            {editing ? "Edit brand" : "Brand details"}
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
              onClick={() => brandId && fetchDetail(brandId)}
            >
              Retry
            </Button>
          </div>
        ) : detail ? (
          editing ? (
            <>
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle>Edit Brand</SheetTitle>
                <SheetDescription>
                  Update the brand information below.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <BrandForm
                  form={form}
                  saving={saving}
                  submitLabel="Save Changes"
                  onSubmit={handleSubmit}
                  onCancel={handleCancelEdit}
                />
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="border-b px-4 py-4">
                <div className="flex items-center gap-4">
                  {detail.logoUrl && (
                    <div className="relative size-12 overflow-hidden rounded-md border">
                      <Image
                        src={detail.logoUrl}
                        alt={detail.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <SheetTitle className="text-lg font-semibold">
                      {detail.name}
                    </SheetTitle>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </span>
                  <ActiveStatusBadge active={detail.isActive} />
                </div>
                <div className="grid gap-4 text-sm">
                  <DetailItem label="Description">
                    {detail.description ? detail.description : "—"}
                  </DetailItem>
                  <DetailItem label="Logo URL">
                    {detail.logoUrl ? (
                      <a
                        href={detail.logoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {detail.logoUrl}
                      </a>
                    ) : (
                      "—"
                    )}
                  </DetailItem>
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
                  Edit Brand
                </Button>
              </div>
            </>
          )
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Select a brand to view details.
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
