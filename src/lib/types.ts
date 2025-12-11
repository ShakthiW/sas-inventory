import type { ObjectId } from "mongodb";

// Database models
export type UserDoc = {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Auth payloads
export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

// Public-safe user shape
export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

// Inventory/Product types

// Warehouse types
export type WarehouseId = "warehouse-1" | "warehouse-2";

export type Warehouse = {
  id: WarehouseId;
  name: string;
  location?: string;
};

// Hardcoded warehouses in the system
export const WAREHOUSES: Warehouse[] = [
  { id: "warehouse-1", name: "Main Warehouse", location: "Primary Location" },
  { id: "warehouse-2", name: "Secondary Warehouse", location: "Secondary Location" },
];

// Product type as used in Pricing & Stocks form
export type ProductType =
  | "single-product"
  | "variable-product"
  | "bundle-product";

// Form model for Product Information section
export type ProductInformationForm = {
  name: string;
  slug?: string;
  sku?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  supplier?: string;
  unit?: string;
  description?: string;
};

// Form model for Pricing & Stocks section
export type PricingStockForm = {
  quantity?: number;
  qtyAlert?: number;
  price?: number;
  warehouse?: WarehouseId;
};

// Combined payload that could be sent when creating a product
export type ProductCreatePayload = ProductInformationForm & {
  pricing: {
    quantity?: number;
    qtyAlert?: number;
    price?: number;
  };
  images?: File[];
};

// Client-side image upload state used by ImageInput component
export type ImageUploadState = {
  file: File | null;
  progress: number;
  uploading: boolean;
};

// Supplier types

export type SupplierType = "individual" | "company";

// Shape sent from the client when creating a supplier
export type SupplierCreatePayload = {
  supplierType: SupplierType;
  name: string;
  code: string;
  isActive: boolean;
  phone?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
};

// MongoDB document representation for a supplier
export type SupplierDoc = {
  _id?: ObjectId;
  supplierType: SupplierType;
  name: string;
  code: string;
  isActive: boolean;
  phone?: string | null;
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Common API list response shapes
export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type ListResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

// Suppliers query helpers
export type SupplierSortField = "createdAt" | "name" | "code";
export type SortDir = "asc" | "desc";

// Category types

export type CategoryCreatePayload = {
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
};

export type CategoryDoc = {
  _id?: ObjectId;
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CategorySortField = "createdAt" | "name";

// Brand types

export type BrandCreatePayload = {
  name: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
};

export type BrandDoc = {
  _id?: ObjectId;
  name: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BrandSortField = "createdAt" | "name";

// SubCategory types

export type SubCategoryCreatePayload = {
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
  parentCategoryId: string; // references CategoryDoc._id
};

export type SubCategoryDoc = {
  _id?: ObjectId;
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
  parentCategoryId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type SubCategorySortField = "createdAt" | "name";

// Units of Measure types

export type UnitKind = "base" | "pack"; // base: indivisible unit; pack: contains multiple base units

export type UnitOfMeasureCreatePayload = {
  name: string; // e.g., Piece, Box
  shortName?: string; // e.g., pc, box
  kind: UnitKind;
  isActive: boolean;
  // For pack units only
  baseUnitId?: string; // references base unit
  unitsPerPack?: number; // quantity of base units in one pack
};

export type UnitOfMeasureDoc = {
  _id?: ObjectId;
  name: string;
  shortName?: string;
  kind: UnitKind;
  isActive: boolean;
  baseUnitId?: ObjectId;
  unitsPerPack?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UnitSortField = "createdAt" | "name";

// Products list item shape returned by /api/inventory/products
export type ProductListItem = {
  id?: string;
  _id?: string;
  name: string;
  sku?: string;
  category?: string;
  brand?: string;
  pricing?: {
    price?: number;
    quantity?: number;
    unit?: string;
    qtyAlert?: number;
  };
  unit?: string;
  images?: string[];
  createdAt?: string;
};

// Lightweight product shape for card/browser UIs (flattened)
export type ProductCardItem = {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  brand?: string;
  price?: number;
  image?: string;
  quantity?: number;
  unit?: string;
};

// Generic select option used in forms
export type SelectOption = { value: string; label: string };

// Minimal category shape used in client-side selectors
export type CategoryOption = { id: string; name: string };

// List item shapes used by tables and lists across inventory screens
export type BrandListItem = {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type CategoryListItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type SubCategoryListItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  parentCategoryId: string;
  parentCategoryName?: string;
  createdAt?: string;
};

export type UnitListItem = {
  id: string;
  name: string;
  shortName?: string;
  kind: UnitKind;
  isActive?: boolean;
  baseUnitName?: string;
  unitsPerPack?: number;
  createdAt?: string;
};

export type SupplierListItem = {
  id: string;
  name: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
};

// Warehouse Stock Transfer types
export type StockTransferPayload = {
  fromWarehouse: WarehouseId;
  toWarehouse: WarehouseId;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  date?: string;
  reference?: string;
  note?: string;
};

export type StockTransferDoc = {
  _id?: ObjectId;
  fromWarehouse: WarehouseId;
  toWarehouse: WarehouseId;
  productId: ObjectId;
  productName: string;
  sku?: string;
  quantity: number;
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StockTransferListItem = {
  id: string;
  fromWarehouse: WarehouseId;
  fromWarehouseName: string;
  toWarehouse: WarehouseId;
  toWarehouseName: string;
  productName: string;
  sku?: string;
  quantity: number;
  date: string;
  note?: string;
  createdAt?: string;
};

// Add Stock line item used in the Add Stock flow
export type StockLineItem = {
  productId: string;
  name: string;
  sku?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  batch?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  supplier?: string;
  warehouse: WarehouseId; // Which warehouse the stock is going to
};
