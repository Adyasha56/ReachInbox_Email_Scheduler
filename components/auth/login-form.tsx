"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Chrome } from "lucide-react";

export function LoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);



  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-center">Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full bg-green-100/80 hover:bg-green-300 text-black font-normal"
            size="lg"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Login with Google
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                or sign up through email
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              id="email"
              type="email"
              placeholder="Email ID"
              className="flex h-10 w-full rounded-md bg-[#f4f7f5] px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <input
              id="password"
              type="password"
              placeholder="Password"
              className="flex h-10 w-full rounded-md bg-[#f4f7f5] px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white font-normal"
            size="lg"
          >
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
