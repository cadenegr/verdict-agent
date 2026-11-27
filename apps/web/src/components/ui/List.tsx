import type { ReactNode } from "react";

/** A list of rows on a surface, separated by lines. */
export function List({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <ul
      aria-label={label}
      className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface"
    >
      {children}
    </ul>
  );
}

/** One row: at least the tap size, with room between its parts. */
export function ListItem({ children }: { children: ReactNode }) {
  return <li className="flex min-h-tap items-center gap-3 px-4 py-2 sm:px-5">{children}</li>;
}
