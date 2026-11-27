import type { InputHTMLAttributes, ReactNode } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Visible label. The whole label is the tap target, not only the box. */
  label: ReactNode;
}

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className={`flex min-h-tap flex-1 cursor-pointer items-center gap-4 ${className}`}>
      <input type="checkbox" className="size-7 shrink-0 accent-brand" {...props} />
      <span className="min-w-0 flex-1 break-words">{label}</span>
    </label>
  );
}
