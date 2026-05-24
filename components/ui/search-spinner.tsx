/** Thin Tailwind spinner. No deps. */
export function SearchSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Mencari"
      className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-b-transparent ${className}`}
      style={{ width: 18, height: 18 }}
    >
      <span className="sr-only">Mencari…</span>
    </span>
  );
}
