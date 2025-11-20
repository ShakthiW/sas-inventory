import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

type RouteContext = {
  params:
    | {
        id: string;
      }
    | Promise<{
        id: string;
      }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const params = await Promise.resolve(context.params);
  const { id } = params;

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

