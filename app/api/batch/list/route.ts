import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const batches = await prisma.emailBatch.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(batches);
}
