# Document 4 of 6 — App Flow
## Project: UAPA — End-to-End Autonomous PM Agent (with ValueForge Engine)

## 1. Route Map (Next.js 14 App Router)
```
/                          → Landing / sign in
/dashboard                 → List of user's projects (cards: idea name, current stage, status)
/project/new                → Stage 1: Idea Intake (chat)
/project/[id]/whitespace     → Stage 2: ValueForge Whitespace Engine
/project/[id]/definition     → Stage 3: Definition (Personas + RICE + PRD)
/project/[id]/prototype      → Stage 4: Prototype (software demo / physical concept)
/project/[id]/gtm            → Stage 5: GTM + Unit Economics
/project/[id]/tracking       → Stage 6: Post-launch Tracking Dashboard
/project/[id]/overview       → Read-only summary of all stage artifacts (export/download hub)
```

## 2. Screen-by-Screen Flow

### Screen: `/dashboard`
- Card grid of projects, each showing: idea name, product type icon (physical/software), current stage badge, last updated.
- "New Project" CTA → `/project/new`.

### Screen: `/project/new` — Idea Intake
- Chat UI (left) + live-filling structured brief panel (right): idea summary, problem statement, target user, product type, known competitors, constraints.
- Each agent turn fills one or more fields in the right panel in real time (visual confirmation of progress).
- "Looks good, continue →" button enabled once all required fields are filled; routes to `/project/[id]/whitespace` and kicks off Stage 2 automatically.

### Screen: `/project/[id]/whitespace` — ValueForge Engine
- SSE-streamed reasoning log (collapsible): "Searching competitors in [category]... found 12... clustering by price tier... analyzing review sentiment... cross-referencing Ai Palette consumer trend data... running failure-precedent match..."
- Once complete, renders the **Brand Brief** as structured cards:
  - Price-Tier Saturation Map (visual: bar chart of competitor density per tier, with the recommended tier highlighted)
  - Psychographic Target (the underserved consumer driver, with supporting data points)
  - Brand Credibility Assessment (if applicable)
  - Failure Simulation panel — list of precedent risks, each with a "why this is relevant" note and a suggested mitigation
  - Recommended Attributes (ingredients/packaging/positioning, or feature/positioning equivalents for software)
  - Every card has visible source citations (expandable footnotes)
- **Human checkpoint:** "Approve this Brand Brief" / "Request a different angle" (re-runs the engine with adjusted parameters) before continuing.
- "Continue to Definition →" → `/project/[id]/definition`

### Screen: `/project/[id]/definition`
- Tab 1: **Personas** — generated persona cards (editable fields).
- Tab 2: **Feature Prioritization** — table of candidate features with agent-suggested RICE inputs (Reach/Impact/Confidence pre-filled with reasoning shown on hover, Effort left for user input); sortable by RICE score; Priority label column.
- Tab 3: **PRD Preview** — full compiled PRD (Uber-template structure) rendered as a document, downloadable as Markdown/PDF.
- **Human checkpoint:** "Approve prioritization & PRD" before continuing.
- "Continue to Prototype →" → `/project/[id]/prototype`

### Screen: `/project/[id]/prototype`
- **If software:** embedded live preview (iframe) of the generated working demo + a "Open in new tab" link + downloadable code export.
- **If physical:** concept render image + spec sheet panel, with a persistent visible banner: *"Concept visualization — not an engineering-validated prototype."*
- "Continue to GTM →" → `/project/[id]/gtm`

### Screen: `/project/[id]/gtm`
- Tab 1: **GTM Plan** — the 7-row table, editable, auto-filled from prior stages.
- Tab 2: **Unit Economics** — input fields (CAC, ARPU, service cost, customer lifetime) → live-computed Gross Margin, LTV, CAC Payback, LTV:CAC ratio, with a plain-language verdict.
- Export both as a combined "Launch Pack" PDF.

### Screen: `/project/[id]/tracking`
- Empty state pre-launch: "Upload your post-launch metrics CSV to begin tracking."
- CSV upload → parses against fixed schema → renders dashboard: DAU/MAU trend, retention curve, NPS/CSAT trend, churn rate, revenue trend, funnel conversion chart.
- "Insights" panel: agent-flagged anomalies (e.g., "Retention dropped 8% after week 3 — possible onboarding friction") — each flagged insight has a "Send to Discovery as new pain point" button, which loops it back into Stage 2 for the next iteration cycle.

### Screen: `/project/[id]/overview`
- Single-page summary linking out to/exporting all 6 artifacts (Brand Brief, Personas, PRD, Prototype, GTM+Economics, Tracking Dashboard) — the "pitch-ready" view for sharing with a mentor/investor/stakeholder.

## 3. Cross-Cutting UX Rules
- Every SSE-streaming screen must show a visible step-by-step reasoning log, not just a loading spinner — this is core to the "transparent, not a black box" positioning from the PRD.
- Every stage's output is persisted immediately; users can navigate back to any prior stage without losing progress.
- The two human-approval checkpoints (post-Whitespace, post-Prioritization) block forward navigation until explicitly approved — this is a hard UX rule, not optional, per the PRD's non-functional requirements.
