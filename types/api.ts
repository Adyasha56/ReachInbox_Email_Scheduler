export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface EmailBatch {
  id: string;
  name: string;
  status: "scheduled" | "processing" | "completed";
  userId: string;
  startTime: string;
  delayBetween: number;
  hourlyLimit: number;
  createdAt: string;
}

export interface Email {
  id: string;
  batchId: string;
  to: string;
  subject: string;
  bodyText?: string; 
  body: string;
  status: "pending" | "sent" | "failed";
  createdAt: string;
}

export interface CreateBatchRequest {
  name: string;
  startTime: string;
  delayBetween: number;
  hourlyLimit: number;
}

export interface AddEmailRequest {
  batchId: string;
  to: string;
  subject: string;
  bodyText: string;
}
