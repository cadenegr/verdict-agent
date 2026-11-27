# Design rules

The look of this app, written down so every screen follows it and anyone (or any agent) can check a screen against it. The look is **clean, minimal and easy to read**: large text, strong contrast, generous spacing, light and dark mode.

Where the rules live:

| What                                                     | Where                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Colors, font, type sizes, tap size, radii, content width | `apps/web/src/styles/index.css`, under `@theme` (the tokens) |
| Base components                                          | `apps/web/src/components/ui/`                                |
| App shell: header, body, footer                          | `apps/web/src/app/`                                          |
| These rules                                              | this file                                                    |

Rules marked **[checked]** are enforced by `make lint`, `make test` or `make e2e`; a break fails the check. The others are for review.

## 1. Colors

Use only these color tokens, as Tailwind classes (`bg-surface`, `text-ink`, `border-line`, ...). Each has a light and a dark value, so a screen gets dark mode for free.

| Token          | Used for                                              |
| -------------- | ----------------------------------------------------- |
| `canvas`       | page background                                       |
| `surface`      | header, footer, cards, lists, inactive choices        |
| `raised`       | hover and selected backgrounds                        |
| `ink`          | main text and icons                                   |
| `ink-muted`    | secondary text: intros, hints, counts, finished items |
| `line`         | borders of fields, cards, lists, dividers             |
| `brand`        | primary buttons, links, current item, focus ring      |
| `brand-strong` | hover on brand                                        |
| `on-brand`     | text on a `brand` background                          |
| `danger`       | error messages, destructive buttons                   |
| `on-danger`    | text on a `danger` background                         |

- **[checked]** No raw Tailwind colors (`text-slate-500`, `bg-white`), no hex colors (`bg-[#fff]`), no `dark:` classes. Lint rule `design/tokens-only`.
- **[checked]** Contrast, in light and in dark (`src/styles/tokens.test.ts`):
  - all text tokens (`ink`, `ink-muted`, `brand`) on `canvas`, `surface` and `raised`: at least **7:1** (WCAG AAA);
  - `danger` on `canvas` and `surface`: at least 7:1;
  - `on-brand` on `brand` and `brand-strong`, `on-danger` on `danger`: at least 7:1;
  - `line` on every background: at least **3:1** (borders must be seen).
- `danger` text goes on `canvas` or `surface` only, not on `raised`.
- Never use color as the only signal. The current screen in the header or footer is brand-colored **and** underlined; an error is red **and** says what is wrong in words; a finished task is muted **and** struck through.
- Need a color that isn't here? Add a token to `index.css` with both values and a contrast pair in `tokens.test.ts`. Don't put a one-off color in a component.

## 2. Text

- Font: **Atkinson Hyperlegible Next**, designed for readers with low vision. It's bundled with the app, so it works offline.
- Sizes. `1rem` is 18px at the standard text size, and grows with the text size chosen in Settings:

  | Class       | Size        | Used for                                       |
  | ----------- | ----------- | ---------------------------------------------- |
  | `text-base` | 1rem (18px) | body text, labels, buttons, the default        |
  | `text-lg`   | 1.125rem    | intros under a heading, legends, summaries     |
  | `text-xl`   | 1.375rem    | card headings (`h2`)                           |
  | `text-2xl`  | 1.75rem     | spare, for a large number or a section heading |
  | `text-3xl`  | 2.125rem    | screen heading (`h1`), one per screen          |

- **[checked]** `text-base` is the smallest size: `text-xs` and `text-sm` don't exist (lint), and no text on any screen renders below 16px (`e2e/design.spec.ts`).
- Line height is at least 1.5 for body text (set by the tokens). Don't tighten it.
- Weights: regular for reading, **semibold** for labels, buttons and card headings, **bold** for the screen heading. No light or thin weights.
- Left-aligned text. Center only short, single lines (empty states).
- Lines stay readable: the content column is at most `max-w-content` (46rem) wide.
- Write labels in plain words. "Delete", not "Remove item from collection".

## 3. Spacing and size

