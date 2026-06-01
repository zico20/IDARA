import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A styled native `<select>` that matches the Liquid Glass design system.
 *
 * We keep the native element (not a custom popover) on purpose: it gives free
 * accessibility, keyboard navigation, RTL/LTR handling, and the platform's own
 * touch picker on mobile — no new runtime dependency required (Constitution:
 * no new deps). The OS still renders the open option list, but the *closed*
 * control is fully on-brand: glass surface, custom chevron, and consistent
 * focus ring shared with `Input`/`Button`.
 *
 * `appearance-none` strips the default OS triangle so our `ChevronDown` is the
 * only affordance; `pe-8` reserves room for it (RTL-aware via logical padding).
 */
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Visual density. `sm` matches compact toolbar selects; `md` matches inputs. */
  selectSize?: "sm" | "md";
  /** Class applied to the positioning wrapper (e.g. to size a compact select). */
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, selectSize = "md", wrapperClassName, children, ...props }, ref) => (
    <div className={cn("relative inline-flex w-full", wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          "peer w-full appearance-none rounded-md border border-border bg-bg-subtle text-fg",
          "transition-colors hover:bg-bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Reserve room for the chevron on the trailing (logical) edge.
          selectSize === "sm"
            ? "h-8 ps-2.5 pe-7 text-[12px]"
            : // 16px on mobile prevents iOS zoom-on-focus; desktop sizing at md+.
              "h-10 ps-3 pe-9 text-base md:h-9 md:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={selectSize === "sm" ? 13 : 15}
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-fg-subtle transition-colors",
          "peer-focus-visible:text-fg-muted peer-disabled:opacity-50",
          selectSize === "sm" ? "end-2" : "end-3",
        )}
      />
    </div>
  ),
);
Select.displayName = "Select";
