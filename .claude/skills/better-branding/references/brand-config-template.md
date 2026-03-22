# Brand Config Template

This is the template for `brand.config.ts` — the single source of truth for all design tokens. Copy this into the project's `src/styles/` directory and customise the values to match the brand.

---

## Full Template

```typescript
// src/styles/brand.config.ts
// ============================================================
// BRAND CONFIG — Single source of truth for all design tokens.
// Edit values here. Everything else derives from this file.
// ============================================================

export const brand = {
  // ------------------------------------------------------------------
  // COLOURS
  // ------------------------------------------------------------------
  // Each colour has a full scale (50–950) for maximum flexibility.
  // "DEFAULT" is the primary swatch used in Tailwind shorthand (e.g. `bg-primary`).
  colors: {
    primary: {
      50:  '#f0f5ff',
      100: '#e0ebff',
      200: '#b8d4ff',
      300: '#85b8ff',
      400: '#4d96ff',
      500: '#1a74ff',
      600: '#005ce6',  // DEFAULT — main brand colour
      700: '#004ab8',
      800: '#003a8f',
      900: '#002a66',
      950: '#001a40',
      DEFAULT: '#005ce6',
    },
    secondary: {
      50:  '#f5f3ff',
      100: '#ebe5ff',
      200: '#d4c8ff',
      300: '#b8a3ff',
      400: '#9b7dff',
      500: '#7e57ff',
      600: '#6633e6',
      700: '#5228b8',
      800: '#3e1e8f',
      900: '#2c1566',
      950: '#1a0d40',
      DEFAULT: '#6633e6',
    },
    accent: {
      50:  '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
      DEFAULT: '#f97316',
    },
    neutral: {
      50:  '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    // Semantic colours
    success: { light: '#22c55e', dark: '#4ade80', DEFAULT: '#22c55e' },
    warning: { light: '#eab308', dark: '#facc15', DEFAULT: '#eab308' },
    error:   { light: '#ef4444', dark: '#f87171', DEFAULT: '#ef4444' },
    info:    { light: '#3b82f6', dark: '#60a5fa', DEFAULT: '#3b82f6' },
  },

  // Semantic surface/text colours for light and dark modes
  semantic: {
    light: {
      background:    '#ffffff',
      surface:       '#ffffff',
      surfaceRaised: '#fafafa',
      surfaceSunken: '#f5f5f5',
      textPrimary:   '#171717',
      textSecondary: '#525252',
      textTertiary:  '#a3a3a3',
      border:        '#e5e5e5',
      borderStrong:  '#d4d4d4',
    },
    dark: {
      background:    '#0a0a0a',
      surface:       '#171717',
      surfaceRaised: '#262626',
      surfaceSunken: '#0a0a0a',
      textPrimary:   '#fafafa',
      textSecondary: '#a3a3a3',
      textTertiary:  '#525252',
      border:        '#262626',
      borderStrong:  '#404040',
    },
  },

  // ------------------------------------------------------------------
  // TYPOGRAPHY
  // ------------------------------------------------------------------
  typography: {
    fontFamily: {
      display: '"Instrument Serif", Georgia, serif',
      body:    '"DM Sans", system-ui, sans-serif',
      mono:    '"JetBrains Mono", "Fira Code", monospace',
    },
    fontSize: {
      xs:   ['0.75rem',  { lineHeight: '1rem' }],
      sm:   ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem',     { lineHeight: '1.5rem' }],
      lg:   ['1.125rem', { lineHeight: '1.75rem' }],
      xl:   ['1.25rem',  { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem',  { lineHeight: '2rem' }],
      '3xl': ['1.875rem',{ lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem',    { lineHeight: '1.15' }],
      '6xl': ['3.75rem', { lineHeight: '1.1' }],
      '7xl': ['4.5rem',  { lineHeight: '1.05' }],
    },
    fontWeight: {
      light:    300,
      normal:   400,
      medium:   500,
      semibold: 600,
      bold:     700,
      black:    900,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight:   '-0.025em',
      normal:  '0',
      wide:    '0.025em',
      wider:   '0.05em',
      widest:  '0.1em',
    },
  },

  // ------------------------------------------------------------------
  // SPACING
  // ------------------------------------------------------------------
  // Based on a 4px base unit. Use these for all padding, margin, gap.
  spacing: {
    px:  '1px',
    0.5: '0.125rem',  // 2px
    1:   '0.25rem',   // 4px
    1.5: '0.375rem',  // 6px
    2:   '0.5rem',    // 8px
    2.5: '0.625rem',  // 10px
    3:   '0.75rem',   // 12px
    4:   '1rem',      // 16px
    5:   '1.25rem',   // 20px
    6:   '1.5rem',    // 24px
    8:   '2rem',      // 32px
    10:  '2.5rem',    // 40px
    12:  '3rem',      // 48px
    16:  '4rem',      // 64px
    20:  '5rem',      // 80px
    24:  '6rem',      // 96px
  },

  // ------------------------------------------------------------------
  // BORDER RADIUS
  // ------------------------------------------------------------------
  borderRadius: {
    none: '0',
    sm:   '0.25rem',   // 4px — subtle rounding
    md:   '0.5rem',    // 8px — default for buttons, inputs
    lg:   '0.75rem',   // 12px — cards, containers
    xl:   '1rem',      // 16px — large cards, modals
    '2xl': '1.5rem',   // 24px — prominent containers
    full: '9999px',    // pill shape
  },

  // ------------------------------------------------------------------
  // SHADOWS
  // ------------------------------------------------------------------
  shadows: {
    light: {
      sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md:  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg:  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl:  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },
    dark: {
      sm:  '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      md:  '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
      lg:  '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
      xl:  '0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
    },
  },

  // ------------------------------------------------------------------
  // BREAKPOINTS (mobile-first)
  // ------------------------------------------------------------------
  breakpoints: {
    sm:  '640px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
    '2xl': '1536px',
  },

  // ------------------------------------------------------------------
  // MOTION
  // ------------------------------------------------------------------
  motion: {
    duration: {
      instant: '50ms',
      fast:    '150ms',
      normal:  '250ms',
      slow:    '400ms',
      slower:  '600ms',
    },
    easing: {
      default:   'cubic-bezier(0.4, 0, 0.2, 1)',
      in:        'cubic-bezier(0.4, 0, 1, 1)',
      out:       'cubic-bezier(0, 0, 0.2, 1)',
      inOut:     'cubic-bezier(0.4, 0, 0.2, 1)',
      spring:    'cubic-bezier(0.34, 1.56, 0.64, 1)',
      bounce:    'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
} as const;

export type BrandConfig = typeof brand;
```

