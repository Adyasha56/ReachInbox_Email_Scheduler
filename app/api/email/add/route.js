import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

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
      from: session.user.email,
      to,
      subject,
      body: bodyText,
      status: "pending",
    },
  });

  return NextResponse.json(email);
}
