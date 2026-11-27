import { ListChecks, type LucideIcon } from "lucide-react";

// The app's sections: one entry per feature screen. The footer links to each one
// and the home screen shows them as cards. Add a section here when you add a feature.

export interface Section {
  path: string;
  label: string;
  /** Shown in the footer on phones when label is too long to fit (about 7 letters or more). */
  shortLabel?: string;
  description: string;
  icon: LucideIcon;
}

export const sections: readonly Section[] = [
  {
    path: "/tasks",
    label: "Tasks",
    description: "Keep a short list of things to do.",
    icon: ListChecks,
  },
];
