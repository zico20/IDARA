"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, LogOut } from "lucide-react";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { useBoards } from "@/hooks/use-boards";
import { Avatar } from "@/components/ui/misc";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Persistent navigation rail. Consolidates everything that previously lived in
 * the TopBar (brand, user, language/theme/logout) plus a quick-switch list of
 * the user's boards. Presentation-only: same data, same actions.
 *
 * Responsive: the rail is hidden below `md` (768px) — on phones the same
 * navigation is surfaced through the off-canvas drawer in `MobileNav`, which
 * reuses `SidebarContent` so there is a single source of truth.
 */
export function Sidebar() {
  return (
    <aside className="glass-frost relative z-10 h-screen w-[var(--sidebar-w)] flex-shrink-0 flex-col gap-1 border-e border-border/60 p-3 max-md:hidden md:flex">
      <SidebarContent />
    </aside>
  );
}

/**
 * The shared navigation contents, rendered both in the desktop rail (`Sidebar`)
 * and inside the mobile drawer (`MobileNav`). `onNavigate` lets the drawer close
 * itself when a destination is chosen.
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: user } = useCurrentUser();
  const { data: boards } = useBoards();
  const logout = useLogout();
  const t = useT();
  const pathname = usePathname();

  const allBoardsActive = pathname === "/boards";

  return (
    <>
      {/* Brand */}
      <Link
        href="/boards"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2.5 pb-3.5 pt-2"
      >
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-gradient-to-br from-accent to-accent-subtle text-bg shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          <LayoutGrid size={16} />
        </span>
        <span className="text-[15px] font-bold tracking-tight">TaskFlow</span>
      </Link>

      {/* All boards */}
      <Link
        href="/boards"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-md border border-transparent px-2.5 py-2.5 text-[13.5px] font-medium transition-colors",
          allBoardsActive
            ? "glass-clear text-fg"
            : "text-fg-muted hover:bg-fg/[0.07] hover:text-fg",
        )}
      >
        <LayoutGrid size={16} className="shrink-0" />
        <span>{t("nav.allBoards")}</span>
      </Link>

      {/* Boards quick-switch */}
      <p className="px-2.5 pb-1.5 pt-3.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-fg-subtle">
        {t("nav.boards")}
      </p>
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {boards?.map((board) => {
          const active = pathname === `/boards/${board.id}`;
          return (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              onClick={onNavigate}
              title={board.name}
              className={cn(
                "flex items-center gap-3 rounded-md border border-transparent px-2.5 py-2.5 text-[13.5px] font-medium transition-colors",
                active
                  ? "glass-clear text-fg"
                  : "text-fg-muted hover:bg-fg/[0.07] hover:text-fg",
              )}
            >
              <span
                className="h-[9px] w-[9px] shrink-0 rounded-[3px]"
                style={{ backgroundColor: board.color }}
              />
              <span dir="auto" className="truncate">
                {board.name}
              </span>
              <span className="ms-auto text-[11px] tabular-nums text-fg-subtle">
                {board.task_count}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: tools + user */}
      <div className="mt-auto flex flex-col gap-1 border-t border-border/60 pt-2.5">
        <div className="flex items-center gap-1.5 px-1.5">
          <ThemeSwitcher />
          <LanguageSwitcher iconOnly />
        </div>
        {user && (
          <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
            <Avatar name={user.name} src={user.avatar_url} size={30} />
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[13px] font-semibold leading-tight">
                {user.name}
              </b>
              <span dir="ltr" className="block truncate text-[11px] text-fg-subtle">
                {user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                logout.mutate();
              }}
              title={t("common.logout")}
              aria-label={t("common.logout")}
              className="flex h-11 w-11 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-fg/[0.08] hover:text-fg"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
