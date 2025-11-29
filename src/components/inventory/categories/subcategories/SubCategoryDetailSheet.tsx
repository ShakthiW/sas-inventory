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
import {
  SubCategoryForm,
  type SubCategoryFormValues,
  useSubCategoryForm,
} from "./SubCategoryForm";

type SubCategoryDetailSheetProps = {
  subCategoryId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

type SubCategoryDetail = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  parentCategoryId: string;
  parentCategoryName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CategoryOption = {
  id: string;
  name: string;
};

export default function SubCategoryDetailSheet({
  subCategoryId,
  open,
  onOpenChange,
  onUpdated,
}: SubCategoryDetailSheetProps) {
  const [detail, setDetail] = React.useState<SubCategoryDetail | null>(null);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const form = useSubCategoryForm();

  // Fetch categories for parent select
  const fetchCategories = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        sort: "name",
        dir: "asc",
        page: "1",
        limit: "200",
      });
      const res = await fetch(`/api/inventory/categories?${params.toString()}`);
      const json: {
        data?: Array<{ id?: string; _id?: string; name: string }>;
      } = await res.json();
      const opts: CategoryOption[] = (json.data || [])
        .map((c) => ({
          id: (c.id || c._id || "") as string,
          name: c.name,
        }))
        .filter((c) => c.id);
      setCategories(opts);
    } catch {
      setCategories([]);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchDetail = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/inventory/categories/subcategories/${id}`);
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to load subcategory. Please try again.";
          throw new Error(message);
        }
        const json = await res.json();
        const nextDetail: SubCategoryDetail = {
          id: json.id ?? id,
          name: json.name ?? "",
          slug:
            json.slug === undefined || json.slug === null
              ? null
              : String(json.slug),
          description:
            json.description === undefined || json.description === null
              ? null
              : String(json.description),
          parentCategoryId: json.parentCategoryId ?? "",
          parentCategoryName: json.parentCategoryName ?? null,
          createdAt: json.createdAt ?? null,
          updatedAt: json.updatedAt ?? null,
        };
        setDetail(nextDetail);
        form.reset({
          name: nextDetail.name,
          slug: nextDetail.slug ?? "",
          description: nextDetail.description ?? "",
          parentCategoryId: nextDetail.parentCategoryId,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load subcategory. Please try again.";
        setError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  React.useEffect(() => {
    if (open && subCategoryId) {
      setEditing(false);
      void fetchDetail(subCategoryId);
    }
    if (!open) {
      setEditing(false);
      setDetail(null);
      setError(null);
      setSaving(false);
      form.reset();
    }
  }, [open, subCategoryId, fetchDetail, form]);

  const handleSubmit = React.useCallback(
    async (values: SubCategoryFormValues) => {
      if (!subCategoryId) return;
      setSaving(true);
      try {
        const res = await fetch(
          `/api/inventory/categories/subcategories/${subCategoryId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          }
        );
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to update subcategory. Please try again.";
          throw new Error(message);
        }
        toast.success("Subcategory updated");
        await fetchDetail(subCategoryId);
        setEditing(false);
        onUpdated?.();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update subcategory. Please try again.";
        toast.error(message);
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
    [subCategoryId, fetchDetail, onUpdated]
  );

  const handleCancelEdit = React.useCallback(() => {
    if (detail) {
      form.reset({
        name: detail.name,
        slug: detail.slug ?? "",
        description: detail.description ?? "",
        parentCategoryId: detail.parentCategoryId,
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
            {editing ? "Edit subcategory" : "Subcategory details"}
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
              onClick={() => subCategoryId && fetchDetail(subCategoryId)}
            >
              Retry
            </Button>
          </div>
        ) : detail ? (
          editing ? (
            <>
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle>Edit Subcategory</SheetTitle>
                <SheetDescription>
                  Update the subcategory information below.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <SubCategoryForm
                  form={form}
                  categories={categories}
                  saving={saving}
                  submitLabel="Save Changes"
                  onSubmit={handleSubmit}
                  onCancel={handleCancelEdit}
                  autoSlug={false}
                  allowSlugEditing
                  allowSlugRegenerate
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
                  {detail.slug ? `Slug: ${detail.slug}` : "No slug defined"}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="grid gap-4 text-sm">
                  <DetailItem label="Parent Category">
                    {detail.parentCategoryName ?? "—"}
                  </DetailItem>
                  <DetailItem label="Description">
                    {detail.description ? detail.description : "—"}
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
                  Edit Subcategory
                </Button>
              </div>
            </>
          )
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Select a subcategory to view details.
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
