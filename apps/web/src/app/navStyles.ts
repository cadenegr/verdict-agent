// Classes for the header and footer buttons: icon above a label on phones,
// side by side from the sm breakpoint. Tokens only.
export const navItemClasses =
  "flex min-h-tap min-w-tap flex-col items-center justify-center gap-1 rounded-control px-2 py-1 " +
  "font-semibold text-ink transition-colors hover:bg-raised sm:flex-row sm:gap-2 sm:px-4 " +
  "disabled:cursor-not-allowed disabled:text-ink-muted disabled:hover:bg-transparent";

// The current screen: brand color plus a bar underneath, so it never relies on color alone.
export const navItemCurrentClasses =
  "aria-[current=page]:text-brand aria-[current=page]:underline aria-[current=page]:decoration-4 " +
  "aria-[current=page]:underline-offset-8";
