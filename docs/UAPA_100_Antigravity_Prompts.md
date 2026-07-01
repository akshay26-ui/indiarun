# UAPA Build Guide — 100 Antigravity Prompts

Built from your 6 project docs (Overview, PRD, TRD, App Flow, Backend Schema, Execution Plan). Paste these into Antigravity **one at a time, in order**. Stop at every checkpoint and actually look at what got built before continuing — don't batch multiple prompts without checking output, or errors compound.

---

## Paid Components → Free Substitutes

Your TRD/PRD assumed a few paid services. All are swapped for free equivalents below so V1 costs $0 to build and run at hobby scale.

| Original (paid) | Free substitute | Where it's used |
|---|---|---|
| Ai Palette API (consumer/FMCG trend data) | `pytrends` (free Google Trends wrapper) + free Hugging Face sentiment model (`distilbert-base-uncased-finetuned-sst-2-english`, runs locally) | Psychographic Driver Analysis (Prompt 29) |
| Paid image generation (DALL·E / Midjourney) | Pollinations.ai free image API — no key required | Physical prototype concept renders (Prompt 53) |
| Crayon (paid competitive-intel API) | Dropped entirely — it was already a Phase 7/stretch item, not needed for V1 | N/A |
| Paid web search / SERP API | `duckduckgo-search` Python package — free, no API key | Competitor Discovery (Prompt 26) |
| Assumed paid LLM (e.g. GPT-4 API) | Google Gemini API free tier (`gemini-2.0-flash`) | All agent reasoning (Prompt 11) |
| Paid Postgres hosting | Supabase or Neon free tier (500MB) | Database (Prompt 4) |
| Paid PDF generation API | WeasyPrint (free, open-source) | PRD & Launch Pack exports (Prompts 24, 72) |
| Paid hosting for SSE backend | Render free web service or Railway free trial (note: free tiers cold-start/sleep — mention this to users if latency matters) | Backend deploy |
| Paid frontend hosting | Vercel free tier (native Next.js support) | Frontend deploy + preview deploys (Prompt 52) |

Nothing below requires a credit card to build the full V1 pipeline.

---

## How to use this

- Work through prompts strictly in order — later ones depend on earlier ones (e.g. Phase 2's real Whitespace Engine replaces Phase 1's manual stub).
- At each **CHECKPOINT**, stop and review: does the code run, does the UI match the App Flow doc, does the data match the Backend Schema? Fix issues before moving on.
- If Antigravity's output drifts from a doc, paste the relevant doc section back in as context before the next prompt.

---

## Phase 0 — Foundations (Prompts 1–10)

1. Initialize a Next.js 14 project using App Router and TypeScript. Add Tailwind CSS and initialize shadcn/ui with the default theme. Set up placeholder pages for: `/`, `/dashboard`, `/project/new`, `/project/[id]/whitespace`, `/project/[id]/definition`, `/project/[id]/prototype`, `/project/[id]/gtm`, `/project/[id]/tracking`, `/project/[id]/overview`.
2. Initialize a FastAPI backend with a clean module structure: `/app/main.py`, `/app/routers`, `/app/models`, `/app/services`, `/app/db`. Add CORS config allowing the Next.js frontend origin.
3. Add a mock SSE endpoint at `POST /api/project/{id}/whitespace` that streams 3–4 fake `reasoning_step` events followed by a `final_output` event, using the `{type, payload}` event shape from the TRD, to validate the frontend SSE contract before any real agent exists.
4. Set up a free-tier Postgres database on Supabase (or Neon) and wire the connection string into FastAPI via environment variables. Use SQLAlchemy + Alembic for migrations.
5. Write the Alembic migration for the `users` and `projects` tables exactly as specified in the Backend Schema doc.

**✅ CHECKPOINT 1 — Review:** confirm the repo structure exists, the mock SSE endpoint streams fake events correctly, and the DB migration runs cleanly against your Supabase/Neon instance.

