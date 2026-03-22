---
name: better-branding
description: Build and maintain a consistent, brand-driven design system for React projects using Base UI as the headless component layer. Use this skill whenever the user wants to create a branded UI, build a design system, set up brand colours/tokens/typography, create branded components, build a landing page or dashboard with consistent styling, scaffold a new frontend project with a cohesive visual identity, or maintain consistency across pages and components. Also trigger when the user mentions "brand config", "design tokens", "component registry", "Base UI", brand colours, theming, or asks to make an existing UI consistent or "on brand." This skill pairs naturally with the frontend-design skill for aesthetic direction and the dieter-rams-design-principles skill for design rigour. Use it even when the user just says "build me a page" or "create a component" if there's an existing brand config or component registry in the project — consistency matters.
---

# Better Branding

A design-system-in-a-skill that enforces brand consistency across every component, page, and layout. It centres on two files that act as the project's source of truth:

1. **Brand Config** (`brand.config.ts`) — all design tokens: colours, typography, spacing, radii, shadows, breakpoints. Tweak this file and everything updates.
2. **Component Registry** (`component-registry.md`) — a living catalogue of every component built for the project, with its API, variants, and where it's used.

Every UI decision flows through these two files. No ad-hoc hex codes, no one-off font stacks, no rogue components.

---

## Core Workflow

When asked to build any UI (page, component, feature):

### 1. Check for existing brand infrastructure

Look for `brand.config.ts` and `component-registry.md` in the project. If they exist, read them first — they are your constraints. If they don't exist, create them before writing any component code.

### 2. Consult the Component Registry

Before building anything, check if a branded component already exists that does what's needed. The registry is organised by category (layout, navigation, data display, inputs, feedback, overlay). If a match exists, use it — import it directly, don't recreate it or reach past it to the underlying Base UI primitive. If a near-match exists, extend it with a new variant rather than duplicating.

### 3. Build from Base UI when no branded version exists

When a component is needed and no branded version exists in the registry, find the appropriate Base UI headless primitive. Base UI components ship with zero styling and solid interaction/accessibility patterns — they're the foundation, not the finished product. Style it with brand tokens via Tailwind classes or CSS variables, then register it before using it.

If no Base UI primitive covers the use case (rare), build a bespoke component following the same token-driven, accessible patterns. Crucially, bespoke components should compose from existing registry components internally — if the component needs a button, import the branded `Button`, don't write a raw `<button>`.

### 4. Register every new component

After creating a new component, add it to `component-registry.md` with its full entry (see the registry format in `references/component-registry-template.md`). A component that isn't registered doesn't exist as far as future work is concerned.

### 5. Apply design principles

Every layout and component decision should pass through the 7 UI design principles (hierarchy, progressive disclosure, consistency, contrast, accessibility, proximity, alignment) and Rams' "less but better" philosophy. Read `references/design-principles.md` for the full reference.

---

## Brand Config (`brand.config.ts`)

This is the single source of truth for all visual tokens. Read `references/brand-config-template.md` for the full template and usage guide.

The config exports:

- **Colour palette** — primary, secondary, accent, semantic (success/warning/error/info), plus full light/dark mode variants. Every colour has a scale (50–950) for flexibility.
- **Typography** — font families (display, body, mono), size scale, weight scale, line-height scale, letter-spacing. Import fonts via `next/font` or `@fontsource`.
- **Spacing** — a consistent spacing scale derived from a base unit.
- **Border radius** — a radius scale from sharp to pill.
- **Shadows** — elevation levels for light and dark modes.
- **Breakpoints** — mobile-first breakpoint values.
- **Motion** — duration and easing tokens for transitions.

### How the config flows into code

The config generates CSS custom properties that are applied at the `:root` level (light mode) and `[data-theme="dark"]` or `.dark` (dark mode). Components consume these via Tailwind's theme extension or direct `var()` references.

