"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useT } from "@/lib/i18n";

// Not-found screen for unknown paths. Bilingual, glass-styled, links to boards.
export default function NotFound() {
  const t = useT();
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md items-center justify-center px-6">
      <EmptyState
        icon={<Compass size={22} />}
        title={t("notFound.title")}
        description={t("notFound.desc")}
        action={
          <Link href="/boards">
            <Button variant="secondary">{t("notFound.back")}</Button>
          </Link>
        }
      />
    </div>
  );
}
