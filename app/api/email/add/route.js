import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const body = await req.json();
  const { batchId, to, subject, bodyText } = body;

  if (!batchId || !to || !subject || !bodyText) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  const email = await prisma.email.create({
    data: {
      batchId,
      to,
      subject,
      body: bodyText,
      status: "pending",
    },
  });

  return NextResponse.json(email);
}
