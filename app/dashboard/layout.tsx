"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { emailAPI } from "@/utils/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scheduledCount, setScheduledCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      // Fetch counts for sidebar
      const fetchCounts = async () => {
        try {
          const [scheduledResponse, sentResponse] = await Promise.all([
            emailAPI.getScheduled().catch(() => ({ data: [] })),
            emailAPI.getSent().catch(() => ({ data: [] })),
          ]);

          setScheduledCount(scheduledResponse.data?.length || 0);
          setSentCount(sentResponse.data?.length || 0);
        } catch (error) {
          console.error("Error fetching counts:", error);
        }
      };

      fetchCounts();
      
      // Refresh counts every 30 seconds
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={{
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.name || null,
          image: session.user.image || null,
        }}
        scheduledCount={scheduledCount}
        sentCount={sentCount}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
