# Component Registry Template

This is the template for `component-registry.md` — the living catalogue of every UI component in the project. Keep this file in the project root or `src/` directory and update it every time a component is created, modified, or deprecated.

---

## Registry Format

Each component entry uses this structure:

```markdown
### ComponentName

| Field       | Value                                          |
|-------------|------------------------------------------------|
| Category    | layout / navigation / data-display / input / feedback / overlay |
| Base        | Base UI primitive name, or "bespoke"           |
| Path        | `components/ui/ComponentName.tsx`               |
| Status      | stable / beta / deprecated                     |

**Variants**
- `variant`: primary, secondary, ghost, destructive
- `size`: sm, md, lg

**Props**
| Prop      | Type                          | Default     | Description              |
|-----------|-------------------------------|-------------|--------------------------|
| variant   | 'primary' \| 'secondary' \| ... | 'primary'  | Visual style variant     |
| size      | 'sm' \| 'md' \| 'lg'         | 'md'        | Size preset              |
| disabled  | boolean                       | false       | Disables interaction     |

**Used in**: HomePage, SettingsPage, DashboardHeader

**Notes**: Wraps Base UI Button. Handles loading state with spinner.
```

---

## Categories

Organise the registry under these category headings:

### Layout
Components that structure the page: Container, Grid, Stack, Section, Divider, Spacer

### Navigation
Components for moving between views: Navbar, Sidebar, Breadcrumbs, Pagination, Tabs (navigation variant), Footer, MobileDrawerNav

### Data Display
Components that present information: Card, Badge, Avatar, Tag, Stat, DataTable, EmptyState, Skeleton

### Input
Components for user input: Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Slider, DatePicker, SearchInput, FileUpload

### Feedback
Components that communicate status: Toast, Alert, Progress, Spinner, Meter, Banner, StatusDot

### Overlay
Components that appear above the page: Dialog, AlertDialog, Drawer, Popover, Tooltip, ContextMenu, DropdownMenu, CommandPalette

---

## Example Registry

Here is an example of a populated registry to use as a model:

```markdown
# Component Registry

> Last updated: 2025-03-22
> Total components: 8

---

## Input

### Button

| Field       | Value                              |
|-------------|------------------------------------|
| Category    | input                              |
| Base        | @base-ui-components/react — Button |
| Path        | `components/ui/Button.tsx`         |
| Status      | stable                             |

**Variants**
- `variant`: primary, secondary, ghost, destructive, outline
- `size`: sm, md, lg
- `loading`: shows spinner, disables interaction

**Props**
| Prop      | Type                                          | Default     |
|-----------|-----------------------------------------------|-------------|
| variant   | 'primary' \| 'secondary' \| 'ghost' \| 'destructive' \| 'outline' | 'primary' |
| size      | 'sm' \| 'md' \| 'lg'                         | 'md'        |
| loading   | boolean                                       | false       |
| disabled  | boolean                                       | false       |
| asChild   | boolean                                       | false       |

**Used in**: All pages

**Notes**: Primary CTA uses `primary` variant. Destructive actions (delete, remove) use `destructive`. `ghost` for toolbar actions. All sizes meet 44px min touch target on mobile.

---

### Input

| Field       | Value                              |
|-------------|------------------------------------|
| Category    | input                              |
| Base        | @base-ui-components/react — Input  |
| Path        | `components/ui/Input.tsx`          |
| Status      | stable                             |

**Variants**
- `size`: sm, md, lg
- `state`: default, error, success (via Field wrapper)

**Props**
| Prop        | Type                           | Default |
|-------------|--------------------------------|---------|
| size        | 'sm' \| 'md' \| 'lg'          | 'md'    |
| placeholder | string                         | —       |

**Used in**: LoginForm, SettingsPage, SearchBar

**Notes**: Always wrap in `Field` component for label + validation. Uses `data-invalid` attribute from Field for error styling.

---

## Feedback

### Toast

| Field       | Value                              |
|-------------|------------------------------------|
| Category    | feedback                           |
| Base        | @base-ui-components/react — Toast  |
| Path        | `components/ui/Toast.tsx`          |
| Status      | stable                             |

**Variants**
- `type`: info, success, warning, error

**Props**
| Prop      | Type                                          | Default |
|-----------|-----------------------------------------------|---------|
| type      | 'info' \| 'success' \| 'warning' \| 'error'  | 'info'  |
| title     | string                                        | —       |
| duration  | number (ms)                                   | 5000    |

**Used in**: Global (via ToastProvider)

**Notes**: Uses semantic colours from brand config. Auto-dismisses after duration. Stacks from bottom-right on desktop, bottom-centre on mobile.

---

## Overlay

### Dialog

| Field       | Value                                 |
|-------------|---------------------------------------|
| Category    | overlay                               |
| Base        | @base-ui-components/react — Dialog    |
| Path        | `components/ui/Dialog.tsx`            |
| Status      | stable                                |

**Variants**
- `size`: sm (400px), md (560px), lg (720px), full (mobile only)

**Props**
| Prop      | Type                              | Default |
|-----------|-----------------------------------|---------|
| size      | 'sm' \| 'md' \| 'lg' \| 'full'   | 'md'    |
| title     | string                            | —       |

**Used in**: ConfirmDelete, EditProfile, CreateProject

**Notes**: Renders as full-screen drawer on mobile (< md breakpoint). Exports Dialog.Root, Dialog.Trigger, Dialog.Content, Dialog.Title, Dialog.Description, Dialog.Close sub-components.
```

---

## Maintenance Rules

1. **Always check the registry before creating a new component.** If something similar exists, extend it with a new variant rather than building from scratch.
2. **Update "Used in" when you add a component to a new page.** This helps track dependencies and impact of changes.
3. **Mark deprecated components clearly.** Don't delete entries — mark status as `deprecated` with a note pointing to the replacement. Remove after migration is complete.
4. **Keep the "Last updated" date current.** Update it every time the registry changes.
5. **Count total components.** Update the count in the header — it's a useful health metric. Fewer is generally better.
