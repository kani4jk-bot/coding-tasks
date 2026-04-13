# DESIGN.md — Airtable-inspired UI brief

Source basis:
- `VoltAgent/awesome-design-md` → Airtable entry
- `https://getdesign.md/airtable/design-md`

This is a local working brief for AI-assisted UI changes in this project.

## Brand feel

Bright, structured, and approachable. The interface should feel flexible and organized, with clean data-friendly surfaces, confident use of color, and an easy sense of movement between capture, identification, and follow-up plant care details.

## Core principles

1. **Structured but friendly**
   - Keep layouts orderly and easy to scan.
   - Balance utility with warmth so the app feels useful without becoming sterile.

2. **Clear modular sections**
   - Break the experience into obvious blocks for upload, identification result, facts, and care guidance.
   - Each section should have a single job and clear visual boundaries.

3. **Color with purpose**
   - Use fresh, upbeat accent colors to support clarity and energy.
   - Let color help distinguish plant facts, confidence, and growing guidance without becoming noisy.

4. **Useful information design**
   - Present names, confidence, descriptions, fun facts, and growing tips in a tidy, scannable way.
   - Favor compact clarity over decorative flourish.

5. **Fast, practical interactions**
   - Uploading and interpreting a result should feel immediate.
   - Prefer obvious actions, lightweight feedback, and minimal friction.

## Visual direction

### Typography
- Clean sans-serif typography with friendly clarity.
- Strong, readable headings for species names and section titles.
- Support text should stay compact and scannable.

### Color
- Neutral base with crisp white and soft gray surfaces.
- Add fresh, functional accents inspired by Airtable’s bright but disciplined palette.
- Use green and other natural accents carefully to reinforce plant-related information.

### Layout
- Prefer modular cards or panels with clear spacing.
- Keep the upload area prominent and the result view easy to scan top-to-bottom.
- Use a consistent spacing rhythm such as 8px/12px/16px/24px.

### Components
- Cards: clearly separated and lightly elevated.
- Buttons: simple, visible, and upbeat without looking childish.
- Inputs/upload zones: obvious, inviting, and cleanly framed.
- Lists/tips: structured into short chunks, tags, or rows where helpful.

## Interaction guidance for this app

This project is a plant identification app. Optimize for the flow:
1. upload or capture a plant photo
2. submit for identification
3. review common and scientific names
4. scan confidence, description, and fun facts
5. if relevant, review houseplant care guidance

### App-specific recommendations
- Make the upload state feel welcoming and clear.
- Let the plant image and species name anchor the result screen.
- Present fun facts and growing tips as tidy, modular sections rather than long text walls.
- Use small badges, chips, or labeled rows where they improve scanability.
- Keep the experience practical for repeated everyday use.

## Avoid

- Overly earthy, rustic styling that feels handmade instead of product-grade
- Heavy dashboards or complex sidebars
- Excessive gradients or decorative botanical illustration motifs
- Dense result cards with poor hierarchy
- Playful gimmicks that reduce clarity

## Implementation note for Claude Code

When making UI changes, apply these principles within the current React/FastAPI structure and favor pragmatic, incremental improvements that fit the existing component model.
