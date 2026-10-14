---
name: Enterprise Messaging Operations
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#8cf1e1'
  on-secondary-container: '#006f64'
  tertiary: '#006b2e'
  on-tertiary: '#ffffff'
  tertiary-container: '#00873c'
  on-tertiary-container: '#f7fff3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#8ff4e3'
  secondary-fixed-dim: '#72d8c8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#66ff8e'
  tertiary-fixed-dim: '#3de273'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005322'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  mono-data:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system powers an internal enterprise management operations suite for high-volume WhatsApp Business accounts, campaign dispatching, automated routing, and account tier governance. 

### Brand Personality & Tone
- **Operational Precision:** Direct, unambiguous, and data-dense. The interface serves customer operations managers, tier-3 support leads, and compliance analysts who oversee thousands of incoming and outgoing conversational sessions per hour.
- **Controlled Calm:** High-scale messaging platforms inherently generate urgency (alerts, queue spikes, rate limit warnings). The visual landscape counters this with subdued backgrounds, structured layouts, and controlled saturation.
- **Ecosystem Authenticity:** The visual language echoes WhatsApp's signature emerald palette, translating consumer familiarities into a rigorous B2B workspace.

### Design Movement
The system relies on a **Corporate & Modern Precision** aesthetic:
- **Pristine card boundaries:** Crisp, low-contrast 1px separation lines over soft tinted canvases.
- **High-contrast readability:** Jet and slate typography layers ensuring zero eye fatigue under prolonged shifts.
- **Information Density:** Tight, calibrated component padding with deliberate hierarchy to accommodate multi-pane chat consoles, routing graphs, and metrics tables without visual fatigue.

## Colors

The palette establishes an ergonomic hierarchy optimized for long operating sessions while maintaining recognizable WhatsApp operational cues.

### Core Swatches
- **Primary Accent (`#059669`):** Forest Emerald. Used for authoritative primary actions, confirmed toggles, active navigation indicators, and key operational confirmations.
- **Secondary Accent (`#128C7E`):** Deep Teal. Used for interactive focus rings, secondary action states, deep telemetry charts, and nested conversation headers.
- **Tertiary Accent (`#25D366`):** WhatsApp Green. Reserved strictly for real-time live events, online status indicators, and positive throughput metrics.
- **Neutral Dark (`#0F172A`):** Slate 900. Primary text anchor, delivering WCAG AAA contrast against light card surfaces.

### Surface Tones & Canvases
- **App Canvas Background:** Alternates between `#F8FAFC` (Slate 50) and `#F1F5F9` (Slate 100) to distinguish global shells from modular panels.
- **Surface Elevation 0 (Panels/Cards):** Pure `#FFFFFF`.
- **Structural Dividing Lines:** `#E2E8F0` (Slate 200). Delivers subtle, razor-sharp separation without relying on heavy dropshadows.
- **Muted & Secondary Copy:** `#334155` (Slate 700) for labels, `#64748B` (Slate 500) for timestamps and metadata.

### System Diagnostics & Status Tones
- **Connected / Healthy:** `#059669` text on `#ECFDF5` background with `#A7F3D0` border.
- **Syncing / Throttled / Pending:** `#D97706` text on `#FFFBEB` background with `#FDE68A` border.
- **Disconnected / Banned / Rate Limited:** `#E11D48` text on `#FFF1F2` background with `#FECDD3` border.
- **System Neutral / Suspended:** `#475569` text on `#F1F5F9` background with `#CBD5E1` border.

## Typography

The design system exclusively adopts `Inter` across all structural tiers to preserve horizontal layout efficiency, optical balance across varied screen resolutions, and pristine tabular numeral alignment.

### Typographic Governance
- **Tabular Figures:** All metrics tables, queue counters, timestamps, and conversation payload monitors must activate OpenType tabular numbers (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during real-time streaming updates.
- **Hierarchy Mapping:** 
  - `display-lg` and `display-sm` are restricted to high-level system summaries and multi-account analytics headers.
  - `headline-sm` and `body-md` form the operational core of the application: table cell records, side-panel message cards, agent routing queues, and configuration forms.
  - `label-sm` handles high-visibility status pill metadata and form field labels; it utilizes subtle uppercase letter-spacing to ensure rapid parsing under high operational loads.

## Layout & Spacing

The layout philosophy centers on a **Multi-Pane Fluid Console** tailored for modern 16:9 and ultrawide enterprise workstations, adapting down to single-column oversight on mobile and field tablets.

### Grid & Pane System
- **Desktop (>= 1440px):** 3-pane responsive layout. Fixed 260px collapsible rail navigation, fluid 340px-440px thread/account listing pane, and flexible conversational or metrics workspace filling remaining horizontal viewport space.
- **Tablet (768px - 1439px):** 2-pane adaptive system with off-canvas slide-out global navigation.
- **Mobile (< 768px):** Single-pane sequential view with contextual stacked navigation.

### Spacing Rhythm
The spatial hierarchy adheres to a strict 4px/8px baseline grid:
- `space-xxs` (2px) and `space-xs` (4px) handle micro-alignments, tag internal spacing, and indicator margins.
- `space-sm` (8px) and `space-md` (12px) govern compact table cell padding, input internals, and grouped chat bubbles.
- `space-lg` (16px) establishes standard card interior padding.
- `space-xl` (24px) separates distinct functional widgets within the operations dashboard.

## Elevation & Depth

This system intentionally departs from heavy drop shadows, relying on **Low-Contrast Outlines & Surface Tiering** to maintain a crisp, enterprise-grade feel.

### Surface Elevation Levels
- **Level 0 (Canvas Base):** `#F8FAFC` or `#F1F5F9`. Uninterrupted underlying foundation for application shells.
- **Level 1 (Card & Module Layer):** `#FFFFFF`, surfaced with a 1px solid `#E2E8F0` border. No drop shadow in default resting states.
- **Level 2 (Hover & Active Contexts):** `#FFFFFF` with a 1px solid `#CBD5E1` border and a soft ambient blur: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Flyouts, Menus & Tooltips):** Pure `#FFFFFF` surface accompanied by a subtle floating shadow: `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)` surrounded by a 1px `#E2E8F0` border.
- **Level 4 (Modals & Emergency Drawers):** High-impact structural modal windows bounded by a 1px border and paired with a diffused ambient shadow: `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)` layered above a 40% `#0F172A` scrim.