---

## Generating CSS Custom Properties

Create a `globals.css` that maps tokens to CSS variables. This can be done manually or via a build script. Here's the manual approach:

```css
/* src/styles/globals.css */

:root {
  /* Colours — Primary */
  --color-primary-50:  #f0f5ff;
  --color-primary-100: #e0ebff;
  --color-primary-200: #b8d4ff;
  --color-primary-300: #85b8ff;
  --color-primary-400: #4d96ff;
  --color-primary-500: #1a74ff;
  --color-primary-600: #005ce6;
  --color-primary-700: #004ab8;
  --color-primary-800: #003a8f;
  --color-primary-900: #002a66;
  --color-primary-950: #001a40;

  /* ... repeat for secondary, accent, neutral ... */

  /* Semantic — Light mode */
  --color-background:      #ffffff;
  --color-surface:          #ffffff;
  --color-surface-raised:   #fafafa;
  --color-surface-sunken:   #f5f5f5;
  --color-text-primary:     #171717;
  --color-text-secondary:   #525252;
  --color-text-tertiary:    #a3a3a3;
  --color-border:           #e5e5e5;
  --color-border-strong:    #d4d4d4;

  /* Semantic colours */
  --color-success: #22c55e;
  --color-warning: #eab308;
  --color-error:   #ef4444;
  --color-info:    #3b82f6;

  /* Typography */
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  --font-size-xs:   0.75rem;
  --font-size-sm:   0.875rem;
  --font-size-base: 1rem;
  --font-size-lg:   1.125rem;
  --font-size-xl:   1.25rem;
  --font-size-2xl:  1.5rem;
  --font-size-3xl:  1.875rem;
  --font-size-4xl:  2.25rem;
  --font-size-5xl:  3rem;
  --font-size-6xl:  3.75rem;

  --font-weight-light:    300;
  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  /* Spacing */
  --spacing-1:  0.25rem;
  --spacing-2:  0.5rem;
  --spacing-3:  0.75rem;
  --spacing-4:  1rem;
  --spacing-5:  1.25rem;
  --spacing-6:  1.5rem;
  --spacing-8:  2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  --spacing-20: 5rem;

  /* Border radius */
  --radius-sm:   0.25rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.75rem;
  --radius-xl:   1rem;
  --radius-2xl:  1.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* Motion */
  --duration-instant: 50ms;
  --duration-fast:    150ms;
  --duration-normal:  250ms;
  --duration-slow:    400ms;
  --ease-default:     cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-bounce:      cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Dark mode overrides */
[data-theme="dark"],
.dark {
  --color-background:      #0a0a0a;
  --color-surface:          #171717;
  --color-surface-raised:   #262626;
  --color-surface-sunken:   #0a0a0a;
  --color-text-primary:     #fafafa;
  --color-text-secondary:   #a3a3a3;
  --color-text-tertiary:    #525252;
  --color-border:           #262626;
  --color-border-strong:    #404040;

  --color-success: #4ade80;
  --color-warning: #facc15;
  --color-error:   #f87171;
  --color-info:    #60a5fa;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.5);
}
```

---

## Tailwind Integration

Extend `tailwind.config.ts` to reference the brand config tokens. This lets you use both Tailwind utilities and brand tokens seamlessly:

```typescript
// tailwind.config.ts
import { brand } from './src/styles/brand.config';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: brand.colors,
      fontFamily: {
        display: [brand.typography.fontFamily.display],
        body:    [brand.typography.fontFamily.body],
        mono:    [brand.typography.fontFamily.mono],
      },
      borderRadius: brand.borderRadius,
      // Tailwind already has good spacing — only extend if custom scale needed
    },
  },
};
```

---

## Customisation Guide

When setting up a new project's brand config:

1. **Start with the palette.** Choose a primary brand colour and generate the scale using a tool like the OKLCH colour scale generator, or manually adjust lightness/saturation.
2. **Pick typography.** Choose a display font with character (serifs, geometric sans, or something distinctive) and a body font optimised for readability. Import via `@fontsource` packages or `next/font`.
3. **Adjust radius.** Rounded brands use larger radii (lg/xl defaults). Sharp/brutalist brands use sm or none.
4. **Set motion personality.** Playful brands use spring/bounce easings. Professional brands use default/inOut.
5. **Test in both modes.** Every token pair (light/dark) must pass WCAG AA contrast ratios.
