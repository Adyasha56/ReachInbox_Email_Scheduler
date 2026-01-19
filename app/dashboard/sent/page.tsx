"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SentEmailsTable } from "@/components/emails/sent-emails-table";
import { emailAPI } from "@/utils/api";
import { Email } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ComposeEmailDialog } from "@/components/emails/compose-email-dialog";
import { useRouter } from "next/navigation";

export default function SentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push("/");
      return;
    }

    fetchSentEmails();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSentEmails, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const fetchSentEmails = async () => {
    try {
      setIsLoading(true);
      const response = await emailAPI.getSent();
      setEmails(response.data || []);
    } catch (error) {
      console.error("Error fetching sent emails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sent Emails</h1>
      </div>

      <SentEmailsTable 
        emails={emails} 
        isLoading={isLoading}
        onRefresh={fetchSentEmails}
      />

      <ComposeEmailDialog
        open={isComposeOpen}
        onOpenChange={setIsComposeOpen}
        onSuccess={fetchSentEmails}
      />
    </div>
  );
}
