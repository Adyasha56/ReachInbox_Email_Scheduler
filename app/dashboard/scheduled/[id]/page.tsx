"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Email } from "@/types/api";
import { emailAPI } from "@/utils/api";
import { format } from "date-fns";
import { ArrowLeft, Star, Trash2, Archive, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ScheduledEmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/");
      return;
    }

    fetchEmailDetail();
  }, [session, params.id]);

  const fetchEmailDetail = async () => {
    try {
      setIsLoading(true);
      const response = await emailAPI.getScheduled();
      const emailId = params.id as string;
      const foundEmail = response.data?.find((e: Email) => e.id === emailId);
      
      if (foundEmail) {
        setEmail(foundEmail);
      } else {
        console.error("Email not found");
      }
    } catch (error) {
      console.error("Error fetching email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-gray-500">Email not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-medium truncate">{email.subject}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {email.status}
          </Badge>
          <Button variant="ghost" size="icon" title="Star">
            <Star className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Archive">
            <Archive className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Delete">
            <Trash2 className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <div className="max-w-3xl mx-auto p-6">
        {/* From */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {email.to.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm">To: {email.to}</p>
            </div>
            <p className="text-xs text-gray-500 mb-2">Scheduled for</p>
            <p className="text-xs text-gray-500">
              {format(new Date(email.createdAt), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-6" />
        {/* Email Body */}
        <div className="prose prose-sm max-w-none">
          <div
            className="text-sm text-gray-700 space-y-4"
            dangerouslySetInnerHTML={{ __html: email.body || "<p>No content</p>" }}
          />
        </div>
      </div>
    </div>
  );
}
