"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { ScheduledEmailsTable } from "@/components/emails/scheduled-emails-table";
import { emailAPI } from "@/utils/api";
import { Email } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ComposeEmailDialog } from "@/components/emails/compose-email-dialog";
import { EmailSearch } from "@/components/emails/email-search";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!session) {
      router.push("/");
      return;
    }

    fetchScheduledEmails();
  }, [session, router]);

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

  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) return emails;
    
    const query = searchQuery.toLowerCase();
    return emails.filter(
      (email) =>
        email.to.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query)
    );
  }, [emails, searchQuery]);

  return (
    <div className="space-y-6">
      {/* <EmailSearch onSearch={setSearchQuery} placeholder="Search emails..." /> */}

      <ScheduledEmailsTable emails={filteredEmails} isLoading={isLoading} />

      <ComposeEmailDialog
        open={isComposeOpen}
        onOpenChange={setIsComposeOpen}
        onSuccess={fetchScheduledEmails}
      />
    </div>
  );
}
