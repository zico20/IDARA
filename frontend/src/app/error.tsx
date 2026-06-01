"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useT } from "@/lib/i18n";

// Route-level error boundary: shown when a segment throws during render.
// Bilingual, glass-styled, with a retry that re-renders the segment.
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6">
      <div role="alert">
        <EmptyState
          icon={<TriangleAlert size={22} />}
          title={t("error.title")}
          description={t("error.desc")}
          action={<Button onClick={reset}>{t("error.retry")}</Button>}
        />
      </div>
    </div>
  );
}
