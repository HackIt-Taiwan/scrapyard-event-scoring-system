"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { fetchTeams } from "@/lib/api-client";

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and redirect to a team
  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch teams and redirect to the first available team
    const fetchAndRedirect = async () => {
      try {
        setIsLoading(true);
        const teamsData = await fetchTeams();
        
        if (teamsData.length > 0) {
          // Redirect to the first team
          router.push(`/dashboard/${teamsData[0].team_id}`);
        } else {
          setError("沒有可用的隊伍。請聯繫管理員。");
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        setError("無法加載隊伍數據。請刷新頁面或稍後再試。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndRedirect();
  }, [router]);

  if (isLoading) {
    return (
      <div className="container">
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">加載中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm max-w-md flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            {error ? (
              <>
                <div className="text-red-500 mb-4">{error}</div>
                <Button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium"
                >
                  重新加載
                </Button>
              </>
            ) : (
              <div>重新導向到評分頁面...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