6. Implement JWT-based auth: `POST /api/auth/signup` and `/api/auth/login`, password hashing with passlib/bcrypt, and a `get_current_user` dependency for protected routes.
7. Build `/dashboard`: fetch the logged-in user's projects and render as cards (idea name, product type icon, current stage badge, last updated). Add a "New Project" button linking to `/project/new`.
8. Build a minimal `/project/new` page: a form to create an empty project (idea name + product type toggle), calling `POST /api/project`, then redirecting to `/project/[id]/whitespace`.
9. Connect the frontend SSE client (EventSource or fetch-stream) on `/project/[id]/whitespace` to the mock endpoint from Prompt 3, rendering reasoning steps as a collapsible live log.
10. Run an end-to-end smoke test: sign up, log in, create an empty project, see it appear on `/dashboard` with the correct status badge. Fix any breakage before Phase 1.

**✅ CHECKPOINT 2 — Review:** sign up → create project → see it on dashboard should work with zero manual DB edits. This is Phase 0's exit criteria per the Execution Plan.

---

## Phase 1 — Idea Intake + Definition Engine (Prompts 11–25)

11. Set up a Google Gemini API client in the FastAPI backend (free-tier `gemini-2.0-flash`) as the shared LLM utility for all agents. Store the API key in `.env`, never in frontend code.
12. Build the Intake Agent: given the running chat history, return updated structured fields matching the intake schema (`idea_summary, problem_statement, target_user, product_type, known_competitors[], constraints{budget,timeline}, category`) using Gemini JSON-mode/function-calling.
13. Build the `/project/new` chat UI: chat on the left, a live-updating structured brief panel on the right that highlights each field as it's filled.
14. Wire the Intake Agent's output to persist into `intake_briefs` on each turn; enable "Looks good, continue" only once all required fields are filled.
15. On continue, route to `/project/[id]/whitespace` and set `project.current_stage = 'whitespace'`.

**✅ CHECKPOINT 3 — Review:** have a real intake conversation end to end and check the `intake_briefs` row matches what you typed.

16. Build a temporary manual "fake Brand Brief" input form (dev-only) so the Definition Engine can be built before the real Whitespace Engine exists — this is the deliberate build order from the Execution Plan.
17. Build the Persona Generator: given the (stubbed) Brand Brief + intake brief, call Gemini to generate 1–2 personas matching the `personas` schema (`name, quote, demographics, goals[], pain_points[], scenario`).
18. Build the Feature/RICE module: generate candidate features with agent-suggested Reach/Impact/Confidence (with a short reasoning string per field, shown on hover); leave Effort for the user. Compute `rice_score = (reach*impact*confidence)/effort` and `priority_label`.
19. Build the PRD Agent: compile personas + features + brief into the Uber-template PRD structure from Document 2, output as `content_markdown`, persist to `prds` with `version=1`.
20. Build `/project/[id]/definition` with three tabs: Personas (editable cards), Feature Prioritization (sortable by RICE score), PRD Preview (rendered markdown, downloadable as `.md`).

**✅ CHECKPOINT 4 — Review:** open the definition page and confirm all three tabs render real (if stubbed) data correctly and the PRD reads coherently.

21. Add the "Approve prioritization & PRD" checkpoint button; block navigation to `/project/[id]/prototype` until clicked, and set `prds.approved = true`.
22. Add editable persona fields (inline edit, save on blur) that patch the `personas` table.
23. Add manual Effort input per feature row with live RICE recalculation and `priority_label` updates (pick and comment reasonable thresholds for very_high/high/medium/low).
24. Add PDF export for the PRD preview using WeasyPrint (free) — do not use a paid PDF API.
25. Test the full stubbed loop: intake → fake Brand Brief → personas → RICE table → downloadable PRD. Confirm this matches Phase 1's exit criteria before starting the real Whitespace Engine.

**✅ CHECKPOINT 5 — Review:** the entire Definition stage should work end to end on fake whitespace data. This de-risks Phase 2 by proving the downstream pipeline first.

---

## Phase 2 — ValueForge Whitespace Engine (Prompts 26–50)

*This is the hardest phase — go slower here and check each sub-module individually.*