- **[checked]** Every button, link, field, checkbox and radio is at least **48 × 48 px** to tap (`e2e/design.spec.ts`). The token `tap` (3rem, 54px at standard size) gives it: `min-h-tap`, `min-w-tap`. The base components already have it.
- For a checkbox or radio, the whole label is the tap target, not only the box.
- Spacing steps (Tailwind's scale, 1 step = 0.25rem). Use these and only these:

  | Step     | Use                                                               |
  | -------- | ----------------------------------------------------------------- |
  | `1`      | only in the header and footer: icon above its word, between items |
  | `2`      | inside a control: icon to label, label to field                   |
  | `3`      | between controls in a group, list row padding                     |
  | `4`      | page side padding on phones; between cards in a grid              |
  | `5`–`6`  | card padding; page side padding from `sm`                         |
  | `6`      | between blocks of a screen (the `Page` component does it)         |
  | `8`–`10` | top and bottom padding of the screen body                         |

- Leave room. When in doubt, more space, not less.
- Radii: `rounded-control` for buttons and fields, `rounded-card` for cards and lists.

## 4. Layout

Every screen has the same three parts. The shell (`src/app/AppShell.tsx`) draws them; a feature only draws the body.

- **Header** (`src/app/Header.tsx`), stays at the top: **Back** and **Home** on the left, **Profile** on the right. Back is greyed out when there is nothing in the app to go back to.
- **Body**: the feature's screen, centered, at most `max-w-content` wide. It starts with `<Page title="...">`: one `h1`, an optional intro, then the content.
- **Footer** (`src/app/Footer.tsx`), stays at the bottom, within thumb reach: one link per section of the app, then **Settings** and **Information**. Sections come from `src/app/sections.ts`; the home screen shows the same list as cards.
- Header and footer items show an icon **and** a word. On phones the icon sits above the word; from `sm` they sit side by side.
- The footer stays on one row. A label longer than about 7 letters gets a `shortLabel` for phones ("Info" for "Information"); its full label stays its accessible name. Up to 5 sections fit; past that, group them.
- **[checked]** Nothing is wider than the screen, at phone or desktop size (`e2e/design.spec.ts`).
- Phone first: write the phone layout with base classes, then widen with `sm:` (640px) and `md:` (768px).

## 5. Components

Build screens from `src/components/ui/` (import from `components/ui/index.ts`):

| Component                        | Use                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Page`                           | the start of every screen: heading, intro, even spacing                                                                              |
| `Button`                         | every button. Variants: `primary` (the main action, one per screen part), `secondary`, `ghost` (row actions), `danger` (destructive) |
| `TextField`                      | a text input with its visible label, hint and error                                                                                  |
| `Checkbox`                       | a checkbox with its label, all of it tappable                                                                                        |
| `RadioGroup`                     | a choice of 2–5 options as large rows                                                                                                |
| `List`, `ListItem`               | rows of items on a surface, with dividers                                                                                            |
| `Card`                           | a group of related content, with an optional heading                                                                                 |
| `CardLink`                       | a card that is one big link                                                                                                          |
| `buttonClasses()`, `cardClasses` | the same looks on another element, e.g. a router `Link` styled as a button                                                           |

- Use a base component when one fits. Don't restyle it from outside beyond layout (`className` for width, alignment, margin).
- A missing component (a dialog, a select, tabs) is added to `components/ui/` with tokens only, and listed here. Not built inside a feature.

## 6. Forms and feedback

- Every field has a **visible label** above it. A placeholder is an example, never the label.
- Errors appear under the field, in words, with `role="alert"`, and the field gets a `danger` border.
- Buttons say what they do ("Add", "Clear done"). Icon-only buttons are allowed only for a repeated row action on phones (the trash icon in a list), and need an `aria-label` that starts with the visible word ("Delete ...").
- An empty list says so in a sentence ("Nothing to do yet."), not a blank space.
- Changes apply right away where possible; no "Save" button for settings.

## 7. Light, dark and text size

- Colors follow the device unless the person picks **Light** or **Dark** in Settings (`data-theme` on `<html>`).
- Settings offers three text sizes: Standard (18px), Large (20px) and Extra large (22px) (`data-text-size` on `<html>`). Everything is in `rem`, so spacing and tap targets grow with the text. **Never use `px` for sizes in components.**
- Check a new screen in both themes and at Extra large on a narrow phone (360px).

## 8. Focus and keyboard

- Every control can be reached with Tab, and shows a thick `brand` focus ring (set once in `index.css`). Never remove it.
- Use real elements: `<button>` for actions, `<a>`/`Link` for navigation, `<label>` for fields. Not clickable `<div>`s.

## How to check a screen

1. `make lint`, `make test`, `make e2e`: the **[checked]** rules.
2. Add the new screen to the list in `apps/web/e2e/screens.ts` (a name and its path). The rules in `e2e/design.spec.ts` then measure its tap targets, text size and width, and `make screens` photographs it.
3. `make screens` saves every screen to `apps/web/screenshots/<screen>-<width>-<textsize>-<theme>.png`: 360px at Extra large text, 390px at Standard, and 1280px desktop, each in light and dark. Look at them and go through sections 1–8. It only takes pictures; it never fails on how a screen looks.
