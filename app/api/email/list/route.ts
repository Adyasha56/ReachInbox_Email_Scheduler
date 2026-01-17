import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");

  if (!batchId) {
    return NextResponse.json(
      { error: "batchId is required" },
      { status: 400 }
    );
  }

  const emails = await prisma.email.findMany({
    where: { batchId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(emails);
}