26. Set up the `duckduckgo-search` Python package (free, no API key) as the web search tool for Competitor Discovery.
27. Build Competitor Discovery: given the intake brief's category/competitors, run DuckDuckGo searches, scrape top result pages with `requests` + `BeautifulSoup` (respect robots.txt), extract product name, price, and short review-snippet text.
28. Build Price-Tier Saturation: bucket discovered competitors into 3–4 price tiers, count density per tier, flag the least-saturated tier as `recommended: true`, matching the `price_tier_map` jsonb shape.
29. Replace the paid Ai Palette API for Psychographic Driver Analysis with a free stack: `pytrends` for demand-signal data, plus a free Hugging Face sentiment model (`distilbert-base-uncased-finetuned-sst-2-english`, local `transformers`, no key) to cluster review sentiment by motivation keyword (health, indulgence, convenience, sustainability).
30. Wire the Psychographic module's output into `psychographic_target` jsonb `{driver, evidence_summary}`; if data is too thin, mark the field `insufficient_data: true` rather than letting Gemini fabricate a value, per the TRD's hard rule.

**✅ CHECKPOINT 6 — Review:** run Competitor Discovery + Price-Tier + Psychographic on one real category and sanity-check the numbers against what you'd expect from a quick manual search.

31. Build Brand Credibility Assessment: if the user provided an existing brand name, scrape public mentions/reviews about it (same DuckDuckGo+BeautifulSoup pipeline) and have Gemini score plausibility of the new positioning against existing perception; skip entirely (nullable) if no brand was provided.
32. Curate a `failure_precedents` static JSON/table of 10–20 well-documented product failures (New Coke, Kodak, Google Glass, Juicero, Quibi, etc.), each tagged with a failure_cause category from the TRD's list.
33. Build Failure Simulation: compare the new idea's attributes against the curated precedents using Gemini (prompt-based similarity, no paid embedding API needed), surface the top 2–3 most relevant with `similarity_reason` and `mitigation_suggestion`.
34. Persist Failure Simulation output into `failure_risks` (`precedent_name, similarity_reason, mitigation_suggestion`) linked to `brand_brief_id`.
35. Build source citation tracking: every time a field is populated from a search result or scrape, write a row to `source_citations` (`field_referenced, source_url, source_type, retrieved_at`). Enforce at the application layer that `whitespace_summary`/`recommended_attributes` can't save without at least one citation.

**✅ CHECKPOINT 7 — Review:** check `failure_risks` and `source_citations` rows directly in the DB — every populated Brand Brief field should trace to at least one citation.

36. Build the Attribute Recommendation Engine last (it depends on the above): given validated whitespace + psychographic driver + failure risks, have Gemini recommend concrete attributes — ingredients/packaging/positioning for physical, feature/positioning for software — output as `recommended_attributes` jsonb.
37. Wire all five sub-modules into one async pipeline function `run_whitespace_engine(project_id)`, run in dependency order: Competitor Discovery + Price-Tier → Failure Simulation (parallel) → Psychographic → Attribute Recommendation last.
38. Convert the pipeline into the real SSE endpoint `POST /api/project/{id}/whitespace`, streaming a `reasoning_step` before/after each sub-module (e.g. "Searching competitors in [category]...") and a `final_output` with the full Brand Brief.
39. Persist the completed Brand Brief to `brand_briefs` and replace the frontend mock SSE endpoint from Prompt 3 with this real one.
40. Build the real `/project/[id]/whitespace` UI: render the Brand Brief as structured cards (price-tier bar chart, psychographic target, brand credibility if applicable, failure simulation panel, recommended attributes), each with expandable source citation footnotes.

**✅ CHECKPOINT 8 — Review:** this is the core differentiator of the whole product — run it live, watch the reasoning log stream, and read the final Brand Brief critically for quality, not just correctness of wiring.

41. Add the "insufficient_data" UI treatment: any field marked `insufficient_data` renders as a visibly greyed-out "limited data mode" card instead of a normal result.
42. Add the human checkpoint UI: "Approve this Brand Brief" / "Request a different angle"; approve sets `brand_briefs.approved = true`, request-a-different-angle re-runs the pipeline with adjusted search parameters.
43. Replace the Phase 1 "fake Brand Brief" stub everywhere (Persona Generator, Feature/RICE module, PRD Agent) with the real approved Brand Brief.
44. Add rate-limiting/backoff around DuckDuckGo search and scrape calls; on repeated failure for a source, skip it gracefully and continue the pipeline rather than crashing.
45. Add caching for the scrape/search step (simple Postgres or in-memory cache keyed by category+competitor) so "request a different angle" doesn't redundantly re-scrape identical queries.

