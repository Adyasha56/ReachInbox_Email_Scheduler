"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types/api";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Calendar, Mail } from "lucide-react";

interface SidebarProps {
  user: User;
  scheduledCount?: number;
  sentCount?: number;
}

export function Sidebar({ user, scheduledCount = 0, sentCount = 0 }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: redirect manually if signOut fails
      router.push("/");
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Inbox", icon: Inbox },
    { 
      href: "/dashboard/scheduled", 
      label: "Scheduled", 
      count: scheduledCount,
      icon: Calendar 
    },
    { 
      href: "/dashboard/sent", 
      label: "Sent", 
      count: sentCount,
      icon: Mail 
    },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white dark:bg-gray-900">
      {/* Logo */}
      <div className="flex items-center mt-4 py-2 px-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white uppercase">ReachInbox</h1>
      </div>

      {/* User Profile */}
      <div className="py-2 px-4">
        <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-2xl">
          <Avatar>
            <AvatarImage src={user.image || undefined} alt={user.name || ""} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.name || "User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Compose Button */}
      <div className="p-4">
        <Button 
          size="sm"
          variant='outline'
          className="w-full rounded-full text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => router.push("/dashboard/compose")}
        >
          Compose
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === "/dashboard" && pathname === "/dashboard");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {<item.icon className="h-4 w-4" />}
              <span className="flex-1">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 dark:text-gray-300"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
