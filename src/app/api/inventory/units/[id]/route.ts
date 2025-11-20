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
      { error: "Invalid unit id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("units_of_measure");
    const unitObjectId = new ObjectId(id);

    const existing = await collection.findOne({
      _id: unitObjectId,
    });

    if (!existing) {
      return Response.json(
        { error: "Unit not found" },
        {
          status: 404,
        }
      );
    }

    let removedPackUnitIds: string[] = [];
    if (existing.kind === "base") {
      const packUnits = await collection
        .find<{ _id: ObjectId }>(
          {
            baseUnitId: unitObjectId,
          },
          {
            projection: { _id: 1 },
          }
        )
        .toArray();

      if (packUnits.length) {
        const packIds = packUnits.map((p) => p._id);
        removedPackUnitIds = packIds.map((p) => p.toString());
        await collection.deleteMany({
          _id: { $in: packIds },
        });
      }
    }

    const result = await collection.deleteOne({
      _id: unitObjectId,
    });

    if (result.deletedCount === 0) {
      return Response.json(
        { error: "Unit not found" },
        {
          status: 404,
        }
      );
    }

    return Response.json(
      {
        success: true,
        removedPackUnitIds,
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

