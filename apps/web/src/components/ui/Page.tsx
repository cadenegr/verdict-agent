import { useEffect, type ReactNode } from "react";

const appTitle = import.meta.env.VITE_APP_TITLE || "My App";

interface PageProps {
  /** The screen's heading, and the browser tab title. */
  title: string;
  /** One or two sentences under the heading. */
  intro?: ReactNode;
  children?: ReactNode;
}

/** Every screen starts with a Page: one heading, then its content with even spacing. */
export function Page({ title, intro, children }: PageProps) {
  useEffect(() => {
    document.title = title === appTitle ? appTitle : `${title} · ${appTitle}`;
  }, [title]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{title}</h1>
        {intro && <p className="text-lg text-ink-muted">{intro}</p>}
      </div>
      {children}
    </div>
  );
}
