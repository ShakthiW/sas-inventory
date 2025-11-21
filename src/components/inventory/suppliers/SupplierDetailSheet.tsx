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
  SupplierForm,
  type SupplierFormValues,
  useSupplierForm,
} from "./SupplierForm";

type SupplierDetailSheetProps = {
  supplierId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

type SupplierDetail = {
  id: string;
  supplierType: "individual" | "company";
  name: string;
  code: string;
  isActive: boolean;
  phone?: string | null;
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export default function SupplierDetailSheet({
  supplierId,
  open,
  onOpenChange,
  onUpdated,
}: SupplierDetailSheetProps) {
  const [detail, setDetail] = React.useState<SupplierDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const form = useSupplierForm();

  const fetchDetail = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/inventory/suppliers/${id}`);
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to load supplier. Please try again.";
          throw new Error(message);
        }
        const json = await res.json();
        const nextDetail: SupplierDetail = {
          id: json.id ?? id,
          supplierType: json.supplierType ?? "individual",
          name: json.name ?? "",
          code: json.code ?? "",
          isActive: json.isActive ?? true,
          phone:
            json.phone === undefined || json.phone === null
              ? null
              : String(json.phone),
          contactPersonName:
            json.contactPersonName === undefined
              ? null
              : json.contactPersonName,
          contactPersonPhone:
            json.contactPersonPhone === undefined
              ? null
              : json.contactPersonPhone,
          createdAt: json.createdAt ?? null,
          updatedAt: json.updatedAt ?? null,
        };
        setDetail(nextDetail);
        form.reset({
          supplierType: nextDetail.supplierType,
          name: nextDetail.name,
          code: nextDetail.code,
          isActive: nextDetail.isActive,
          phone: nextDetail.phone ?? "",
          contactPersonName: nextDetail.contactPersonName ?? "",
          contactPersonPhone: nextDetail.contactPersonPhone ?? "",
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load supplier. Please try again.";
        setError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  React.useEffect(() => {
    if (open && supplierId) {
      setEditing(false);
      void fetchDetail(supplierId);
    }
    if (!open) {
      setEditing(false);
      setDetail(null);
      setError(null);
      setSaving(false);
      form.reset();
    }
  }, [open, supplierId, fetchDetail, form]);

  const handleSubmit = React.useCallback(
    async (values: SupplierFormValues) => {
      if (!supplierId) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/inventory/suppliers/${supplierId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to update supplier. Please try again.";
          throw new Error(message);
        }
        toast.success("Supplier updated");
        await fetchDetail(supplierId);
        setEditing(false);
        onUpdated?.();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update supplier. Please try again.";
        toast.error(message);
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
    [supplierId, fetchDetail, onUpdated]
  );

  const handleCancelEdit = React.useCallback(() => {
    if (detail) {
      form.reset({
        supplierType: detail.supplierType,
        name: detail.name,
        code: detail.code,
        isActive: detail.isActive,
        phone: detail.phone ?? "",
        contactPersonName: detail.contactPersonName ?? "",
        contactPersonPhone: detail.contactPersonPhone ?? "",
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

  const formatSupplierType = (value: SupplierDetail["supplierType"]) =>
    value === "company" ? "Company" : "Individual";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="sr-only">
          <SheetTitle>
            {editing ? "Edit supplier" : "Supplier details"}
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
              onClick={() => supplierId && fetchDetail(supplierId)}
            >
              Retry
            </Button>
          </div>
        ) : detail ? (
          editing ? (
            <>
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle>Edit Supplier</SheetTitle>
                <SheetDescription>
                  Update the supplier information below.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <SupplierForm
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
                <SheetTitle className="text-lg font-semibold">
                  {detail.name}
                </SheetTitle>
                <SheetDescription>
                  Supplier code {detail.code}
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
                  <DetailItem label="Supplier Type">
                    {formatSupplierType(detail.supplierType)}
                  </DetailItem>
                  <DetailItem label="Phone">
                    {detail.phone ? detail.phone : "—"}
                  </DetailItem>
                  {detail.supplierType === "company" && (
                    <>
                      <DetailItem label="Contact Person Name">
                        {detail.contactPersonName
                          ? detail.contactPersonName
                          : "—"}
                      </DetailItem>
                      <DetailItem label="Contact Person Phone">
                        {detail.contactPersonPhone
                          ? detail.contactPersonPhone
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
                  Edit Supplier
                </Button>
              </div>
            </>
          )
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Select a supplier to view details.
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


