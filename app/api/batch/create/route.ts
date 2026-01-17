import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const { name, userId } = body;

  if (!name || !userId) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  const batch = await prisma.emailBatch.create({
    data: {
      name,
      status: "draft",
      userId,
    },
  });

  return NextResponse.json(batch);
}
