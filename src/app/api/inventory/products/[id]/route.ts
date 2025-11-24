import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";

const productUpdateSchema = z.object({
  name: z.string().min(1).min(3),
  slug: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  qtyAlert: z.number().int().min(0).optional(),
});

function slugify(input: string) {
  return input
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return Response.json(
      { error: "Invalid product id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const products = db.collection("products");
    const categories = db.collection("product_categories");
    const subcategories = db.collection("product_subcategories");
    const brands = db.collection("brands");
    const units = db.collection("units_of_measure");

    const doc = await products.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return Response.json(
        { error: "Product not found" },
        {
          status: 404,
        }
      );
    }

    // Fetch related entity names
    const lookups = await Promise.all([
      doc.category && ObjectId.isValid(doc.category)
        ? categories.findOne({ _id: new ObjectId(doc.category) })
        : null,
      doc.subCategory && ObjectId.isValid(doc.subCategory)
        ? subcategories.findOne({ _id: new ObjectId(doc.subCategory) })
        : null,
      doc.brand && ObjectId.isValid(doc.brand)
        ? brands.findOne({ _id: new ObjectId(doc.brand) })
        : null,
      doc.unit && ObjectId.isValid(doc.unit)
        ? units.findOne({ _id: new ObjectId(doc.unit) })
        : null,
    ]);

    const [categoryDoc, subcategoryDoc, brandDoc, unitDoc] = lookups;

    return Response.json({
      id,
      name: doc.name ?? "",
      slug: doc.slug ?? null,
      sku: doc.sku ?? null,
      category: doc.category?.toString() ?? null,
      categoryName: categoryDoc?.name ?? null,
      subCategory: doc.subCategory?.toString() ?? null,
      subCategoryName: subcategoryDoc?.name ?? null,
      brand: doc.brand?.toString() ?? null,
      brandName: brandDoc?.name ?? null,
      unit: doc.unit?.toString() ?? null,
      unitName: unitDoc?.name ?? null,
      description: doc.description ?? null,
      pricing: {
        price: doc.pricing?.price ?? null,
        quantity: doc.pricing?.quantity ?? null,
        qtyAlert: doc.pricing?.qtyAlert ?? null,
      },
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt.toISOString() : null,
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return Response.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return Response.json(
      { error: "Invalid product id" },
      {
        status: 400,
      }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      {
        status: 400,
      }
    );
  }

  const parsed = productUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid payload",
        issues: parsed.error.flatten((issue) => issue.message),
      },
      {
        status: 400,
      }
    );
  }

  const payload = parsed.data;

  try {
    const db = await getDb();
    const products = db.collection("products");

    const now = new Date();
    const trimmedName = payload.name.trim();
    const trimmedSlug = payload.slug?.trim() ?? "";
    const trimmedSku = payload.sku?.trim() ?? "";
    const trimmedDescription = payload.description?.trim() ?? "";

    const updatePayload: {
      name: string;
      slug: string;
      sku?: string | null;
      category?: ObjectId | null;
      subCategory?: ObjectId | null;
      brand?: ObjectId | null;
      unit?: ObjectId | null;
      description?: string | null;
      pricing?: {
        price?: number | null;
        quantity?: number | null;
        qtyAlert?: number | null;
      };
      updatedAt: Date;
    } = {
      name: trimmedName,
      slug: trimmedSlug ? slugify(trimmedSlug) : slugify(trimmedName),
      sku: trimmedSku || null,
      description: trimmedDescription || null,
      updatedAt: now,
    };

    // Handle ObjectId conversions for relationships
    if (payload.category && ObjectId.isValid(payload.category)) {
      updatePayload.category = new ObjectId(payload.category);
    } else {
      updatePayload.category = null;
    }

    if (payload.subCategory && ObjectId.isValid(payload.subCategory)) {
      updatePayload.subCategory = new ObjectId(payload.subCategory);
    } else {
      updatePayload.subCategory = null;
    }

    if (payload.brand && ObjectId.isValid(payload.brand)) {
      updatePayload.brand = new ObjectId(payload.brand);
    } else {
      updatePayload.brand = null;
    }

    if (payload.unit && ObjectId.isValid(payload.unit)) {
      updatePayload.unit = new ObjectId(payload.unit);
    } else {
      updatePayload.unit = null;
    }

    // Handle pricing as a nested object
    updatePayload.pricing = {
      price: payload.price ?? null,
      quantity: payload.quantity ?? null,
      qtyAlert: payload.qtyAlert ?? null,
    };

    const result = await products.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { error: "Product not found" },
        {
          status: 404,
        }
      );
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return Response.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return Response.json(
      { error: "Invalid product id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("products");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return Response.json(
        { error: "Product not found" },
        {
          status: 404,
        }
      );
    }

    return Response.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return Response.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
