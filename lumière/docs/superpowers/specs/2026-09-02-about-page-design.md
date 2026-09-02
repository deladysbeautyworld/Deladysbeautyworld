appro# Design Spec: About Page - De Lady's Beauty World
Date: 2026-09-02
Status: Draft

## 1. Purpose & Goals
The goal of the About page is to transition the visitor from a casual browser to a loyal customer by establishing deep trust. It aims to position De Lady's Beauty World not just as a retailer, but as a "beauty institution" and a "trusted partner for life."

**Success Criteria:**
- Clearly communicates the founder's vision and the brand's origin story.
- Establishes the brand as an authority in authenticity and education.
- Provides clear, accessible information about the physical locations in Abuja.
- Aligns with the existing premium, minimalist aesthetic of the site.

## 2. User Experience & Narrative Flow
The page follows a "Heart $\to$ Head $\to$ Hand" flow:
1. **Heart (Emotional Connection):** The Hero and Narrative section connects the user to Florence's mission.
2. **Head (Logical Trust):** The "Gold Standard" and "Expert Guidance" sections prove the brand's authority.
3. **Hand (Action/Accessibility):** The "Footprint" section tells the user where and how to find them.

## 3. Detailed Section Specifications

### 3.1 Hero & Narrative
- **Visual:** High-impact split layout. Left: Imagery of the founder/store. Right: Typography-focused narrative.
- **Headline:** "Redefining Beauty Standards in Abuja and Beyond."
- **Sub-headline:** "More than a retail brand—a beauty institution dedicated to authenticity, education, and the empowerment of every woman."
- **Narrative Content:** A "Letter from the Founder" style text focusing on the fight against counterfeit products and the commitment to selling confidence through truth and authenticity.

### 3.2 The Gold Standard (Authority)
- **Visual:** A clean grid of trust-badges/icons.
- **Headline:** "Uncompromising Quality, Unwavering Trust."
- **Core Claims:**
    - **100% Authentic:** Every product vetted for provenance.
    - **Climate-Relevant:** Products selected for African skin and climate.
    - **Efficacy-First:** Rigorous vetting for actual results.
- **Copy:** Emphasis on being "the filter" in an era of beauty misinformation.

### 3.3 Expert Guidance (The Value-Add)
- **Visual:** Sophisticated imagery depicting a beauty consultation.
- **Headline:** "Your Virtual Dermatologist & Makeup Artist."
- **Key Messaging:** Beauty is an education. Focus on personalized guidance (layering skincare, finding undertones).
- **CTA:** "Start Your Journey" $\to$ links to `/routines` or `/contact`.

### 3.4 The Footprint (Accessibility)
- **Visual:** A list-based layout with clear addresses, potentially with a "Visit us" map style.
- **Locations:**
    - Habo Mall, #128 Adetotunbo Ademola Crescent, Wuse II.
    - Cappadors Center, Alexandria Crescent, Off Aminu Kano Crescent (Beside Banex Plaza), Wuse II.
    - #44 1st Avenue, Gwarinpa (Beside Amba Bakery).
- **Logistics:** Highlight same-day Abuja delivery and dependable nationwide shipping.

## 4. Technical Implementation
- **Component:** New page component `src/pages/About.jsx`.
- **Styling:** Use existing CSS variables (`--color-ink`, `--color-cream`, etc.) and Tailwind utility classes to ensure visual consistency.
- **Routing:** Add a new route `/about` in the main app router.
- **SEO:** Implement `SEOMeta` with a focused title ("About Us | De Lady's Beauty World") and a description highlighting authenticity and expertise.
