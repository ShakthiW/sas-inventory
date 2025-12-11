"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2Icon, Trash2 } from "lucide-react";
import { DatePicker } from "../ui/date-picker";
import { DropdownMenu } from "../ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";

const transferSchema = z.object({
  fromWarehouse: z.enum(["warehouse-1", "warehouse-2"]),
  toWarehouse: z.enum(["warehouse-1", "warehouse-2"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        productName: z.string().min(1),
        sku: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "At least one product is required"),
  date: z.string().optional(),
  note: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

type Product = {
  id: string;
  name: string;
  sku?: string;
  warehouseStock?: { "warehouse-1": number; "warehouse-2": number };
};

type TransferItem = {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  availableStock: number;
};

type StockTransferFormProps = {
  onSuccess?: () => void;
};

export default function StockTransferForm({
  onSuccess,
}: StockTransferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedItems, setSelectedItems] = useState<TransferItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromWarehouse: "warehouse-1",
      toWarehouse: "warehouse-2",
      items: [],
      date: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  // Load products when component mounts
  useState(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch(
          "/api/inventory/products?limit=1000&sort=name&dir=asc"
        );
        const data = await response.json();
        if (data.data) {
          setProducts(
            data.data.map(
              (p: {
                id?: string;
                _id?: string;
                name: string;
                sku?: string;
                warehouseStock?: {
                  "warehouse-1": number;
                  "warehouse-2": number;
                };
              }) => ({
                id: p.id || p._id || "",
                name: p.name,
                sku: p.sku,
                warehouseStock: p.warehouseStock,
              })
            )
          );
        }
      } catch (error) {
        console.error("Failed to load products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  });

  // Watch warehouse changes to update available stock for items
  const fromWarehouse = form.watch("fromWarehouse");

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  // Add product to selected items
  const handleAddProduct = (product: Product) => {
    // Check if already added
    if (selectedItems.find((item) => item.productId === product.id)) {
      toast.error("Product already added");
      return;
    }

    const availableStock = fromWarehouse
      ? product.warehouseStock?.[fromWarehouse] || 0
      : 0;

    if (!fromWarehouse) {
      toast.error("Please select source warehouse first");
      return;
    }

    if (availableStock === 0) {
      toast.error("No stock available in source warehouse");
      return;
    }

    const newItem: TransferItem = {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: 1,
      availableStock,
    };

    setSelectedItems([...selectedItems, newItem]);
    form.setValue("items", [
      ...form.getValues("items"),
      {
        productId: newItem.productId,
        productName: newItem.productName,
        sku: newItem.sku,
        quantity: newItem.quantity,
      },
    ]);
    setSearchQuery("");
    setShowDropdown(false);
  };

  // Remove product from selected items
  const handleRemoveItem = (productId: string) => {
    const newItems = selectedItems.filter(
      (item) => item.productId !== productId
    );
    setSelectedItems(newItems);
    form.setValue(
      "items",
      newItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
      }))
    );
  };

  // Update quantity for a specific item
  const handleQuantityChange = (productId: string, quantity: number) => {
    const newItems = selectedItems.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setSelectedItems(newItems);
    form.setValue(
      "items",
      newItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
      }))
    );
  };

  const onSubmit = async (values: TransferFormValues) => {
    if (values.fromWarehouse === values.toWarehouse) {
      toast.error("Source and destination warehouses must be different");
      return;
    }

    if (values.items.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    // Validate quantities against available stock
    for (const item of selectedItems) {
      if (item.quantity > item.availableStock) {
        toast.error("Insufficient stock", {
          description: `${item.productName}: Only ${item.availableStock} units available`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/stock-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          toast.error(data.error || "Failed to create transfer", {
            description: data.details,
          });
        } else {
          throw new Error(data.error || "Failed to create transfer");
        }
        setIsSubmitting(false);
        return;
      }

      toast.success("Stock transfer completed successfully");
      form.reset();
      setSelectedItems([]);
      setSearchQuery("");

      // Call success callback to refresh history
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create transfer"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fromWarehouse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Warehouse *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source warehouse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="warehouse-1">Main Warehouse</SelectItem>
                    <SelectItem value="warehouse-2">
                      Secondary Warehouse
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toWarehouse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Warehouse *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination warehouse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="warehouse-1">Main Warehouse</SelectItem>
                    <SelectItem value="warehouse-2">
                      Secondary Warehouse
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Product Search */}
        <div className="space-y-2">
          <FormLabel>Products *</FormLabel>
          <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedItems.length === 0
                  ? "Select products to transfer"
                  : `${selectedItems.length} product(s) selected`}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <div
              className="rounded-sm border shadow-sm relative h-full p-4"
              hidden={!showDropdown}
            >
              <Input
                placeholder={
                  loadingProducts
                    ? "Loading products..."
                    : "Search products by name or SKU..."
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                hidden={!showDropdown}
                disabled={loadingProducts || !fromWarehouse}
              />
              {!fromWarehouse && (
                <p className="text-sm text-muted-foreground mt-1">
                  Please select source warehouse first
                </p>
              )}

              {/* Dropdown */}
              {showDropdown && filteredProducts.length > 0 && (
                <ScrollArea className="z-50 mt-2 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-auto">
                  {filteredProducts.map((product) => {
                    const available = fromWarehouse
                      ? product.warehouseStock?.[fromWarehouse] || 0
                      : 0;
                    const isAdded = selectedItems.some(
                      (item) => item.productId === product.id
                    );

                    return (
                      <button
                        key={product.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleAddProduct(product)}
                        disabled={isAdded}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.sku && (
                              <div className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {isAdded ? "Added" : `Stock: ${available}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </ScrollArea>
              )}
            </div>
          </DropdownMenu>

          {/* Selected Products */}
          {selectedItems.length > 0 && (
            <ScrollArea className="h-40 p-4 border rounded-md">
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 px-3 py-2 rounded-md border bg-muted/30"
                  >
                    <div className="flex items-center w-full justify-between">
                      <div className="flex flex-col items-start">
                        <div className="font-medium">{item.productName}</div>
                        {item.sku && (
                          <div className="text-xs text-muted-foreground">
                            SKU: <span className="font-mono">{item.sku}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Available: {item.availableStock} units
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={item.availableStock}
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.productId,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-24"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => handleRemoveItem(item.productId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer Date</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : new Date()}
                    onDateChange={(date) =>
                      field.onChange(date?.toISOString().split("T")[0])
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setSelectedItems([]);
            }}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Transfer Stock
          </Button>
        </div>
      </form>
    </Form>
  );
}
