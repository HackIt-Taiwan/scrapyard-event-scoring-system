"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="container">
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm max-w-md flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div>請選擇一個隊伍進行評分</div>
            <Button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium"
            >
              重新加載
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
