import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // simple DB ping
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ status: "ok" });
}
