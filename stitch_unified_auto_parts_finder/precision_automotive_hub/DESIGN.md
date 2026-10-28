---
name: Precision Automotive Hub
colors:
  surface: '#fbf8fc'
  surface-dim: '#dcd9dd'
  surface-bright: '#fbf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2f7'
  surface-container: '#f0edf1'
  surface-container-high: '#eae7eb'
  surface-container-highest: '#e4e1e5'
  on-surface: '#1b1b1e'
  on-surface-variant: '#44464e'
  inverse-surface: '#303033'
  inverse-on-surface: '#f3f0f4'
  outline: '#75777f'
  outline-variant: '#c5c6cf'
  surface-tint: '#4c5e86'
  primary: '#00081e'
  on-primary: '#ffffff'
  primary-container: '#0a1f44'
  on-primary-container: '#7687b2'
  inverse-primary: '#b4c6f4'
  secondary: '#535f72'
  on-secondary: '#ffffff'
  secondary-container: '#d7e3fa'
  on-secondary-container: '#596578'
  tertiary: '#160400'
  on-tertiary: '#ffffff'
  tertiary-container: '#3c1400'
  on-tertiary-container: '#e35f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b4c6f4'
  on-primary-fixed: '#041a3f'
  on-primary-fixed-variant: '#34466d'
  secondary-fixed: '#d7e3fa'
  secondary-fixed-dim: '#bbc7dd'
  on-secondary-fixed: '#101c2c'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb693'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7a3000'
  background: '#fbf8fc'
  on-background: '#1b1b1e'
  surface-variant: '#e4e1e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  button:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base-unit: 8px
  container-max-width: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
---

## Brand & Style

This design system is engineered for a high-end automotive marketplace that bridges the gap between industrial technicality and premium consumer experiences. The brand personality is **authoritative, meticulous, and resilient**, evoking the feeling of a high-performance engineering lab.

The visual style follows a **Corporate Modern** aesthetic with **Minimalist** layouts. It prioritizes clarity and high-information density without feeling cluttered. The interface utilizes generous whitespace to frame complex technical data, ensuring that every automotive component is presented as a high-value asset. Visual interest is maintained through sharp execution, subtle metallic textures, and a rigorous adherence to a technical grid.

## Colors

The palette is rooted in industrial reliability and high-visibility action.

- **Primary (Deep Blue):** Used for navigation, headers, and core brand moments to establish immediate trust and professional authority.
- **Secondary (Metallic Gray):** Applied to borders, backgrounds, and secondary icons to reflect the materiality of the automotive industry.
- **Tertiary (Vibrant Orange):** Reserved exclusively for high-priority Call to Actions (CTAs), alerts, and interactive states to ensure they pierce through the professional blue and gray.
- **Neutral (Carbon Black/Off-White):** A scale ranging from a deep carbon black for text to a very light cool-gray for backgrounds (#F8F9FA), maintaining a clean, technical atmosphere.

## Typography

The typography strategy employs a trio of typefaces to handle different information layers. **Hanken Grotesk** provides a sharp, contemporary edge for headlines, appearing both modern and highly professional. **Inter** is used for body copy and technical descriptions due to its exceptional legibility and neutral tone. **JetBrains Mono** is introduced for technical labels, SKU numbers, and part specifications to evoke a sense of precision and data-driven accuracy.

For mobile, scale down large display type by 20-30% while maintaining generous line heights to ensure readability during on-the-go technical lookups.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop to maintain a premium, editorial feel, transitioning to a fluid model on smaller screens. 

- **Desktop (1280px+):** 12-column grid with 24px gutters. Content is centered with wide margins to create a focused, high-end marketplace experience.
- **Tablet (768px - 1279px):** 8-column grid with 20px gutters and 32px side margins.
- **Mobile (Up to 767px):** 4-column grid with 16px gutters and 16px side margins.

A strict 8px spacing system governs all internal padding and margins, ensuring a rhythmic, systematic feel across all pages.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-contrast outlines** to define hierarchy, avoiding heavy shadows to keep the interface feeling clean and technical.

- **Level 0 (Background):** Solid off-white (#F8F9FA) for the main canvas.
- **Level 1 (Cards/Surface):** Pure white surfaces with a 1px solid border in Metallic Gray (#E2E8F0).
- **Level 2 (Interactive/Hover):** Subtle, highly diffused shadow (0px 4px 20px rgba(10, 31, 68, 0.08)) to indicate interactivity without breaking the flat, industrial aesthetic.
- **Level 3 (Modals/Overlays):** Stronger elevation with a 10% opacity primary color tint in the shadow to maintain brand cohesion.

## Shapes

The shape language is **Soft (Level 1)**. This subtle rounding (4px - 12px) balances the rigid, technical nature of automotive parts with a modern, user-friendly digital experience. 

- Standard components (inputs, buttons): 4px radius.
- Container elements (cards, sections): 8px radius.
- Promotional elements: 12px radius.

Avoid pill-shapes or fully circular buttons to maintain the professional, industrial tone.

## Components

- **Buttons:** Primary buttons use the Deep Blue with white text. CTA buttons (Buy, Checkout) use the Vibrant Orange to create a clear visual hierarchy. Use a heavy weight for button text.
- **Technical Chips:** Use for part categories or status (In Stock, OEM). Styled with the secondary Metallic Gray background and JetBrains Mono text.
- **Input Fields:** Sharp 1px borders in Gray. On focus, the border shifts to Deep Blue with a subtle 2px outer glow in the same color.
- **Cards:** Product cards must feature high-resolution imagery on white backgrounds. Technical specs should be aligned to a sub-grid within the card using the label-sm typography.
- **Search Bar:** A prominent, high-width component at the top of the marketplace, featuring a "Parts Compatibility" filter to reinforce the precision-focus of the platform.
- **Data Tables:** High-density tables for technical specifications, using zebra-striping in very light gray for row readability.