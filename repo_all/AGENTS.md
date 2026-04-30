# Project Guidelines: Aether Study

## Design Philosophy (UI/UX Pro Max Standards)
- **Intelligent Design Systems:** Maintain mathematical consistency in typography, spacing, and color palettes.
- **Industry-Specific Reasoning (EdTech):**
    - **Cognitive Load Reduction:** Use minimalist layouts to help students focus on learning.
    - **Visual Hierarchy:** Clearly distinguish between primary study materials and secondary navigation.
    - **Accessibility:** Ensure high contrast and readable typography (Poppins) for long reading sessions.
- **Micro-Interactions:** Use `motion` (framer-motion) for purposeful feedback (hover states, smooth transitions).

## Device Constraint: Mobile-Only
- **CRITICAL:** All UI/UX changes and feature implementations MUST be optimized for and apply ONLY to the mobile view.
- **Implementation Strategy:**
    - Use Tailwind's base classes for mobile styles.
    - Avoid `md:`, `lg:`, etc., unless specifically needed to maintain existing desktop functionality without regression.
    - Prioritize touch targets (min 44px).
    - Use bottom sheets, mobile-friendly drawers, and stacked layouts.
    - Ensure all interactions are touch-optimized.

## Technical Stack
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion (via `motion/react`)
- **Routing:** React Router 7
- **AI:** Google Gemini API (@google/genai)
- **OCR:** Tesseract.js (for material processing)
