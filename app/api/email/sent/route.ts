import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emails = await prisma.email.findMany({
    where: {
      batch: {
        userId: session.user.id,
      },
      status: "sent",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      to: true,
      subject: true,
      status: true,
      createdAt: true,
      batch: {
        select: {
          name: true,
        },
      },
    },
  });

  return NextResponse.json(emails);
}
