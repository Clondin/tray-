# ProForma Architecture & Design System Notes

This document outlines the architectural and design system decisions made during the upgrade of the ProForma application from an MVP to a scalable SaaS product.

**1. Current Codebase Summary (Pre-Refactor)**

*   **Main Layout & Routing:**
    *   A single-page application structure managed within one large component: `src/App.tsx`.
    *   Routing is handled by a `view` state (`useState`) and a `renderView()` function that conditionally renders view components (`Overview`, `PortfolioBuilder`, etc.).
    *   The main layout consists of a `TopBar` and a `GlassRootLayout` wrapper. A decorative `BackgroundGradientMesh` and `NoiseOverlay` are present.

*   **Components Used:**
    *   **Cards:** `Card.tsx` (generic wrapper), `MetricCard.tsx` (KPIs on Overview), `KpiCard.tsx` (used on Property Detail). These have inconsistent styling.
    *   **Tables:** Ad-hoc `<table>` elements are used directly in `Overview.tsx`, `StressTest.tsx`, and `FinancingCalculator.tsx` with inline Tailwind classes, leading to inconsistent styling.
    *   **Tags/Chips:** Simple `<span>` elements with conditional background colors are used for occupancy status in `Overview.tsx`.
    *   **Sliders:** A reusable `InputSlider.tsx` component exists.
    *   **Charts:** No charting library is currently implemented, but the structure implies future use.

*   **Design Tokens & Theme Logic:**
    *   No formal design token system exists.
    *   Styling is a mix of standard Tailwind CSS utility classes (e.g., `bg-white`, `border-gray-200`, `text-gray-900`) and a few custom CSS variables in `src/styles/global.css` for typography and spacing (e.g., `--font-hero`, `--space-4`).
    *   Colors are hardcoded (e.g., `bg-rose-600`, `text-green-600`).

*   **State Management & Calculations:**
    *   All application state (`assumptions`, `portfolios`, `selectedPortfolioId`, etc.) is managed with `useState` hooks in the root `App.tsx` component.
    *   State and action handlers are passed down through multiple levels of props (prop-drilling).
    *   Calculations are performed in utility functions (`/src/utils`) and memoized with `useMemo` and `useCallback` in `App.tsx`. This centralizes logic but makes the root component very large and tightly coupled.

**2. ProForma Design System**

This design system establishes a premium, consistent, and maintainable foundation for the ProForma application. It is implemented directly into the `tailwind.config.js` for optimal performance and developer experience.

*   **Color Tokens (by role):**
    *   `bg-app`: The base background color for the entire application.
    *   `bg-surface`: The primary background for components like cards and panels.
    *   `bg-surface-soft`: A slightly darker background for hover states or nested surfaces.
    *   `accent-primary`: The main brand color for interactive elements.
    *   `accent-soft`: A light background tint of the accent color.
    *   `accent-border`: A subtle border color derived from the accent.
    *   `status-success`, `status-warning`, `status-danger`, `status-info`: For semantic states.
    *   `status-success-soft`, `status-warning-soft`, etc.: Soft background variants for tags and alerts.
    *   `border-subtle`, `border-strong`: For dividers and component borders.
    *   `text-primary`, `text-secondary`, `text-muted`, `text-on-accent`: A clear text color hierarchy.

*   **Typography Scale:**
    *   `display`: `2.25rem` (36px), `font-bold` - For main page titles.
    *   `section`: `1.5rem` (24px), `font-semibold` - For major section headings.
    -   `card`: `1.125rem` (18px), `font-semibold` - For card titles.
    *   `body`: `0.9375rem` (15px), `font-normal` - For primary text content.
    *   `small`: `0.8125rem` (13px), `font-normal` - For metadata and secondary text.

*   **Spacing & Layout System:**
    *   The system uses a 4px base unit, mapped to Tailwind's default spacing scale.
    *   **Page Padding:** `p-6` or `p-8`
    *   **Card Padding:** `p-6`
    *   **Grid Gaps:** `gap-6`
    *   **Section Spacing:** `space-y-8`

*   **Shadow, Radius, and Elevation:**
    *   **Border Radius:** `radius-lg` (12px) for cards, `radius-md` (8px) for inputs/buttons, `radius-full` for pills.
    *   **Shadows:** `shadow-card` for base elevation, `shadow-card-hover` for interaction.

**3. Core Reusable Components**

*   **`AppLayout`:** The main application shell. Handles the global background, padding, and max-width.
*   **`KpiCard`:** Displays a key performance indicator. Props: `label`, `value`, `subValue`, `icon`, `trend` (positive/negative/neutral).
*   **`SectionCard`:** A generic container for content sections. Props: `title`, `children`. Applies consistent padding, background, and styling.
*   **`Tag`:** A small pill for displaying status or category. Props: `variant` (success, warning, danger, info, neutral).
*   **`DataTable`:** A styled wrapper for tables, ensuring consistent headers, rows, and spacing.
*   **`SidePanel`:** A slide-in panel for displaying detailed information. Props: `isOpen`, `onClose`, `title`, `children`.
*   **`ChartCard`:** A wrapper for data visualizations. Handles title, padding, and consistent height.

**4. Folder Structure & Architecture**

*   `/src/components/common`: Shared, reusable, "dumb" UI components (`KpiCard`, `Button`, `Tag`).
*   `/src/components/layout`: Components that define the application's structure (`AppLayout`, `TopBar`, `SidePanel`).
*   `/src/features/*`: Feature-specific components and views (e.g., `/src/features/overview/Overview.tsx`). This replaces the old `/src/views` folder.
*   `/src/store`: Global state management using Zustand.
*   `/src/hooks`: Reusable hooks, especially for complex calculations.
*   `/src/utils`: Pure, framework-agnostic utility functions (e.g., formatters).
*   `/src/design`: (This folder was requested but is replaced by extending `tailwind.config.js` directly, which is the idiomatic approach for a Tailwind project).

**5. State and Calculation Architecture**

*   **State Management:** All component-level `useState` has been lifted into a single global Zustand store (`/src/store/appStore.ts`). This eliminates prop-drilling and provides a single source of truth.
*   **Raw Input State:** Lives in the Zustand store (e.g., `assumptions`, `loanParams`).
*   **Derived Values:** Calculations are performed in selectors directly within the Zustand store. Zustand's built-in memoization prevents unnecessary recalculations, ensuring high performance. The `calculatedProperties` and `currentPortfolio` are now derived values.
*   **UI View State:** Also lives in the store (e.g., `view`, `selectedPortfolioId`, `sidePanelOpen`).
