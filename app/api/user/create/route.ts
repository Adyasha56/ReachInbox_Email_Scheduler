import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
    },
  });

  return NextResponse.json(user);
}
