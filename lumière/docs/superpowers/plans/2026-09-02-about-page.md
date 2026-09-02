# About Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a high-conversion "About" page that establishes De Lady's Beauty World as a beauty institution through storytelling, authority, and accessibility.

**Architecture:** A single-page component `About.jsx` utilizing a vertical section-based layout. It will use the existing design system (Tailwind + CSS variables) to maintain a premium, minimalist aesthetic.

**Tech Stack:** React, React Router, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-02-about-page-design.md`

## Global Constraints
- Use site-wide CSS variables: `--color-ink`, `--color-cream`, `--color-muted`, `--color-faint`, `--color-border`.
- Typography: Use `font-display` for headings and `font-light` for body text to match the existing theme.
- Responsive Design: Mobile-first approach, ensuring accessibility on all screen sizes.
- SEO: Must include `SEOMeta` for the page.

---

### Task 1: Create About Page Component

**Files:**
- Create: `src/pages/About.jsx`

**Interfaces:**
- Consumes: `SEOMeta` component from `../utils/seo`.
- Produces: A React component that renders the About page.

- [ ] **Step 1: Scaffold the `About.jsx` file with basic imports and structure.**
- [ ] **Step 2: Implement the Hero & Narrative section.**
    - Headline: "Redefining Beauty Standards in Abuja and Beyond."
    - Sub-headline: "More than a retail brand—a beauty institution dedicated to authenticity, education, and the empowerment of every woman."
    - Body: The narrative content focusing on Florence's mission to fight counterfeit products and provide authentic beauty excellence.
- [ ] **Step 3: Implement the "Gold Standard" (Authority) section.**
    - Grid of trust badges: "100% Authentic", "Climate-Relevant", "Efficacy-First".
    - Content: "Uncompromising Quality, Unwavering Trust" messaging.
- [ ] **Step 4: Implement the "Expert Guidance" (Value-Add) section.**
    - Headline: "Your Virtual Dermatologist & Makeup Artist."
    - Body: Description of the educational approach (layering, undertones).
    - CTA: Link to `/routines` or `/contact`.
- [ ] **Step 5: Implement the "Footprint" (Accessibility) section.**
    - List the 3 locations: Habo Mall, Cappadors Center, and Gwarinpa.
    - Add logistics info: "Same-day delivery within Abuja. Dependable nationwide shipping."
- [ ] **Step 6: Add `SEOMeta` for title and description.**
- [ ] **Step 7: Verify visual consistency with `Home.jsx` and `Contact.jsx`.**
- [ ] **Step 8: Commit.**
```bash
git add src/pages/About.jsx
git commit -m "feat: implement About page with narrative and authority sections"
```

### Task 2: Register About Route

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `About` component from `./pages/About`.
- Produces: A registered route at `/about`.

- [ ] **Step 1: Import `About` component into `src/App.jsx`.**
- [ ] **Step 2: Replace the existing `ComingSoon` placeholder for the `about` path with the `About` component.**
```jsx
// From:
{ path: "about", element: <ComingSoon /> },
// To:
{ path: "about", element: <About /> },
```
- [ ] **Step 3: Verify the route works by navigating to `/about` in the browser.**
- [ ] **Step 4: Commit.**
```bash
git add src/App.jsx
git commit -m "feat: route /about to the new About page"
```
