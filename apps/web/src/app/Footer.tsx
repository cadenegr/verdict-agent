import { Info, Settings } from "lucide-react";
import { NavLink } from "react-router";
import { navItemClasses, navItemCurrentClasses } from "./navStyles.ts";
import { sections } from "./sections.ts";

const iconProps = { "aria-hidden": true, size: 26, strokeWidth: 2.25 } as const;

const links = [
  ...sections.map(({ path, label, shortLabel, icon }) => ({ path, label, shortLabel, icon })),
  { path: "/settings", label: "Settings", shortLabel: undefined, icon: Settings },
  { path: "/info", label: "Information", shortLabel: "Info", icon: Info },
];

// Footer on every screen: the app's sections, then Settings and Information.
// It stays at the bottom of the screen, within thumb reach on a phone, in one row:
// a long label gets a shortLabel for phones (its full label stays its accessible name).
export function Footer() {
  return (
    <footer className="sticky bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <nav aria-label="Sections" className="mx-auto max-w-content px-3 py-2 sm:px-6">
        <ul className="flex justify-around gap-1 sm:justify-center sm:gap-4">
          {links.map(({ path, label, shortLabel, icon: Icon }) => (
            <li key={path} className="min-w-0 flex-1 sm:flex-none">
              <NavLink
                to={path}
                aria-label={shortLabel ? label : undefined}
                className={`w-full ${navItemClasses} ${navItemCurrentClasses}`}
              >
                <Icon {...iconProps} />
                {shortLabel ? (
                  <>
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </>
                ) : (
                  label
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
