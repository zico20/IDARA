"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { FullPageSpinner } from "@/components/ui/misc";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Backdrop } from "@/components/backdrop";

/**
 * Auth gate for all app routes. While the session is loading we show a spinner;
 * if there's no user we redirect to /login. (Client-side guard; the backend
 * remains the real authority and rejects unauthenticated API calls.)
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <FullPageSpinner />;

  // 100dvh (dynamic viewport) so the mobile address bar showing/hiding never
  // clips the bottom of the app. Equals 100vh on desktop (no dynamic chrome).
  return (
    <div className="relative flex h-[100dvh] overflow-hidden">
      <Backdrop />
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Hamburger + off-canvas drawer — below md only; sidebar handles md+ */}
        <MobileNav />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
