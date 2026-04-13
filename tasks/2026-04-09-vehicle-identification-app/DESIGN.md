# DESIGN.md — Tesla-inspired UI brief

Source basis:
- `VoltAgent/awesome-design-md` → Tesla entry
- `https://getdesign.md/tesla/design-md`

This is a local working brief for AI-assisted UI changes in this project.

## Brand feel

Minimal, high-contrast, and performance-focused. The interface should feel sleek, confident, and engineered, with clean surfaces, strong visual restraint, and a sense that every control exists for a reason.

## Core principles

1. **Radical simplicity**
   - Strip away nonessential visual noise.
   - Let layout, typography, and spacing do the work instead of decorative UI treatment.

2. **Engineering-led polish**
   - The product should feel precise and intentional.
   - Interactions should read as efficient and modern rather than playful.

3. **Hero media first**
   - Vehicle imagery should feel prominent and premium.
   - Give captured photos and identified results room to breathe.

4. **Strong hierarchy, restrained accents**
   - Use mostly neutral tones with selective emphasis.
   - Primary actions and key stats should stand out without cluttering the screen.

5. **Performance mindset**
   - Flows should feel fast, direct, and friction-light.
   - Every step from capture to result should feel streamlined.

## Visual direction

### Typography
- Clean sans-serif typography with confident, minimal styling.
- Larger headings should feel crisp and premium.
- Body text should stay concise and highly legible.

### Color
- Dominant palette: white, black, charcoal, steel gray.
- Accent color should be sparse and intentional.
- Use red or blue only where the existing product logic truly benefits from a strong signal.

### Layout
- Prefer wide, calm spacing and simple screen structures.
- Keep controls aligned and sparse.
- Favor full-width media, clean panels, and straightforward information stacks.

### Components
- Buttons: minimal and assertive, never ornamental.
- Cards/panels: restrained, flat or subtly elevated.
- Tabs/navigation: clean and obvious.
- Status/spec sections: concise, high-signal, low-noise.

## Interaction guidance for this app

This project is a vehicle identification app with a mobile-first capture flow. Optimize for:
1. capture or choose a vehicle photo
2. submit for identification
3. review the identified make/model/type details
4. scan specs, fun facts, and history
5. revisit previous identifications in history

### App-specific recommendations
- Make capture feel immediate and premium.
- Keep result screens focused on the image, core identification, and the most important specs first.
- Present supporting facts/history in clean secondary sections.
- Treat history and favorites as sleek, scan-friendly lists rather than dense cards.
- Maintain a polished native feel across Expo / React Native surfaces.

## Avoid

- Busy automotive-themed graphics, racing motifs, or faux-dashboard clutter
- Excessively glossy skeuomorphism
- Too many competing accent colors
- Dense control clusters or card-heavy layouts
- Playful styling that undermines the premium tone

## Implementation note for Claude Code

When making UI changes, apply these principles within the current FastAPI + Expo / React Native architecture and favor realistic, incremental refinements over speculative redesign churn.
