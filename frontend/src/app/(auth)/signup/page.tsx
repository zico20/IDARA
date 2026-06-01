"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { useSignup } from "@/hooks/use-auth";
import { ApiRequestError } from "@/lib/api";
import { useT } from "@/lib/i18n";

const schema = z
  .object({
    name: z.string().min(1, "auth.error.nameRequired").max(120),
    email: z.string().email("auth.error.invalidEmail"),
    password: z.string().min(8, "auth.error.passwordMin"),
    confirmPassword: z.string().min(1, "auth.error.passwordRequired"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "auth.error.passwordMismatch",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const t = useT();
  const signup = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    // confirmPassword is a client-only check; the API takes name/email/password.
    const { confirmPassword: _confirm, ...payload } = values;
    signup.mutate(payload, {
      onError: (err) => {
        const msg =
          err instanceof ApiRequestError ? err.message : t("auth.error.generic");
        toast.error(msg);
      },
    });
  };

  return (
    <div className="glass-frost rounded-2xl p-6">
      <h2 className="mb-1 text-base font-semibold text-fg">
        {t("auth.signup.title")}
      </h2>
      <p className="mb-5 text-sm text-fg-muted">{t("auth.signup.subtitle")}</p>

      {/* Social sign-up (presentational only — no real OAuth in this build). */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => toast(t("auth.googleUnavailable"))}
          className="glass-clear flex h-10 w-full items-center justify-center gap-2.5 rounded-md text-sm font-medium text-fg transition-colors hover:brightness-[1.05] md:h-9"
        >
          <GoogleIcon />
          {t("auth.google")}
        </button>
        <button
          type="button"
          onClick={() => toast(t("auth.appleUnavailable"))}
          className="glass-clear flex h-10 w-full items-center justify-center gap-2.5 rounded-md text-sm font-medium text-fg transition-colors hover:brightness-[1.05] md:h-9"
        >
          <AppleIcon />
          {t("auth.apple")}
        </button>
      </div>

      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-fg-subtle">
          {t("auth.or")}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">{t("auth.field.name")}</Label>
          <Input
            id="name"
            placeholder={t("auth.placeholder.name")}
            className="mt-1"
            {...register("name")}
          />
          <FieldError message={errors.name?.message ? t(errors.name.message) : undefined} />
        </div>
        <div>
          <Label htmlFor="email">{t("auth.field.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.placeholder.email")}
            className="mt-1"
            {...register("email")}
          />
          <FieldError message={errors.email?.message ? t(errors.email.message) : undefined} />
        </div>
        <div>
          <Label htmlFor="password">{t("auth.field.password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.placeholder.newPassword")}
            className="mt-1"
            {...register("password")}
          />
          <FieldError
            message={errors.password?.message ? t(errors.password.message) : undefined}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">
            {t("auth.field.confirmPassword")}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.placeholder.confirmPassword")}
            className="mt-1"
            {...register("confirmPassword")}
          />
          <FieldError
            message={
              errors.confirmPassword?.message
                ? t(errors.confirmPassword.message)
                : undefined
            }
          />
        </div>
        <Button type="submit" className="w-full" loading={signup.isPending}>
          {t("auth.signup.submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-fg-muted">
        {t("auth.signup.haveAccount")}{" "}
        <Link href="/login" className="text-accent hover:text-accent-hover">
          {t("auth.signup.loginLink")}
        </Link>
      </p>
    </div>
  );
}

/** The Google "G" mark (brand colors). Decorative; the button has a text label. */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/** The Apple mark. Uses currentColor so it reads in both light and dark. */
function AppleIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M11.18 8.46c-.02-1.66 1.36-2.46 1.42-2.5-.77-1.13-1.98-1.29-2.41-1.3-1.03-.1-2 .6-2.52.6-.51 0-1.31-.58-2.16-.57-1.11.02-2.13.64-2.7 1.63-1.15 2-.3 4.96.83 6.58.55.79 1.21 1.68 2.07 1.65.83-.03 1.15-.54 2.15-.54 1 0 1.29.54 2.16.52.89-.01 1.46-.81 2.01-1.6.63-.92.89-1.81.9-1.86-.02-.01-1.73-.66-1.75-2.62ZM9.5 3.6c.46-.56.77-1.33.68-2.1-.66.03-1.46.44-1.93 1-.42.49-.79 1.28-.69 2.03.73.06 1.48-.37 1.94-.93Z" />
    </svg>
  );
}
