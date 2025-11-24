import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";

const categoryUpdateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
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
      { error: "Invalid category id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const categories = db.collection("product_categories");
    const subCategories = db.collection("product_subcategories");
    const categoryObjectId = new ObjectId(id);

    const category = await categories.findOne({
      _id: categoryObjectId,
    });

    if (!category) {
      return Response.json(
        { error: "Category not found" },
        {
          status: 404,
        }
      );
    }

    const subDocs = await subCategories
      .find({ parentCategoryId: categoryObjectId })
      .toArray();

    return Response.json({
      id,
      name: category.name ?? "",
      slug: category.slug ?? null,
      description: category.description ?? null,
      isActive: category.isActive ?? true,
      createdAt:
        category.createdAt instanceof Date
          ? category.createdAt.toISOString()
          : null,
      updatedAt:
        category.updatedAt instanceof Date
          ? category.updatedAt.toISOString()
          : null,
      subCategories: subDocs.map((sub) => ({
        id: sub._id?.toString() ?? "",
        name: sub.name ?? "",
        slug: sub.slug ?? null,
        description: sub.description ?? null,
      })),
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
      { error: "Invalid category id" },
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

  const parsed = categoryUpdateSchema.safeParse(json);
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
    const categories = db.collection("product_categories");
    const categoryObjectId = new ObjectId(id);

    const now = new Date();
    const trimmedName = payload.name.trim();
    const trimmedSlug = payload.slug?.trim() ?? "";
    const trimmedDescription = payload.description?.trim() ?? "";

    const updatePayload = {
      name: trimmedName,
      slug: trimmedSlug ? slugify(trimmedSlug) : slugify(trimmedName),
      description: trimmedDescription || null,
      isActive: payload.isActive ?? true,
      updatedAt: now,
    };

    const result = await categories.updateOne(
      { _id: categoryObjectId },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { error: "Category not found" },
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
      { error: "Invalid category id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const categories = db.collection("product_categories");
    const subCategories = db.collection("product_subcategories");
    const categoryObjectId = new ObjectId(id);

    const existing = await categories.findOne({
      _id: categoryObjectId,
    });

    if (!existing) {
      return Response.json(
        { error: "Category not found" },
        {
          status: 404,
        }
      );
    }

    const subDocs = await subCategories
      .find(
        {
          parentCategoryId: categoryObjectId,
        },
        {
          projection: { _id: 1 },
        }
      )
      .toArray();

    let removedSubCategoryIds: string[] = [];
    if (subDocs.length) {
      const ids = subDocs.map((doc) => doc._id);
      removedSubCategoryIds = ids.map((docId) => docId.toString());
      await subCategories.deleteMany({
        _id: { $in: ids },
      });
    }

    const result = await categories.deleteOne({
      _id: categoryObjectId,
    });

    if (result.deletedCount === 0) {
      return Response.json(
        { error: "Category not found" },
        {
          status: 404,
        }
      );
    }

    return Response.json(
      {
        success: true,
        removedSubCategoryIds,
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
