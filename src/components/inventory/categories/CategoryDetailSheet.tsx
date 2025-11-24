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
  CategoryForm,
  type CategoryFormValues,
  useCategoryForm,
} from "./CategoryForm";

type CategoryDetailSheetProps = {
  categoryId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

type SubCategoryInfo = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
};

type CategoryDetail = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  subCategories: SubCategoryInfo[];
};

export default function CategoryDetailSheet({
  categoryId,
  open,
  onOpenChange,
  onUpdated,
}: CategoryDetailSheetProps) {
  const [detail, setDetail] = React.useState<CategoryDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const form = useCategoryForm();

  const fetchDetail = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/inventory/categories/${id}`);
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to load category. Please try again.";
          throw new Error(message);
        }
        const json = await res.json();
        const nextDetail: CategoryDetail = {
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
          isActive: json.isActive ?? true,
          createdAt: json.createdAt ?? null,
          updatedAt: json.updatedAt ?? null,
          subCategories: Array.isArray(json.subCategories)
            ? (json.subCategories as SubCategoryInfo[]).map((sub) => ({
                id: sub.id ?? "",
                name: sub.name ?? "",
                slug:
                  sub.slug === undefined || sub.slug === null
                    ? null
                    : String(sub.slug),
                description:
                  sub.description === undefined || sub.description === null
                    ? null
                    : String(sub.description),
              }))
            : [],
        };
        setDetail(nextDetail);
        form.reset({
          name: nextDetail.name,
          slug: nextDetail.slug ?? "",
          description: nextDetail.description ?? "",
          isActive: nextDetail.isActive,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load category. Please try again.";
        setError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  React.useEffect(() => {
    if (open && categoryId) {
      setEditing(false);
      void fetchDetail(categoryId);
    }
    if (!open) {
      setEditing(false);
      setDetail(null);
      setError(null);
      setSaving(false);
      form.reset();
    }
  }, [open, categoryId, fetchDetail, form]);

  const handleSubmit = React.useCallback(
    async (values: CategoryFormValues) => {
      if (!categoryId) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/inventory/categories/${categoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to update category. Please try again.";
          throw new Error(message);
        }
        toast.success("Category updated");
        await fetchDetail(categoryId);
        setEditing(false);
        onUpdated?.();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update category. Please try again.";
        toast.error(message);
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
    [categoryId, fetchDetail, onUpdated]
  );

  const handleCancelEdit = React.useCallback(() => {
    if (detail) {
      form.reset({
        name: detail.name,
        slug: detail.slug ?? "",
        description: detail.description ?? "",
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
            {editing ? "Edit category" : "Category details"}
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
              onClick={() => categoryId && fetchDetail(categoryId)}
            >
              Retry
            </Button>
          </div>
        ) : detail ? (
          editing ? (
            <>
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle>Edit Category</SheetTitle>
                <SheetDescription>
                  Update the category information below.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <CategoryForm
                  form={form}
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
                  <DetailItem label="Created At">
                    {formatDate(detail.createdAt)}
                  </DetailItem>
                  <DetailItem label="Updated At">
                    {formatDate(detail.updatedAt)}
                  </DetailItem>
                  <div className="grid gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Subcategories
                    </span>
                    {detail.subCategories.length > 0 ? (
                      <div className="grid gap-2">
                        {detail.subCategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                          >
                            <div className="font-medium text-foreground">
                              {sub.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sub.slug ? `Slug: ${sub.slug}` : "No slug"}
                            </div>
                            {sub.description ? (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {sub.description}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-base font-medium text-foreground">
                        —
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t px-4 py-4">
                <Button onClick={() => setEditing(true)} className="w-full">
                  Edit Category
                </Button>
              </div>
            </>
          )
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Select a category to view details.
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