```
brand.config.ts → generates → globals.css custom properties
                → extends  → tailwind.config.ts theme
                → consumed by → every component via Tailwind classes
```

When the user changes a colour in `brand.config.ts`, it propagates everywhere — no find-and-replace needed.

---

## Component Registry (`component-registry.md`)

A markdown file that catalogues every component in the project. Read `references/component-registry-template.md` for the full format.

Each entry includes:
- **Name** and category
- **Base** — which Base UI primitive it wraps (or "bespoke" if none)
- **Variants** — size, colour, state variants
- **Props API** — the component's public interface
- **Usage locations** — where it's used in the project
- **Notes** — edge cases, accessibility considerations

### The component decision tree

Every time you need a UI element — whether it's the top-level thing being built or a sub-element inside it — run through this tree:

```
Need a UI element
  │
  ├─ Already branded in the Component Registry?
  │    → USE IT. Import it. Don't recreate it, don't reach past it
  │      to the raw HTML or Base UI version underneath.
  │
  ├─ Not branded yet, but Base UI has a primitive?
  │    → STYLE IT with brand tokens, register it, then use it.
  │      Read the relevant Base UI docs at:
  │      https://base-ui.com/react/components/<component-name>.md
  │
  └─ No Base UI primitive available?
       → BUILD BESPOKE. Token-driven, accessible, consistent with
         everything else. Register it.
```

This applies recursively. If you're building a PricingCard and it needs a button inside it, don't write a raw `<button>` — import the branded `Button` from the registry. If the registry doesn't have a Button yet, build one from Base UI first, register it, then use it inside PricingCard. Every element on screen should trace back to either a branded registry component or a brand token — never to an unstyled primitive or a hardcoded value.

---

## Layout System

All layouts use a mobile-first, grid-based approach:

### Grid

Use CSS Grid as the primary layout mechanism. Define grid templates using the brand config's spacing tokens and breakpoints.

```tsx
{/* Mobile: single column. Tablet: 2 cols. Desktop: 12-col grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-[var(--spacing-4)]">
  <main className="lg:col-span-8">...</main>
  <aside className="lg:col-span-4">...</aside>
</div>
```

### Mobile-first

Start every layout at the smallest viewport and layer up:
1. Stack everything vertically at mobile
2. Introduce side-by-side layouts at `md` (768px)
3. Full grid at `lg` (1024px)
4. Max-width container at `xl` (1280px)

Touch targets must be at least 44×44px on mobile. Spacing increases at larger breakpoints via responsive utility classes.

### Responsive component patterns

- **Navigation**: hamburger/drawer at mobile → horizontal nav at desktop
- **Cards**: full-width stack at mobile → 2-col grid at tablet → 3/4-col at desktop
- **Tables**: card-based at mobile → traditional table at desktop
- **Modals**: full-screen drawer at mobile → centred dialog at desktop

---

## Base UI Integration

Base UI (`@base-ui-components/react`) is the headless component layer. It provides:
- Keyboard navigation and focus management
- ARIA attributes and screen reader support
- Open/close state management for popups, dialogs, menus
- Composable sub-component architecture

### Key patterns

**Styling Base UI components**: Base UI components accept `className` and render plain DOM elements. Apply brand tokens via Tailwind:

```tsx
import { Dialog } from '@base-ui-components/react/dialog';

<Dialog.Root>
  <Dialog.Trigger className="bg-[var(--color-primary-600)] text-white px-4 py-2 rounded-[var(--radius-md)]">
    Open
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop className="fixed inset-0 bg-black/40" />
    <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-[var(--spacing-6)] shadow-[var(--shadow-lg)]">
      <Dialog.Title className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)]">
        Title
      </Dialog.Title>
      <Dialog.Description>Content here</Dialog.Description>
      <Dialog.Close />
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>
```

**Data attributes for states**: Base UI exposes states via `data-*` attributes. Use these for conditional styling:

