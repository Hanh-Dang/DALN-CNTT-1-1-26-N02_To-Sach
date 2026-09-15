---
name: Safe Marketplace
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#44474d'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#75777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4d5f7d'
  primary: '#000615'
  on-primary: '#ffffff'
  primary-container: '#0b1f3a'
  on-primary-container: '#7587a7'
  inverse-primary: '#b5c7ea'
  secondary: '#835500'
  on-secondary: '#ffffff'
  secondary-container: '#feae2c'
  on-secondary-container: '#6b4500'
  tertiary: '#000904'
  on-tertiary: '#ffffff'
  tertiary-container: '#002516'
  on-tertiary-container: '#009a6a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b5c7ea'
  on-primary-fixed: '#071c36'
  on-primary-fixed-variant: '#364764'
  secondary-fixed: '#ffddb4'
  secondary-fixed-dim: '#ffb955'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#633f00'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  price-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  container-max-width: 1280px
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
---

## Brand & Style

This design system establishes a welcoming, dependable peer-to-peer literary ecosystem centered on community trust, effortless book discovery, and transparent exchanges. The design balances the scholarly gravitas of classic publishing with the approachability and agility of modern consumer commerce.

### Brand Personality & Tone
- **Trustworthy & Grounded:** Anchored by deep navy tones that project structural safety, verified seller reliability, and financial integrity during transactions.
- **Warm & Encouraging:** Subtle accents of energized warm amber-orange foster discovery, reader passion, and friendly neighbor-to-neighbor book rehoming.
- **Orderly & Literate:** Spacious, structured card grids and immaculate typographic pacing allow book jackets, seller annotations, and condition metrics to breathe without visual noise.

### Design Movement: Modern Card-Based Utilitarian
The interface synthesizes Scandinavian clarity with warm e-commerce functionality. Surfaces rely on crisp cool-white containers nested against gentle off-slate backgrounds. High contrast is maintained through charcoal typography rather than pitch black, preventing visual fatigue during extended catalog browsing. Tactile elements use subtle ambient drops, hairline structural borders, and cohesive corner radiuses to reinforce physical tangibility.

## Colors

The color palette is built around structural confidence and distinct transactional accents. The foundation uses high-ratio contrast tokens optimized for clear reading under both indoor lighting and mobile environments.

### Primary: Deep Navy (`#0B1F3A`)
The cornerstone of platform authority. Used for header navigation bars, persistent footers, primary interactive titles, and major transactional indicators. Tiered values include:
- `primary-dark`: `#071426` (Deep surface anchors, heavy toolbars)
- `primary-base`: `#0B1F3A` (Default brand anchor, structural cards, primary text links)
- `primary-surface`: `#132A4A` (Hover states on dark headers, secondary brand containers)
- `primary-muted`: `#1A365D` (Selected states in dark navigation controls)

### Secondary: Warm Orange (`#F5A623`)
The energetic functional accent reserved for core actions: call-to-action buttons ("Mua ngay", "Đăng bán"), unread notifications, active search highlights, and star ratings.
- `secondary-base`: `#F5A623` (Buttons, key conversion drivers)
- `secondary-hover`: `#E09612` (Pressed/hover interaction state)
- `secondary-subtle`: `#FEF6EC` (Background fill for condition badges, promotional ribbons, and discount tags)

### Neutrals & Backgrounds
- `canvas-default`: `#F8FAFC` (Page-level background tone providing soft, low-glare reading contrast)
- `surface-card`: `#FFFFFF` (Primary elevation layer for product cards, dialogue drawers, and inputs)
- `border-subtle`: `#E2E8F0` (Default element separation and card perimeter stroke)
- `border-strong`: `#CBD5E1` (Input borders, table headers, and structural grid rules)
- `text-primary`: `#1E293B` (Primary reading charcoal, high-contrast without being harsh)
- `text-secondary`: `#334155` (Book authors, category taxonomies, subheadings)
- `text-muted`: `#64748B` (Timestamps, ISBN tags, inactive placeholder metadata)

### Semantics
- `success`: `#10B981` / Background: `#ECFDF5` (Verified seller badge "Người bán uy tín", completed transactions)
- `warning`: `#F59E0B` / Background: `#FFFBEB` (Pending escrow, low inventory notice)
- `danger`: `#EF4444` / Background: `#FEF2F2` (Out of stock, dispute notifications, form errors)
- `info`: `#3B82F6` / Background: `#EFF6FF` (Shipping tracking milestones, marketplace guides)

## Typography

The geometric, friendly curves of Plus Jakarta Sans offer high legibility across catalog metadata, Vietnamese diacritics, and varied density book titles.

### Typographic Rhythm
- **Hierarchical Discipline:** Book titles inside catalog tiles strictly employ `headline-sm` with a fixed two-line clamp (`48px` height envelope) to guarantee horizontal baseline symmetry across grid rows.
- **Monetary Precision:** The specialized `price-display` token uses `700` bold weight paired with a clear Vietnamese Dong currency symbol (`₫`). Discounted original prices render at `body-sm` using `text-muted` and a single-line strikethrough.
- **Badge Readability:** Micro-metadata such as condition percentages ("95% mới") and seller trust tags utilize `label-sm` with uppercase transformation and letter-spacing for sharp micro-scale legibility.

## Layout & Spacing

Layouts follow an 8-point spatial model configured for a responsive 12-column grid system with consistent margins and gutters.

