import { Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";


const HOURLY_LIMIT = 100; // configurable later
const DELAY_MS = 2000;   // 2 sec between emails

new Worker(
  "emailQueue",
  async (job) => {
    const { batchId } = job.data;

    console.log("Processing batch:", batchId);

    //Fetch pending emails
    const emails = await prisma.email.findMany({
      where: {
        batchId,
        status: "pending",
      },
      orderBy: { createdAt: "asc" },
    });

    for (const email of emails) {
      const hourKey = `email_count:${new Date().getHours()}`;

      //Rate limit check
      const count = await redis.incr(hourKey);
      if (count === 1) {
        await redis.expire(hourKey, 3600);
      }

      if (count > HOURLY_LIMIT) {
        console.log("Hourly limit reached, stopping batch");
        break;
      }

      try {
        // "Send" email (mock for now)
        console.log("Sending email to:", email.to);

        //Mark as sent
        await prisma.email.update({
          where: { id: email.id },
          data: {
            status: "sent",
          },
        });

        //Delay between emails
        await new Promise((r) => setTimeout(r, DELAY_MS));
      } catch (err) {
        await prisma.email.update({
          where: { id: email.id },
          data: {
            status: "failed",
          },
        });
      }
    }

    console.log("Batch finished:", batchId);
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
    concurrency: 2,
  }
);

console.log("Email worker running");
