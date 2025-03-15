import { getCurrentUser } from '@/lib/auth';
import Image from "next/image";
import Link from "next/link";
import LogoutButton from '@/components/logout-button';

export default async function Home() {
  const user = await getCurrentUser();
  
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/logo.svg"
            alt="HackScore Logo"
            width={100}
            height={100}
            priority
            className="dark:hidden"
          />
          <Image
            src="/logo-dark.svg"
            alt="HackScore Logo"
            width={100}
            height={100}
            priority
            className="hidden dark:block"
          />
          <h1 className="text-3xl font-bold tracking-tight">
            HackScore
          </h1>
          <p className="text-muted-foreground text-center max-w-md">
            黑客松評分系統
          </p>
        </div>

        <div className="mt-8 max-w-md">
          {user ? (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h2 className="text-xl font-semibold mb-4">
                歡迎回來, {user.email}!
              </h2>
              
              <div className="space-y-2 text-sm mb-6">
                <p>
                  <span className="font-medium text-muted-foreground">用戶身份:</span>{' '}
                  {user.is_admin ? '管理員' : user.is_judge ? '評審' : '用戶'}
                </p>
                {user.team_id && (
                  <p>
                    <span className="font-medium text-muted-foreground">團隊ID:</span>{' '}
                    {user.team_id}
                  </p>
                )}
              </div>
              
              <div className="flex gap-4 flex-wrap">
                {user.is_judge && (
                  <Link 
                    href="/dashboard"
                    className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
                  >
                    開始評分
                  </Link>
                )}
                
                {user.is_admin && (
                  <Link 
                    href="/admin"
                    className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
                  >
                    管理儀表板
                  </Link>
                )}
                
                <LogoutButton />
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border text-center">
              <h2 className="text-xl font-semibold mb-4">
                請先登入
              </h2>
              <p className="text-muted-foreground mb-6">
                您需要登入後才能使用本系統
              </p>
              <Link
                href="/login"
                className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
              >
                登入系統
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} HackScore
        </p>
      </footer>
    </div>
  );
}