### Form Factor Adaptations
- **Desktop (≥ 1024px):** Max container width of `1280px` centered with variable margins. Grid uses 12 columns with `1.5rem` (`24px`) gutters. Book catalog views default to 4 or 5 columns.
- **Tablet (768px – 1023px):** 8-column layout with `1rem` (`16px`) gutters and `1.5rem` outer page margins. Catalog displays standard 3-column book cards. Filter panels collapse into an off-canvas drawer.
- **Mobile (≤ 767px):** 4-column layout with `0.75rem` (`12px`) inner gutters and `1rem` outer margins. Book discovery presents an optimized 2-column card matrix. Sticky bottom bars pin primary navigation and contextual buy/sell actions.

### Density & Rhythms
- Product listings maintain an explicit `1rem` card-body padding to prevent vertical bloat while framing imagery comfortably.
- Detail pages group metadata (publisher, publication year, condition notes, seller profile) into clean `1.5rem` rhythmic content modules.

## Elevation & Depth

This system avoids aggressive dark drop shadows, adopting an ambient, navy-tinted light diffusion model that simulates physical paper surfaces lying on a flat desk.

### Surface Elevation Levels
- **Level 0 (Flat Ground):** `#F8FAFC` background canvas with zero shadow.
- **Level 1 (Card Default):** `#FFFFFF` surface accompanied by a structural border `1px solid #E2E8F0` and subtle navy-tinted ambient drop:
  `box-shadow: 0 4px 20px -2px rgba(11, 31, 58, 0.06);`
- **Level 2 (Hover & Active Product Card):** Elevation increases dynamically on pointer hover with upward physical translation (`translateY(-4px)`):
  `box-shadow: 0 10px 25px -4px rgba(11, 31, 58, 0.12), 0 4px 10px -2px rgba(11, 31, 58, 0.04);`
  Border tightens visually to `#CBD5E1`.
- **Level 3 (Sticky Headers, Floating Bars & Dropdowns):**
  `box-shadow: 0 12px 30px -6px rgba(11, 31, 58, 0.15);`
- **Level 4 (Modals, Checkout Drawers):** Supported by a deep backdrop scrim (`rgba(11, 31, 58, 0.5)`) and a broad diffused lift:
  `box-shadow: 0 24px 48px -12px rgba(11, 31, 58, 0.25);`

## Shapes

With a roundedness index of `2`, interface surfaces adopt balanced curvature that softens the dense information architecture while avoiding childlike or overly pill-shaped forms.

### Corner Radii Guidelines
- **Micro Radii (`0.375rem` / `6px`):** Rating star badges, book condition tags, stock chips, input checkboxes.
- **Standard Radii (`0.5rem` / `8px`):** Form inputs, default buttons, book cover artwork containers, alert toasts.
- **Container Radii (`0.75rem` to `1rem` / `12px` to `16px`):** Main product cards, seller profile summaries, checkout review summary cards.
- **Full Pill (`9999px`):** Exclusively reserved for floating counter badges, active category filter pills, and user avatar wrappers.

## Components

### Buttons
- **Primary CTA:** Deep Navy (`#0B1F3A`) background, `#FFFFFF` text, `0.5rem` radius, `0.75rem 1.5rem` padding. On hover: transitions smoothly to `#132A4A`.
- **Accent CTA (Buy/Cart):** Warm Orange (`#F5A623`) background with `#FFFFFF` bold text. On hover: shifts to `#E09612`.
- **Secondary / Outline:** `#FFFFFF` background with `1px solid #CBD5E1` border and `#1E293B` text. On hover: border switches to `#0B1F3A` with subtle background wash (`#F8FAFC`).
- **Text Link Button:** No background, `font-weight: 600`, `#0B1F3A` text with an underline animation on hover.

### Book Marketplace Card (Focal Component)
- **Container:** `#FFFFFF` background, `0.75rem` border-radius, `1px solid #E2E8F0` border, Level 1 shadow.
- **Media Box:** 3:4 aspect ratio frame. Contains high-resolution book jacket photo with `object-fit: cover` and a faint inner border (`1px solid rgba(0,0,0,0.04)`).
- **Condition Tag:** Floating top-left badge on image (`#FEF6EC` fill, `#F5A623` text, `0.25rem` radius, e.g., "Mới 95%").
- **Content Area:** 
  - Author and category in `body-sm` (`#64748B`).
  - Book title in `headline-sm` (`#1E293B`), line-clamped to 2 lines.
  - Seller trust row: Tiny verified icon with "Người bán uy tín" chip in `#ECFDF5` background with `#10B981` text.
  - Price block: Display current price (`#0B1F3A`, `price-display`) juxtaposed with struck-through original cover price (`#64748B`, `body-sm`).

### Chips & Badges
- **Reputation Badge:** Compact inline flex container, `0.25rem 0.5rem` padding, `0.375rem` radius. Uses semantic success/warning light tints (`#ECFDF5` for verified sellers, `#EFF6FF` for top community contributors).
- **Filter Chip:** `#F8FAFC` background, `1px solid #E2E8F0` border. Active state flips to `#0B1F3A` background with `#FFFFFF` text.

### Form Inputs
- **Text Fields:** Height `44px`, `0.5rem` radius, `1px solid #CBD5E1`, background `#FFFFFF`. Focus state: border color changes to `#0B1F3A` paired with an accessible focus ring (`3px outline rgba(11, 31, 58, 0.15)`).
- **Search Bar:** Prominent `48px` height with leading search icon, placeholder "Tìm sách, tác giả hoặc ISBN...", and trailing instant-filter trigger.

### Selection Controls
- **Checkboxes & Radios:** `18px` square/circle, `1.5px solid #CBD5E1`. Checked state fills with `#0B1F3A` and white check icon. Focus states share the standard primary focus ring.

### Lists & Transaction Feeds
- **Order / Message Items:** Separated by `1px solid #E2E8F0` horizontal divider rules. Hover state illuminates the entire list row with a `#F8FAFC` surface shift. Book thumbnail previews maintain `48px × 64px` sizing.