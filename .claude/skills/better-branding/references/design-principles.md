# 7 UI Design Principles

These principles guide every layout, component, and interaction decision. They're not a checklist to run through mechanically — they're a lens for making design decisions that serve users. When two options feel equivalent, test them against these principles to find the stronger choice.

---

## 1. Hierarchy

Users should recognise what matters most at a glance. Hierarchy is established through:

- **Font size and weight.** Larger and bolder text signals importance. Page titles > section headings > body text > captions. The difference between levels should be clearly perceptible — if you need to squint to tell a heading from body text, the hierarchy is too flat.
- **Contrast.** High-contrast elements (dark text on light, or vice versa) draw the eye first. Use lower contrast for supporting information.
- **Spacing.** More space around an element elevates its perceived importance. A heading with generous top margin commands more attention than one crowded against the preceding content.
- **Position.** What users see first (top-left in LTR layouts, above the fold) carries implicit priority.

**In practice:** Before building a page, rank the information by priority. The visual treatment should mirror that ranking — the most important thing should be the most visually prominent. If everything is bold, nothing is bold.

---

## 2. Progressive Disclosure

Show users what they need right now. Reveal complexity on demand. Too many options at once creates cognitive overload and decision paralysis.

**Techniques:**
- Multi-step forms that break a long process into digestible chunks
- Expandable sections (accordions, collapsibles) for secondary information
- "Show more" patterns for lists that could be overwhelming
- Contextual actions that appear on hover or selection
- Tabs that separate related but distinct content areas

**The orientation rule:** When using progressive disclosure, give users a way to know where they are (step indicators, breadcrumbs, progress bars) and how much remains. Losing users mid-flow is worse than showing everything upfront.

**The risk:** Hiding too much makes features undiscoverable. If users need a feature regularly, it shouldn't be buried three clicks deep. Progressive disclosure is for genuinely secondary information — not for making the interface look clean at the expense of usability.

---

## 3. Consistency

A consistent interface is a predictable interface, and predictability reduces cognitive load. Consistency operates at multiple levels:

- **Visual consistency.** The same component looks the same everywhere. A primary button is always the same colour, size, and shape. A card always has the same padding and radius.
- **Behavioural consistency.** The same interaction works the same way everywhere. If clicking a row in one table opens a detail view, it should do the same in every table.
- **Verbal consistency.** Use the same terminology throughout. Don't call it "Delete" in one place and "Remove" in another unless the actions are genuinely different.
- **Spatial consistency.** Navigation elements stay in the same position across pages. The primary action is always in the same corner of a card or dialog.

**Breaking consistency intentionally:** Deviations are acceptable when they communicate something important — a destructive button in red instead of the usual primary colour signals danger. But every deviation adds cognitive load. Have a strong reason, and make the deviation systematic (all destructive actions use red, not just some).

---

## 4. Contrast

Contrast directs attention. Use it strategically to guide users toward primary actions and away from secondary ones.

- **Primary actions** get the highest contrast: solid fill, brand colour, prominent size.
- **Secondary actions** get moderate contrast: outline style, neutral colour, smaller size.
- **Tertiary actions** get minimal contrast: text-only, subtle colour, smallest size.

**Beyond buttons:** Contrast applies to entire layouts. A feature you want users to notice can use a contrasting background colour, a card with a coloured border, or a badge/dot to draw the eye. Pricing pages use contrast to highlight the recommended plan. Error states use red contrast to demand attention.

**The danger:** Overusing high contrast makes everything fight for attention and nothing wins. Reserve the highest contrast for the single most important action on each screen.

---

## 5. Accessibility

Accessibility isn't an add-on — it's a fundamental quality measure. More than one in four users worldwide has some form of vision impairment. Building accessible interfaces serves everyone.

**Non-negotiable requirements (WCAG AA):**
- **Colour contrast.** Text must have at least 4.5:1 contrast ratio against its background (3:1 for large text). Interactive elements need 3:1 against adjacent colours.
- **Keyboard navigation.** Every interactive element must be reachable and operable via keyboard. Focus order must follow a logical reading sequence. Focus indicators must be clearly visible.
- **Screen reader support.** Semantic HTML elements (button, nav, main, heading levels). ARIA labels where semantics aren't sufficient. Alt text for meaningful images. Live regions for dynamic content.
- **Touch targets.** At least 44×44px on mobile devices. Sufficient spacing between targets to prevent misclicks.
- **Motion.** Respect `prefers-reduced-motion`. No flashing content above 3 flashes per second.
- **Text scaling.** Interfaces should remain usable when text is scaled to 200%.

**Base UI advantage:** Base UI components handle most keyboard navigation, focus management, and ARIA attribute concerns out of the box. Leveraging Base UI as the component primitive layer means accessibility is built into the foundation, not bolted on later.

---

## 6. Proximity

Elements that are logically related should be visually close together. Elements that are unrelated should have clear separation. This is how users build mental models of an interface — by interpreting spatial relationships.

**Applying proximity:**
- Group form labels with their inputs (label directly above or beside the field, not floating away from it)
- Keep action buttons near the content they act upon
- Separate distinct sections with whitespace, dividers, or contrasting backgrounds
- In navigation, group related links under clear categories

**The danger of false proximity:** If unrelated elements are placed too close together, users will assume a connection that doesn't exist. If related elements are too far apart, users won't see the relationship. Both create confusion.

**The spacing system from the brand config enforces proximity.** Using consistent spacing tokens (small gaps within groups, larger gaps between groups) automatically creates the right visual associations.

---

## 7. Alignment

Clean alignment creates visual order. Misaligned elements feel sloppy and erode trust, even if users can't consciously articulate why.

**Grid-based alignment:**
- Use a grid system (CSS Grid or a column system) to align content to a shared structure
- Align text, images, and interactive elements to the same vertical and horizontal lines
- When elements break the grid intentionally (for emphasis or visual interest), make the break deliberate and obvious — a slightly misaligned element looks like a mistake, while a dramatically offset element looks like a design choice

**Responsive alignment:**
- Maintain alignment at every breakpoint, not just desktop. A layout that's beautifully aligned at 1440px but ragged at 375px has failed.
- Re-evaluate alignment when content reflows from multi-column to single-column. The single-column mobile layout needs its own alignment logic, not just a squished version of the desktop grid.

---

## Applying the Principles Together

These principles reinforce each other:
- **Hierarchy + Contrast**: the visual hierarchy is established through contrast
- **Consistency + Proximity**: consistent spacing rules automatically create correct proximity groupings  
- **Progressive Disclosure + Hierarchy**: what's disclosed first should be what's highest in the hierarchy
- **Alignment + Accessibility**: proper alignment improves readability, which improves accessibility
- **Consistency + Accessibility**: consistent interaction patterns reduce the learning curve for assistive technology users

When principles conflict, use this priority order:
1. **Accessibility** — non-negotiable, always comes first
2. **Hierarchy** — users must understand what's important
3. **Consistency** — predictability reduces friction
4. **Everything else** — weigh based on context

The best designs feel inevitable — every element is where users expect it, doing what they need it to do. That feeling comes from applying these principles so thoroughly that the design recedes and the user's intent comes forward.
