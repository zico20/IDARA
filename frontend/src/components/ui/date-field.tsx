import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A native `<input type="date">` made easy to use: clicking anywhere on the
 * field (not just the tiny OS calendar glyph) opens the date picker, and the
 * affordance is a clear, themed calendar button on the trailing edge.
 *
 * We keep the native input — same value contract (`YYYY-MM-DD`), free
 * accessibility, keyboard entry, and the platform picker on mobile — so it
 * drops straight into react-hook-form's `register()` with no new dependency.
 * The default OS picker indicator is hidden (see `globals.css`
 * `.date-field-input`) and replaced by our overlaid `Calendar` button.
 */
export const DateField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, onClick, disabled, ...props }, forwardedRef) => {
  const innerRef = React.useRef<HTMLInputElement | null>(null);

  const setRef = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  // Open the native picker on demand. `showPicker()` must run inside a user
  // gesture and isn't in every browser — guard so we degrade to normal typing.
  const openPicker = () => {
    const el = innerRef.current;
    if (!el || disabled) return;
    try {
      el.showPicker?.();
    } catch {
      /* not user-activated or unsupported — native fallback handles it */
    }
  };

  return (
    <div className="relative mt-1 flex w-full">
      <input
        ref={setRef}
        type="date"
        disabled={disabled}
        onClick={(e) => {
          openPicker();
          onClick?.(e);
        }}
        className={cn(
          "date-field-input flex h-10 w-full cursor-pointer rounded-md border border-border bg-bg-subtle ps-3 pe-10 py-1 text-base text-fg",
          "md:h-9 md:text-sm",
          "transition-colors hover:bg-bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onClick={openPicker}
        className={cn(
          "pointer-events-none absolute end-0 top-0 flex h-full w-10 items-center justify-center text-fg-subtle transition-colors",
          "peer-focus-visible:text-fg-muted",
        )}
      >
        <Calendar size={15} />
      </button>
    </div>
  );
});
DateField.displayName = "DateField";
