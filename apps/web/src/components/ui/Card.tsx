import type { ReactNode } from "react";
import { Link } from "react-router";
import { cardClasses } from "./styles.ts";

interface CardProps {
  title?: string;
  children: ReactNode;
}

/** A group of related content on a surface. */
export function Card({ title, children }: CardProps) {
  return (
    <section className={`flex flex-col gap-3 ${cardClasses}`}>
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

interface CardLinkProps {
  to: string;
  title: string;
  children?: ReactNode;
}

/** A card that is one big link, e.g. to a section of the app. */
export function CardLink({ to, title, children }: CardLinkProps) {
  return (
    <Link
      to={to}
      className={`flex min-h-tap flex-col gap-2 transition-colors hover:border-brand hover:bg-raised ${cardClasses}`}
    >
      <span className="text-xl font-semibold text-brand">{title}</span>
      {children && <span className="text-ink-muted">{children}</span>}
    </Link>
  );
}
