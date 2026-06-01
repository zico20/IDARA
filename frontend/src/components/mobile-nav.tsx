"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarContent } from "@/components/sidebar";
import { useExitTransition } from "@/hooks/use-exit-transition";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/**
 * Mobile navigation: an accessible hamburger trigger + an off-canvas drawer that
 * reuses `SidebarContent` (single source of truth for navigation). Shown only
 * below `md` (768px); at `md`+ the persistent `Sidebar` rail is used instead.
 *
 * The drawer closes on: choosing a destination (via SidebarContent's onNavigate),
 * tapping the outside scrim, and pressing Escape. The trigger is a real button
 * with aria-label/aria-expanded and is keyboard operable; focus moves into the
 * drawer's close button when open. The drawer slides from the inline-start side,
 * so it mirrors automatically in RTL.
 */
export function MobileNav() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { mounted, closing } = useExitTransition(open, 200);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll, close on Escape, and move focus into the drawer when open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="max-md:block md:hidden">
      {/* Top strip with the hamburger trigger (below md only). */}
      <div className="glass-bar flex h-14 flex-shrink-0 items-center px-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("nav.openMenu")}
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-fg/[0.08] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-95"
        >
          <Menu size={20} />
        </button>
      </div>

      {mounted && (
        <div className="fixed inset-0 z-50">
          {/* Scrim — closes on outside tap */}
          <div
            className={cn(
              "absolute inset-0 bg-black/55 backdrop-blur-sm",
              closing ? "animate-fade-out" : "animate-fade-in",
            )}
            onMouseDown={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Off-canvas drawer (inline-start side; mirrors in RTL) */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.boards")}
            className={cn(
              "glass-frost absolute inset-y-0 start-0 flex w-[min(82vw,300px)] flex-col gap-1 border-e border-border/60 p-3 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
              closing
                ? "-translate-x-full rtl:translate-x-full"
                : "translate-x-0 animate-fade-in",
            )}
          >
            <div className="flex justify-end">
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("nav.closeMenu")}
                className="flex h-11 w-11 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-fg/[0.08] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
