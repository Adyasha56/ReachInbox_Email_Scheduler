// lib/queue.ts
import { Queue } from "bullmq";

// Local Redis connection
export const emailQueue = new Queue("emailQueue", {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
});