```css
/* Style a pressed toggle */
[data-pressed] { background: var(--color-primary-600); }

/* Style a disabled input */
[data-disabled] { opacity: 0.5; cursor: not-allowed; }

/* Style an open accordion panel */
[data-open] { border-color: var(--color-primary-400); }
```

**Composition**: Wrap Base UI primitives in branded components that pre-apply your tokens:

```tsx
// components/ui/Button.tsx — your branded button
import { Button as BaseButton } from '@base-ui-components/react/button';

const variants = {
  primary: 'bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]',
  secondary: 'bg-[var(--color-secondary-100)] text-[var(--color-secondary-900)]',
  ghost: 'bg-transparent hover:bg-[var(--color-neutral-100)]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({ variant = 'primary', size = 'md', className, ...props }) {
  return (
    <BaseButton
      className={`${variants[variant]} ${sizes[size]} rounded-[var(--radius-md)] font-[var(--font-weight-medium)] transition-colors duration-[var(--duration-fast)] ${className ?? ''}`}
      {...props}
    />
  );
}
```

This branded `Button` is what goes in the component registry and what every page imports — never the raw Base UI primitive directly.

### Available Base UI components

Consult the Base UI documentation index (provided in context or at https://base-ui.com/react/components/) for the full list. Key primitives you'll use most often:

**Layout & Navigation**: Accordion, Tabs, Toolbar, Navigation Menu, Scroll Area
**Data Input**: Input, Number Field, Checkbox, Radio, Select, Combobox, Autocomplete, Slider, Switch, Toggle, Toggle Group
**Feedback**: Dialog, Alert Dialog, Drawer, Toast, Popover, Tooltip, Preview Card, Progress, Meter
**Structure**: Separator, Collapsible, Menu, Context Menu, Menubar
**Forms**: Field, Fieldset, Form, Checkbox Group

---

## Design Principles (Quick Reference)

These 7 principles guide every layout and component decision. See `references/design-principles.md` for full detail.

1. **Hierarchy** — Size, weight, contrast, and spacing signal importance. Users should grasp priority at a glance.
2. **Progressive Disclosure** — Show what's needed now, reveal complexity on demand. Don't overwhelm.
3. **Consistency** — Same component, same behaviour, everywhere. Deviations need strong justification.
4. **Contrast** — Use it strategically to draw attention. Primary actions get high contrast; secondary ones recede.
5. **Accessibility** — WCAG AA minimum. Proper colour contrast, keyboard nav, ARIA labels, alt text, focus indicators.
6. **Proximity** — Related elements stay together. Unrelated elements have clear separation.
7. **Alignment** — Grid-based alignment creates order. Clean lines feel professional.

---

## Dark Mode

Every component must support both light and dark modes. The brand config defines both palettes. Implementation:

- CSS custom properties switch values based on `[data-theme="dark"]` or the Tailwind `dark:` variant
- Semantic colour names (surface, text-primary, border-default) abstract away the actual hex values
- Test every component in both modes — contrast ratios must pass WCAG AA in both
- Shadows typically need to be darker/more prominent in dark mode
- Images and illustrations may need adjusted opacity or alternative versions

---

## File Structure Convention

```
src/
├── styles/
│   ├── brand.config.ts        ← design tokens (THE source of truth)
│   └── globals.css             ← generated CSS custom properties
├── components/
│   ├── ui/                     ← branded Base UI wrappers
│   │   ├── Button.tsx
│   │   ├── Dialog.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── layout/                 ← layout components (Header, Footer, Grid, Container)
│   └── [feature]/              ← feature-specific compositions
├── component-registry.md       ← living catalogue
└── app/ or pages/              ← routes/pages consuming the above
```

---

## Reference Files

Read these for detailed templates and guidance:

- `references/brand-config-template.md` — Full brand.config.ts template with all token categories, CSS variable generation, and Tailwind integration patterns
- `references/component-registry-template.md` — Registry format, entry template, and example entries
- `references/design-principles.md` — The 7 UI design principles in full, with application guidance for digital interfaces