**✅ CHECKPOINT 9 — Review:** deliberately trigger a scrape failure (block a domain, kill your connection mid-run) and confirm the pipeline degrades gracefully instead of crashing.

46. Test the full Whitespace Engine on one real physical-product idea end to end — confirm every card has at least one citation and nothing is silently hallucinated.
47. Test the full Whitespace Engine on one real software-product idea end to end — confirm `recommended_attributes` correctly returns feature/positioning language, not ingredients/packaging.
48. Tune the Failure Simulation prompt if precedent matches feel generic — instruct Gemini to only surface a precedent with a specific, named similarity, not a vague "many products fail" statement.
49. Add a loading-state and partial-render UX for the ~30–60 second pipeline run, per the PRD's "transparent, not a black box" requirement.
50. Confirm Phase 2 exit criteria: Brand Brief generates with real, source-cited data for at least one physical-product test idea, end to end from intake through approval.

**✅ CHECKPOINT 10 — Halfway point. Full review recommended:** re-read the PRD's success metrics and confirm the Whitespace Engine genuinely satisfies "100% source-traceable" before moving on — this stage is the hardest to retrofit later.

---

## Phase 3 — Prototype Engine (Prompts 51–65)

51. Build the software prototype path: given the approved PRD's feature list, generate a Next.js/React component scaffold using shadcn/ui components (fixed component library, per the TRD).
52. Wire the software scaffold to auto-deploy to a free preview environment via Vercel's free preview deployments (API/CLI, no paid plan needed), returning the preview URL.
53. Build the physical prototype path: use Pollinations.ai's free image API (no key required) instead of a paid image-gen API to generate a concept render from `recommended_attributes`.
54. Build the structured spec sheet generator for physical products: have Gemini produce materials/format/packaging description fields matching the `spec_sheet` jsonb shape.
55. Enforce `concept_stage_disclaimer` at the application layer: hardcode it to always `true` and non-editable for `type='physical'` rows, per the schema's data integrity rule — backend validation, not just a frontend label.

**✅ CHECKPOINT 11 — Review:** confirm a physical prototype's disclaimer flag literally cannot be turned off via any API call, not just hidden in the UI.

56. Build `/project/[id]/prototype`: branch UI by `product_type` — software shows an embedded iframe preview + "open in new tab" + code export download; physical shows the concept image + spec sheet with a persistent, non-dismissible banner: "Concept visualization — not an engineering-validated prototype."
57. Build code export for software prototypes: zip the generated scaffold and serve via a signed download URL (local disk or free-tier Supabase storage — no paid storage API).
58. Add error handling for the Pollinations.ai call — retry once on failure, then fall back to a placeholder image with a "render unavailable, try again" state rather than blocking the pipeline.
59. Add the SSE reasoning log for the Prototype Engine (`POST /api/project/{id}/prototype`) with steps like "Reading PRD feature list...", "Scaffolding components...", "Deploying preview..." (software) or "Generating concept render...", "Drafting spec sheet..." (physical).
60. Test the software path end to end: confirm the deployed preview is genuinely clickable (buttons/forms respond), not a static screenshot, per the PRD's release criteria.

**✅ CHECKPOINT 12 — Review:** click through the deployed software preview yourself like a stranger would — does it actually function, or just look like it does?

61. Test the physical path end to end: confirm the disclaimer banner cannot be hidden via any UI state, and the spec sheet download has the disclaimer embedded in the file itself, not just on-screen.
62. Add a "Continue to GTM" button that persists prototype output to `prototypes` and advances `project.current_stage` to `'gtm'`.
63. Handle oversized feature lists: cap auto-scaffolding at the top 5–8 must-have features by RICE score, and note in the UI that lower-priority features weren't scaffolded.
64. Add basic component-library consistency checks (lint rule or generation prompt constraint) so scaffolded prototypes don't produce broken/unstyled shadcn usage.
65. Confirm Phase 3 exit criteria: a software idea produces a genuinely clickable demo; a physical idea produces a labeled concept render + spec sheet, both traceable back to Phase 2's Brand Brief.

