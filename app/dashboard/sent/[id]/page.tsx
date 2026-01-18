"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Email } from "@/types/api";
import { format } from "date-fns";
import { ArrowLeft, Star, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailDetailPage() {
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
  }, [session, router, params.id]);

  const fetchEmailDetail = async () => {
    try {
      setIsLoading(true);
      // In a real app, you'd fetch the email by ID
      // For now, we'll use mock data
      const mockEmail: Email = {
        id: params.id as string,
        batchId: "batch-1",
        to: "oliver@example.com",
        subject: "Oliver, hello there! | MJWYT44 BM#52W01",
        body: `<p>Hey Oliver,</p>
        <p>You've just RECEIVED something</p>
        <blockquote style="border-left: 4px solid #fbbf24; padding-left: 16px; margin: 16px 0;">
          <p><strong>Extremely Exclusive—Only 4 Spots Worldwide Per Year | $25,000 investment</strong></p>
          <p>To explore securing your private transformation, simply reply right now with <strong>"FLY OUT FIX"</strong></p>
        </blockquote>
        <p>Your coach for world-class performance,</p>
        <p>Grant</p>
        <p><em>P.S. Always remember that you can develop world class technique! 🚀</em></p>`,
        status: "sent" as const,
        createdAt: new Date("2026-01-18").toISOString(),
      };
      setEmail(mockEmail);
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
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
              {email.to.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm">Sender Name</p>
              <p className="text-xs text-gray-500">&lt;{email.to}&gt;</p>
            </div>
            <p className="text-xs text-gray-500 mb-2">to me</p>
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

        {/* Attachments */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-xs font-semibold text-gray-700 mb-4">Attachments</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <img
                src="https://via.placeholder.com/200x150?text=Attachment+1"
                alt="Attachment 1"
                className="w-full h-24 object-cover rounded mb-2"
              />
              <p className="text-xs font-medium text-gray-700">Tennis_Coach_Profile.png</p>
              <p className="text-xs text-gray-500">1.2 MB</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <img
                src="https://via.placeholder.com/200x150?text=Attachment+2"
                alt="Attachment 2"
                className="w-full h-24 object-cover rounded mb-2"
              />
              <p className="text-xs font-medium text-gray-700">Tennis_Coach_Profile2.png</p>
              <p className="text-xs text-gray-500">1.2 MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
