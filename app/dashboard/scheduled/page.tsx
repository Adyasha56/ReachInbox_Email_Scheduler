"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ScheduledEmailsTable } from "@/components/emails/scheduled-emails-table";
import { emailAPI } from "@/utils/api";
import { Email } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ComposeEmailDialog } from "@/components/emails/compose-email-dialog";
import { useRouter } from "next/navigation";

export default function ScheduledPage() {
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

    fetchScheduledEmails();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchScheduledEmails, 300000);
    return () => clearInterval(interval);
  }, [session]);

  const fetchScheduledEmails = async () => {
    try {
      setIsLoading(true);
      const response = await emailAPI.getScheduled();
      setEmails(response.data || []);
    } catch (error) {
      console.error("Error fetching scheduled emails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Scheduled Emails</h1>
        {/* <Button onClick={() => setIsComposeOpen(true)}>
          Compose Email
        </Button> */}
      </div>

      <ScheduledEmailsTable 
        emails={emails} 
        isLoading={isLoading}
        onRefresh={fetchScheduledEmails}
      />

      <ComposeEmailDialog
        open={isComposeOpen}
        onOpenChange={setIsComposeOpen}
        onSuccess={fetchScheduledEmails}
      />
    </div>
  );
}
