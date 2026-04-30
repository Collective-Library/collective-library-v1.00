"use client";

import * as React from "react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Password input with built-in show/hide toggle. Drop-in replacement for
 * <Input type="password"> on auth/register/edit forms.
 *
 * a11y: button has aria-label that reflects current state, aria-pressed
 * on toggle, keyboard accessible (button receives focus, Enter/Space work).
 */
type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, hint, error, className, id, ...rest }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-caption font-medium text-ink-soft">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "w-full h-12 px-3.5 pr-12 bg-paper text-ink rounded-button border border-hairline-strong",
              "placeholder:text-muted-soft",
              "focus:outline-none focus:border-ink focus:border-2 focus:px-[13px] focus:pr-[47px]",
              "transition-colors",
              error && "border-(--color-error)",
              className,
            )}
            {...rest}
          />
          <button
            type="button"
            aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            tabIndex={0}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-pill text-muted hover:text-ink hover:bg-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {hint && !error && <p className="text-caption text-muted">{hint}</p>}
        {error && <p className="text-caption text-(--color-error)">{error}</p>}
      </div>
    );
  },
);

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