**✅ CHECKPOINT 13 — Review:** both prototype paths should be demoable to someone else without you narrating caveats out loud.

---

## Phase 4 — GTM + Unit Economics (Prompts 66–75)

66. Build the deterministic Unit Economics calculator as a pure backend function (no LLM call): given CAC, ARPU, service_delivery_cost, customer_lifetime_months, compute `gross_margin, ltv, cac_payback_months, ltv_cac_ratio` exactly per the Backend Schema's formulas.
67. Build the `/project/[id]/gtm` Unit Economics tab: input fields for the four raw inputs, with computed metrics updating live as the user types (client-side recompute, backend as source of truth on save).
68. Add a Gemini-generated "plain-language verdict" narrative around the computed numbers — the only LLM-dependent part of this stage.
69. Build the GTM Plan generator: auto-populate the 7-row table (`objective, target_market, positioning, gtm_motion, packaging_strategy, key_differentiators[], success_metrics[]`) from the approved Brand Brief's positioning and PRD's target market data.
70. Build the GTM Plan tab as an editable table, persisting changes to `gtm_plans`.

**✅ CHECKPOINT 14 — Review:** manually verify the Unit Economics math against a spreadsheet calculation for one test case — this stage has zero tolerance for silent LLM math errors since it's meant to be deterministic.

71. Add validation so Unit Economics inputs can't be negative and CAC/ARPU aren't accidentally swapped (inline warning, not a hard block).
72. Build the combined "Launch Pack" PDF export (GTM Plan + Unit Economics) using WeasyPrint — no new paid PDF service.
73. Add a "Continue to Tracking" button that persists both `gtm_plans` and `unit_economics` and advances `project.current_stage` to `'tracking'`.
74. Add the SSE reasoning log for this stage's one LLM call (the verdict narrative), for consistency with the rest of the pipeline's transparency requirement.
75. Confirm Phase 4 exit criteria: both the GTM table and Unit Economics panel render correctly and export together as a single Launch Pack PDF.

**✅ CHECKPOINT 15 — Review:** open the exported Launch Pack PDF and check it reads like something you'd actually hand to a mentor or investor.

---

## Phase 5 — Tracking Dashboard, V1 scope (Prompts 76–90)

