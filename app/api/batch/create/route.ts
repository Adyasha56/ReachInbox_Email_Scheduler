import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const { name, userId, startTime, delayBetween, hourlyLimit } = body;

  if (!name || !userId || !startTime || delayBetween == null || hourlyLimit == null) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const batch = await prisma.emailBatch.create({
    data: {
      name,
      status: "scheduled",
      userId,
      startTime: new Date(startTime), 
      delayBetween: Number(delayBetween),
      hourlyLimit: Number(hourlyLimit),
    },
  });

  return NextResponse.json(batch);
}
