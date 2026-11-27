// Class lists shared by components that look alike but render different elements
// (a <button> and a router <Link> styled as a button). Tokens only: see docs/design.md.

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex min-h-tap min-w-tap items-center justify-center gap-2 rounded-control px-5 " +
  "text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-strong",
  secondary: "border-2 border-line bg-surface text-ink hover:bg-raised",
  ghost: "text-ink hover:bg-raised",
  danger: "bg-danger text-on-danger hover:opacity-90",
};

export function buttonClasses(variant: ButtonVariant = "primary", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

export const cardClasses = "rounded-card border border-line bg-surface p-5 sm:p-6";
