import { CardLink, Page } from "../../components/ui/index.ts";
import { sections } from "../../app/sections.ts";

const title = import.meta.env.VITE_APP_TITLE || "My App";

// The start screen: one card per section of the app.
export function HomePage() {
  return (
    <Page title={title} intro="Choose where to go.">
      <ul className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <li key={section.path}>
            <CardLink to={section.path} title={section.label}>
              {section.description}
            </CardLink>
          </li>
        ))}
      </ul>
    </Page>
  );
}
