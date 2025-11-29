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
import { Badge } from "@/components/ui/badge";
import {
  ProductForm,
  type ProductFormValues,
  useProductForm,
} from "./ProductForm";

type ProductDetailSheetProps = {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

type ProductDetail = {
  id: string;
  name: string;
  slug?: string | null;
  sku?: string | null;
  category?: string | null;
  categoryName?: string | null;
  subCategory?: string | null;
  subCategoryName?: string | null;
  brand?: string | null;
  brandName?: string | null;
  unit?: string | null;
  unitName?: string | null;
  description?: string | null;
  price?: number | null;
  quantity?: number | null;
  qtyAlert?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type Option = {
  id: string;
  name: string;
};

export default function ProductDetailSheet({
  productId,
  open,
  onOpenChange,
  onUpdated,
}: ProductDetailSheetProps) {
  const [detail, setDetail] = React.useState<ProductDetail | null>(null);
  const [categories, setCategories] = React.useState<Option[]>([]);
  const [subcategories, setSubcategories] = React.useState<Option[]>([]);
  const [brands, setBrands] = React.useState<Option[]>([]);
  const [units, setUnits] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const form = useProductForm();

  // Fetch dropdown options
  const fetchOptions = React.useCallback(async () => {
    try {
      const [catRes, brandRes, unitRes] = await Promise.all([
        fetch("/api/inventory/categories?limit=200&sort=name&dir=asc"),
        fetch("/api/inventory/brands?limit=200&sort=name&dir=asc"),
        fetch("/api/inventory/units?limit=200&sort=name&dir=asc"),
      ]);
      const [catJson, brandJson, unitJson] = await Promise.all([
        catRes.json(),
        brandRes.json(),
        unitRes.json(),
      ]);
      
      const cats: Option[] = ((catJson?.data || []) as Array<{id?: string; _id?: string; name: string}>)
        .map((c) => ({ id: (c.id || c._id || "") as string, name: c.name }))
        .filter((c) => c.id);
        
      const brandsData: Option[] = ((brandJson?.data || []) as Array<{id?: string; _id?: string; name: string}>)
        .map((b) => ({ id: (b.id || b._id || "") as string, name: b.name }))
        .filter((b) => b.id);
        
      const unitsData: Option[] = ((unitJson?.data || []) as Array<{id?: string; _id?: string; name: string}>)
        .map((u) => ({ id: (u.id || u._id || "") as string, name: u.name }))
        .filter((u) => u.id);

      setCategories(cats);
      setBrands(brandsData);
      setUnits(unitsData);
    } catch {
      // Silently handle errors
    }
  }, []);

  // Fetch subcategories when category changes in edit mode
  const categoryWatch = form.watch("category");
  React.useEffect(() => {
    if (!editing || !categoryWatch) {
      setSubcategories([]);
      return;
    }
    
    let mounted = true;
    const fetchSubs = async () => {
      try {
        const res = await fetch(
          `/api/inventory/categories/subcategories?limit=200&sort=name&dir=asc&parent=${encodeURIComponent(categoryWatch)}`
        );
        const json = await res.json();
        const subs: Option[] = ((json?.data || []) as Array<{id?: string; _id?: string; name: string}>)
          .map((s) => ({ id: (s.id || s._id || "") as string, name: s.name }))
          .filter((s) => s.id);
        if (mounted) setSubcategories(subs);
      } catch {
        if (mounted) setSubcategories([]);
      }
    };
    fetchSubs();
    return () => { mounted = false; };
  }, [categoryWatch, editing]);

  React.useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const fetchDetail = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/inventory/products/${id}`);
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to load product. Please try again.";
          throw new Error(message);
        }
        const json = await res.json();
        const nextDetail: ProductDetail = {
          id: json.id ?? id,
          name: json.name ?? "",
          slug: json.slug ?? null,
          sku: json.sku ?? null,
          category: json.category ?? null,
          categoryName: json.categoryName ?? null,
          subCategory: json.subCategory ?? null,
          subCategoryName: json.subCategoryName ?? null,
          brand: json.brand ?? null,
          brandName: json.brandName ?? null,
          unit: json.unit ?? null,
          unitName: json.unitName ?? null,
          description: json.description ?? null,
          price: json.pricing?.price ?? null,
          quantity: json.pricing?.quantity ?? null,
          qtyAlert: json.pricing?.qtyAlert ?? null,
          createdAt: json.createdAt ?? null,
          updatedAt: json.updatedAt ?? null,
        };
        setDetail(nextDetail);
        form.reset({
          name: nextDetail.name,
          slug: nextDetail.slug ?? "",
          sku: nextDetail.sku ?? "",
          category: nextDetail.category ?? "",
          subCategory: nextDetail.subCategory ?? "",
          brand: nextDetail.brand ?? "",
          unit: nextDetail.unit ?? "",
          description: nextDetail.description ?? "",
          price: nextDetail.price ?? undefined,
          quantity: nextDetail.quantity ?? undefined,
          qtyAlert: nextDetail.qtyAlert ?? undefined,
        });
        
        // Fetch subcategories if category exists
        if (nextDetail.category) {
          try {
            const res = await fetch(
              `/api/inventory/categories/subcategories?limit=200&sort=name&dir=asc&parent=${encodeURIComponent(nextDetail.category)}`
            );
            const json = await res.json();
            const subs: Option[] = ((json?.data || []) as Array<{id?: string; _id?: string; name: string}>)
              .map((s) => ({ id: (s.id || s._id || "") as string, name: s.name }))
              .filter((s) => s.id);
            setSubcategories(subs);
          } catch {
            setSubcategories([]);
          }
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load product. Please try again.";
        setError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  React.useEffect(() => {
    if (open && productId) {
      setEditing(false);
      void fetchDetail(productId);
    }
    if (!open) {
      setEditing(false);
      setDetail(null);
      setError(null);
      setSaving(false);
      setSubcategories([]);
      form.reset();
    }
  }, [open, productId, fetchDetail, form]);

  const handleSubmit = React.useCallback(
    async (values: ProductFormValues) => {
      if (!productId) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/inventory/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const message =
            json?.error ?? "Failed to update product. Please try again.";
          throw new Error(message);
        }
        toast.success("Product updated");
        await fetchDetail(productId);
        setEditing(false);
        onUpdated?.();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update product. Please try again.";
        toast.error(message);
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
    [productId, fetchDetail, onUpdated]
  );

  const handleCancelEdit = React.useCallback(() => {
    if (detail) {
      form.reset({
        name: detail.name,
        slug: detail.slug ?? "",
        sku: detail.sku ?? "",
        category: detail.category ?? "",
        subCategory: detail.subCategory ?? "",
        brand: detail.brand ?? "",
        unit: detail.unit ?? "",
        description: detail.description ?? "",
        price: detail.price ?? undefined,
        quantity: detail.quantity ?? undefined,
        qtyAlert: detail.qtyAlert ?? undefined,
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

  const getStockBadgeColor = (quantity?: number | null, alert?: number | null) => {
    const qty = quantity ?? 0;
    const alertLevel = alert ?? 0;
    
    if (alertLevel > 0) {
      const ratio = qty / alertLevel;
      if (qty <= 0) return "text-destructive bg-destructive/10";
      if (ratio <= 1) return "text-destructive bg-destructive/10";
      if (ratio <= 1.5) return "text-amber-600 bg-amber-600/10 dark:text-amber-400 dark:bg-amber-400/10";
      return "text-green-600 bg-green-600/10 dark:text-green-400 dark:bg-green-400/10";
    }
    return "text-muted-foreground bg-muted/30";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full flex-col gap-0 p-0 sm:max-w-xl overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>
            {editing ? "Edit product" : "Product details"}
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
              onClick={() => productId && fetchDetail(productId)}
            >
              Retry
            </Button>
          </div>
        ) : detail ? (
          editing ? (
            <>
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle>Edit Product</SheetTitle>
                <SheetDescription>
                  Update the product information below.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <ProductForm
                  form={form}
                  categories={categories}
                  subcategories={subcategories}
                  brands={brands}
                  units={units}
                  saving={saving}
                  submitLabel="Save Changes"
                  onSubmit={handleSubmit}
                  onCancel={handleCancelEdit}
                  autoSlug={false}
                  allowSlugEditing
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
                  {detail.sku ? `SKU: ${detail.sku}` : "No SKU"}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="grid gap-4 text-sm">
                  {detail.slug && (
                    <DetailItem label="Slug">{detail.slug}</DetailItem>
                  )}
                  <DetailItem label="Category">
                    {detail.categoryName ?? "—"}
                  </DetailItem>
                  <DetailItem label="Subcategory">
                    {detail.subCategoryName ?? "—"}
                  </DetailItem>
                  <DetailItem label="Brand">
                    {detail.brandName ?? "—"}
                  </DetailItem>
                  <DetailItem label="Unit">
                    {detail.unitName ?? "—"}
                  </DetailItem>
                  <DetailItem label="Description">
                    {detail.description ?? "—"}
                  </DetailItem>
                  <DetailItem label="Price">
                    {typeof detail.price === "number" ? `$${detail.price.toFixed(2)}` : "—"}
                  </DetailItem>
                  <DetailItem label="Stock">
                    <Badge className={`border-none ${getStockBadgeColor(detail.quantity, detail.qtyAlert)}`}>
                      {detail.quantity ?? 0}
                    </Badge>
                  </DetailItem>
                  <DetailItem label="Alert Level">
                    {detail.qtyAlert ?? "—"}
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
                  Edit Product
                </Button>
              </div>
            </>
          )
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Select a product to view details.
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