## Shapes

The design system uses a **Soft Geometry** approach (Level 1) to convey precision, mechanical utility, and density without feeling sharp or harsh.

### Corner Radius Mapping
- **Base (0.25rem / 4px):** Applied to form controls, buttons, table row selection indicators, status badges, and message bubbles.
- **Medium (0.375rem / 6px):** Applied to card containers, metrics modules, modal sheets, and operational panels.
- **Large (0.5rem / 8px):** Applied to master system overlays, persistent floating action bars, and preview shells.
- **Full Pill (`9999px`):** Strictly reserved for numerical counter pills, online status avatars, and channel presence dots.

## Components

### Buttons
- **Primary:** Solid `#059669` background with `#FFFFFF` text. Hover shifts to `#047857`. Focus ring displays an offset 2px `#128C7E` halo. Vertical padding `8px`, horizontal `16px`, corner radius `4px`, font weight `600`.
- **Secondary / Subtle:** `#FFFFFF` background with 1px border `#E2E8F0`, `#334155` text. On hover, background shifts to `#F8FAFC` and border deepens to `#CBD5E1`.
- **Destructive:** White surface with `#E11D48` text and `#FECDD3` border. Hover transitions to `#FFF1F2`.
- **Icon Utility:** 32x32px flat square with 4px radius, transparent background, `#64748B` stroke icon, changing to `#F1F5F9` on hover.

### Badges & Status Chips
- **Geometry:** Height 22px, padding 2px 8px, 4px corner radius, font style `label-sm`.
- **Connected (Phone Number Online):** Text `#059669`, background `#ECFDF5`, border 1px solid `#A7F3D0`. Includes a 6px solid emerald pulsating dot.
- **Syncing (Syncing Queue / Processing Batch):** Text `#D97706`, background `#FFFBEB`, border 1px solid `#FDE68A`.
- **Disconnected / Revoked:** Text `#E11D48`, background `#FFF1F2`, border 1px solid `#FECDD3`.

### Input Fields & Selectors
- **Resting:** Background `#FFFFFF`, 1px solid `#CBD5E1`, text `#0F172A`, placeholder `#94A3B8`, height 36px, internal padding `0 12px`.
- **Active Focus:** Border transitions to `#059669` with an ambient glow of `0 0 0 3px rgba(5, 150, 105, 0.15)`.
- **Error State:** Border transitions to `#E11D48` with a focus halo of `0 0 0 3px rgba(225, 29, 72, 0.15)`.

### Cards & Container Panels
- Pure `#FFFFFF` background enclosed by a continuous 1px `#E2E8F0` border.
- Cards maintain divided header and body sections using 1px horizontal borders (`#E2E8F0`).
- Header height is standardized at 48px with internal vertical alignment, housing title (`headline-sm`) and contextual actions.

### Checkboxes & Radios
- Checkboxes: 16x16px with 3px border radius. Unchecked has 1.5px `#CBD5E1` border over `#FFFFFF`. Checked displays a solid `#059669` fill with a white checkmark.
- Radios: 16x16px full circle with a center `#059669` dot upon selection.

### Tables (Enterprise Data Grids)
- **Header:** Height 36px, background `#F8FAFC`, uppercase label tracking (`label-sm`), text `#64748B`, bottom border 1px `#E2E8F0`.
- **Row:** Height 44px, alternating hover background `#F8FAFC`, bottom border 1px `#F1F5F9`.
- **Cell Padding:** Horizontal 16px, vertical 10px. Numeric values right-aligned with `tabular-nums`.

### Conversational Preview Console
- Left agent message bubble: `#F1F5F9` background, `#0F172A` text, 4px border radius.
- Right outbound message bubble: `#DCF8C6` (WhatsApp soft green) or `#E8F5E9` background, `#0F172A` text, 4px border radius.
- Metadata strip: `#64748B` typography with micro checkmark icons (single gray tick for sent, double gray tick for delivered, double `#25D366` tick for read).