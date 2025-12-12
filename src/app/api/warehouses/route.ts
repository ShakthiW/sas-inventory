import { WAREHOUSES } from "@/lib/types";

// Simple GET endpoint to return the two hardcoded warehouses
export async function GET() {
  return Response.json({
    data: WAREHOUSES,
    total: WAREHOUSES.length,
  });
}
