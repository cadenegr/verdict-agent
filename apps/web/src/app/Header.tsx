import { ArrowLeft, House, UserRound } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { navItemClasses, navItemCurrentClasses } from "./navStyles.ts";

const iconProps = { "aria-hidden": true, size: 26, strokeWidth: 2.25 } as const;

// Header on every screen: Back and Home on the left, Profile on the right.
export function Header() {
  const navigate = useNavigate();
  // "default" is the first screen opened in this tab: there is nothing in the app to go back to.
  const canGoBack = useLocation().key !== "default";

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface pt-[env(safe-area-inset-top)]">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-content items-center gap-2 px-3 py-2 sm:px-6"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={!canGoBack}
          className={navItemClasses}
        >
          <ArrowLeft {...iconProps} />
          Back
        </button>
        <NavLink to="/" end className={`${navItemClasses} ${navItemCurrentClasses}`}>
          <House {...iconProps} />
          Home
        </NavLink>
        <NavLink to="/profile" className={`ml-auto ${navItemClasses} ${navItemCurrentClasses}`}>
          <UserRound {...iconProps} />
          Profile
        </NavLink>
      </nav>
    </header>
  );
}
