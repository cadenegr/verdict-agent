// Every screen of the app, once. Used by design.spec.ts (rules) and screens.shots.ts (make screens).
// Add a new screen here; its name is used in screenshot file names.
export const screens = [
  { name: "home", path: "/" },
  { name: "tasks", path: "/tasks" },
  { name: "profile", path: "/profile" },
  { name: "settings", path: "/settings" },
  { name: "info", path: "/info" },
] as const;
