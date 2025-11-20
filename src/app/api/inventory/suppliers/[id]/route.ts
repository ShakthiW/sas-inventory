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
      { error: "Invalid supplier id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("suppliers");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return Response.json(
        { error: "Supplier not found" },
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
