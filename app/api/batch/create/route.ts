import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailQueue } from "@/lib/queue";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  //Get session
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  //Get userId from session (REAL USER)
  const userId = session.user.id;

  //Read body (NO userId from client)
  const body = await req.json();
  const { name, startTime, delayBetween, hourlyLimit } = body;

  if (!name || !startTime || delayBetween == null || hourlyLimit == null) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  //Create batch
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

  //Schedule job
  await emailQueue.add(
    "process-batch",
    { batchId: batch.id },
    {
      delay: new Date(startTime).getTime() - Date.now(),
    }
  );

  return NextResponse.json(batch);
}
