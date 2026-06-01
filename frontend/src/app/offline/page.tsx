"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useT } from "@/lib/i18n";

// Offline fallback: the service worker serves this page when a navigation fails
// and the network is unavailable. Bilingual, glass-styled, RTL/theme-safe.
export default function OfflinePage() {
  const t = useT();
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md items-center justify-center px-6">
      <div role="alert" aria-live="polite">
        <EmptyState
          icon={<WifiOff size={22} />}
          title={t("offline.title")}
          description={t("offline.desc")}
          action={
            <Button onClick={() => window.location.reload()}>
              {t("offline.retry")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
