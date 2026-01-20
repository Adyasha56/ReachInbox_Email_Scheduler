// lib/queue.ts
import { Queue } from "bullmq";

// lib/queue.ts - will use REDIS_URL from env
export const emailQueue = new Queue("emailQueue", {
  connection: {
    url: process.env.REDIS_URL,
  },
});