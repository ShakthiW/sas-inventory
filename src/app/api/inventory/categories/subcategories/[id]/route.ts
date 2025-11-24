import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";

const subCategoryUpdateSchema = z.object({
  name: z.string().min(1).min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentCategoryId: z.string().min(1),
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
      { error: "Invalid subcategory id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const subCategories = db.collection("product_subcategories");
    const categories = db.collection("product_categories");
    
    const doc = await subCategories.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return Response.json(
        { error: "Subcategory not found" },
        {
          status: 404,
        }
      );
    }

    // Fetch parent category name
    let parentCategoryName: string | null = null;
    if (doc.parentCategoryId) {
      const parentCategory = await categories.findOne({
        _id: doc.parentCategoryId,
      });
      parentCategoryName = parentCategory?.name ?? null;
    }

    return Response.json({
      id,
      name: doc.name ?? "",
      slug: doc.slug ?? null,
      description: doc.description ?? null,
      parentCategoryId: doc.parentCategoryId?.toString() ?? "",
      parentCategoryName,
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
      { error: "Invalid subcategory id" },
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

  const parsed = subCategoryUpdateSchema.safeParse(json);
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
    const subCategories = db.collection("product_subcategories");

    const now = new Date();
    const trimmedName = payload.name.trim();
    const trimmedSlug = payload.slug?.trim() ?? "";
    const trimmedDescription = payload.description?.trim() ?? "";

    if (!ObjectId.isValid(payload.parentCategoryId)) {
      return Response.json(
        { error: "Invalid parent category id" },
        {
          status: 400,
        }
      );
    }

    const updatePayload = {
      name: trimmedName,
      slug: trimmedSlug ? slugify(trimmedSlug) : slugify(trimmedName),
      description: trimmedDescription || null,
      parentCategoryId: new ObjectId(payload.parentCategoryId),
      updatedAt: now,
    };

    const result = await subCategories.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { error: "Subcategory not found" },
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
      { error: "Invalid subcategory id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("product_subcategories");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return Response.json(
        { error: "Subcategory not found" },
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
