"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Email } from "@/types/api";
import { format } from "date-fns";
import { Mail, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SentEmailsTableProps {
  emails: Email[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function SentEmailsTable({
  emails,
  isLoading,
  onRefresh,
}: SentEmailsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmails = emails.filter(
    (email) =>
      email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xs text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-2xl">
        <Input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-full bg-gray-100 border-0 placeholder:text-gray-400"
        />
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-gray-100"
        >
          <Filter className="h-4 w-4 text-gray-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-gray-100"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      {/* Email List */}
      {filteredEmails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 mb-4 text-gray-300" />
          <p className="text-xs text-gray-500">No sent emails</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => router.push(`/dashboard/sent/${email.id}`)}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border-b last:border-b-0"
            >
              {/* Left: Recipient */}
              <div className="flex-shrink-0 min-w-[120px]">
                <p className="text-xs font-medium text-gray-900">
                  To: {email.to}
                </p>
              </div>

              {/* Middle: Status and Subject/Preview */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                    Sent
                  </span>
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {email.subject}
                  </p>
                </div>
              </div>

              {/* Right: Date */}
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-gray-500">
                  {format(new Date(email.createdAt), "MMM d")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
