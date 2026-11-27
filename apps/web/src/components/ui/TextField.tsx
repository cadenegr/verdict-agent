import { useId, type InputHTMLAttributes } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  /** Shown above the field. Every field has a visible label. */
  label: string;
  /** Help text under the label. */
  hint?: string;
  /** Error under the field, announced to screen readers. */
  error?: string | null;
}

export function TextField({ label, hint, error, className = "", ...props }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-ink-muted">
          {hint}
        </p>
      )}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className="min-h-tap w-full rounded-control border-2 border-line bg-canvas px-4 text-ink placeholder:text-ink-muted aria-invalid:border-danger"
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
