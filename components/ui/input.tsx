import * as React from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, hint, error, className, id, ...rest }, ref) {
    const inputId = id ?? React.useId();
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-caption font-medium text-ink-soft">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-12 px-3.5 bg-paper text-ink rounded-button border border-hairline-strong",
            "placeholder:text-muted-soft",
            "focus:outline-none focus:border-ink focus:border-2 focus:px-[13px]",
            "transition-colors",
            error && "border-(--color-error)",
            className,
          )}
          {...rest}
        />
        {hint && !error && <p className="text-caption text-muted">{hint}</p>}
        {error && <p className="text-caption text-(--color-error)">{error}</p>}
      </div>
    );
  },
);

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, error, className, id, rows = 4, ...rest }, ref) {
    const textareaId = id ?? React.useId();
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-caption font-medium text-ink-soft">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            "px-3.5 py-3 bg-paper text-ink rounded-button border border-hairline-strong",
            "placeholder:text-muted-soft resize-y",
            "focus:outline-none focus:border-ink focus:border-2 focus:px-[13px] focus:py-[11px]",
            "transition-colors",
            error && "border-(--color-error)",
            className,
          )}
          {...rest}
        />
        {hint && !error && <p className="text-caption text-muted">{hint}</p>}
        {error && <p className="text-caption text-(--color-error)">{error}</p>}
      </div>
    );
  },
);

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, hint, error, className, id, children, ...rest }, ref) {
    const selectId = id ?? React.useId();
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-caption font-medium text-ink-soft">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-12 px-3.5 bg-paper text-ink rounded-button border border-hairline-strong",
            "focus:outline-none focus:border-ink focus:border-2 focus:px-[13px]",
            "transition-colors appearance-none",
            "bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%238B7355%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3e%3cpolyline%20points=%276%209%2012%2015%2018%209%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[right_12px_center] bg-[length:18px] pr-10",
            error && "border-(--color-error)",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        {hint && !error && <p className="text-caption text-muted">{hint}</p>}
        {error && <p className="text-caption text-(--color-error)">{error}</p>}
      </div>
    );
  },
);
