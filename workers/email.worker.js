import { Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import nodemailer from "nodemailer";

const HOURLY_LIMIT = Number(process.env.MAX_EMAILS_PER_HOUR || 100);
const DELAY_MS = Number(process.env.EMAIL_DELAY_MS || 2000);

// Ethereal SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASS,
  },
});

new Worker(
  "emailQueue",
  async (job) => {
    const { batchId } = job.data;
    console.log("📦 Processing batch:", batchId);

    const emails = await prisma.email.findMany({
      where: {
        batchId,
        status: "pending",
      },
      orderBy: { createdAt: "asc" },
    });

    for (const email of emails) {
      // Hour window key (UTC-safe)
      const hourKey = `email_count:${email.batchId}:${new Date().getUTCHours()}`;

      const count = await redis.incr(hourKey);
      if (count === 1) {
        await redis.expire(hourKey, 3600);
      }

      // Hourly limit reached → retry later (DON’T DROP)
      if (count > HOURLY_LIMIT) {
        await redis.decr(hourKey);
        console.log("⏳ Hourly limit reached. Will retry next hour.");
        throw new Error("HOURLY_LIMIT_REACHED");
      }

      try {
        // Send email via Ethereal
        const info = await transporter.sendMail({
          from: "ReachInbox <no-reply@reachinbox.dev>",
          to: email.to,
          subject: email.subject,
          text: email.body,
        });

        console.log("Sent:", email.to);
        console.log("Preview:", nodemailer.getTestMessageUrl(info));

        await prisma.email.update({
          where: { id: email.id },
          data: { status: "sent" },
        });

        // Delay between emails
        await new Promise((r) => setTimeout(r, DELAY_MS));
      } catch (err) {
        await prisma.email.update({
          where: { id: email.id },
          data: { status: "failed" },
        });
      }
    }

    console.log("Batch finished:", batchId);
  },
  {
    concurrency: Number(process.env.WORKER_CONCURRENCY || 2),
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
  }
);

console.log("Email worker running");