76. Design the fixed CSV schema for upload (`date, dau, mau, retention_rate, nps_score, csat_score, churn_rate, revenue, funnel_conversion_rate`) and write a free CSV parser/validator (pandas or Python's `csv` module — no paid data-processing API).
77. Build `POST /api/project/{id}/tracking/upload`: validate the uploaded CSV against the fixed schema, reject with clear row-level errors on mismatch, bulk-insert valid rows into `tracking_metrics` with `source='csv_upload'`.
78. Build the `/project/[id]/tracking` empty state: "Upload your post-launch metrics CSV to begin tracking" with drag-and-drop.
79. Build the dashboard charts using Recharts or Chart.js (both free/open-source) for DAU/MAU trend, retention curve, NPS/CSAT trend, churn rate, revenue trend, funnel conversion — pulled via `GET /api/project/{id}/tracking/dashboard`.
80. Build anomaly-flagging as simple threshold-based diffing (e.g. flag if `retention_rate` drops more than X% week-over-week) — no ML model needed for V1.

**✅ CHECKPOINT 16 — Review:** upload a real (or synthetic) CSV and confirm every chart renders correctly against it.

81. Wire flagged anomalies into `feedback_loop_events` (`insight_summary, triggered_by_metric_id, sent_to_discovery=false`).
82. Build the Insights panel on `/project/[id]/tracking` listing each flagged anomaly with a human-readable summary (e.g. "Retention dropped 8% after week 3 — possible onboarding friction").
83. Build the "Send to Discovery as new pain point" button: on click, set `sent_to_discovery=true` and inject the insight into the project's Discovery-stage input queue (append to `intake_briefs` or a new pain-point queue table you define) so the next Whitespace Engine run can reference it.
84. Add a re-run affordance: let the user trigger a fresh Whitespace Engine pass incorporating the new pain-point insight, without losing the original approved Brand Brief (version it, don't overwrite).
85. Add support for multiple CSV uploads over time (append, not overwrite) with de-duplication by date.

**✅ CHECKPOINT 17 — Review:** confirm the feedback loop actually closes — an uploaded CSV's flagged insight should be visible back in the Whitespace stage's input, not just sitting inert in a table.

86. Add indexes for `tracking_metrics.project_id + date` and `source_citations.brand_brief_id` per the Backend Schema's indexing notes, to keep chart queries fast as data grows.
87. Add a "Download sample CSV" template on the empty-state screen so users know the exact expected column format.
88. Add clear per-row error reporting on invalid CSV uploads (e.g. "Row 14: retention_rate must be numeric") rather than a generic failure message.
89. Test the full tracking loop: upload a sample CSV with an intentional retention drop, confirm the dashboard renders correctly and the anomaly is flagged and creates a real `feedback_loop_events` + pain-point row.
90. Confirm Phase 5 exit criteria: uploading a sample CSV produces a working dashboard and at least one flagged insight that successfully creates a new pain-point entry.

**✅ CHECKPOINT 18 — Review:** this closes the full product loop described in Document 1's vision — confirm it actually feels closed, not just technically wired.

---

## Phase 6 — Polish + End-to-End Test (Prompts 91–100)

91. Run one full physical-product idea through all 6 stages (intake → whitespace → definition → prototype → gtm → tracking) without manual intervention beyond the two approval checkpoints; log every friction point or breakage.
92. Run one full software-product idea through the same 6-stage path and log friction points separately, since the Prototype Engine's branching differs.
93. Fix state-persistence issues found in the two runs above — per the Execution Plan, this is the most likely failure point in a multi-stage pipeline (confirm users can navigate back to any prior stage without losing data).
94. Build `/project/[id]/overview`: a single read-only page linking out to/summarizing all 6 stage artifacts (Brand Brief, Personas, PRD, Prototype, GTM+Economics, Tracking Dashboard) as the pitch-ready export/summary screen.
95. Add a single combined export from the overview page (a zip of all individual exports, or one master PDF) for sharing with a mentor/investor/stakeholder.

**✅ CHECKPOINT 19 — Review:** hand the overview page to someone else (or pretend you're a stranger) and see if it reads as a coherent, pitch-ready summary without extra explanation from you.

96. Add graceful error/retry UI states across all SSE endpoints so no stage can silently fail without a clear message and a retry option, per the PRD's release criteria.
97. Do a final pass ensuring no unsourced Whitespace claims can reach the UI (spot-check several `source_citations` rows against their rendered cards).
98. Do a final pass ensuring every free-tier substitution (Gemini, DuckDuckGo search, pytrends, Hugging Face sentiment model, Pollinations.ai images, Vercel/Render/Supabase free tiers) is actually wired in correctly, with no leftover placeholder paid-API code paths.
99. Review and tighten environment variable/secrets handling (Gemini key, DB connection string, JWT secret) — confirm nothing is exposed to the frontend bundle.
100. Do a final full re-run of both test ideas (physical + software) end to end on a clean database to confirm V1's "Definition of Done" from the Execution Plan is genuinely met.

**✅ CHECKPOINT 20 — Final review before shipping V1:** re-read Document 6's "Definition of Done" section word for word and check off each clause against what you just built.

---

## Notes

- **Cold starts:** free-tier backend hosts (Render/Railway free) sleep after inactivity — the first SSE request after idle time will be slow. Fine for a demo/pitch, worth mentioning if a mentor tests it live.
- **Scrape fragility:** DuckDuckGo scraping is free but less reliable than a paid SERP API — Prompt 44's retry/skip logic is doing real work here, don't skip it.
- **Gemini free tier limits:** if you hit rate limits during heavy testing (Phase 2/3 especially), add simple request throttling rather than upgrading to a paid tier — V1 doesn't need production-scale throughput.
