# Document 6 of 6 — Execution Plan
## Project: UAPA — End-to-End Autonomous PM Agent (with ValueForge Engine)

## 1. Guiding Principle
Build in the order that proves the riskiest assumptions first, and ship a working (even if narrow) end-to-end loop before widening scope — same MVP-first logic used throughout the PRD. Do not let any single stage (especially the ValueForge Whitespace Engine, which is the most ambitious piece) block progress on the rest of the pipeline.

## 2. Phased Build Plan

### Phase 0 — Foundations (Week 1)
- Set up Next.js 14 project (App Router, Tailwind, shadcn/ui).
- Set up FastAPI project with SSE endpoint scaffolding (use a mocked/static stream first to validate the frontend contract before any real agent logic exists).
- Set up Postgres schema (Document 5) and basic CRUD for `projects`.
- Set up auth (basic email/JWT is sufficient for V1).
- **Exit criteria:** a user can sign in, create an empty project, and see it on `/dashboard`.

### Phase 1 — Idea Intake + Definition Engine first (Week 2–3)
*Build Definition before Whitespace deliberately — it's lower-risk and lets you prove the PRD/persona/RICE generation loop while the harder Whitespace Engine is still being designed.*
- Build Intake Agent (chat → structured brief).
- Build Persona Generator + Feature/RICE module (can run on a manually-entered "fake" Brand Brief for now, since Whitespace isn't ready yet).
- Build PRD Agent (Uber-template compiler).
- **Exit criteria:** a user can take an idea from intake through a complete, downloadable PRD, with manually-stubbed whitespace data.

### Phase 2 — ValueForge Whitespace Engine (Week 4–6, the hardest phase)
- Start with **Competitor Discovery + Price-Tier Saturation** sub-modules (web search/scrape only — defer Ai Palette integration if access isn't ready yet).
- Add **Failure Simulation** — build a small curated dataset of historical failure precedents (10–20 well-documented cases, including the ones already in your PM notes: New Coke, Kodak, etc.) for the pattern-matching to reference; this doesn't require live data and can be built in parallel.
- Add **Psychographic Driver Analysis** — integrate Ai Palette API once access is confirmed; if not available in time, ship with a web-search/review-sentiment-only fallback (per the TRD's graceful-degradation rule) and flag it in the UI as "limited data mode."
- Add **Attribute Recommendation Engine** last, since it depends on the outputs of the above three.
- Wire the real Whitespace Engine output into the Definition stage from Phase 1, replacing the stubbed data.
- **Exit criteria:** Brand Brief generates with real, source-cited data for at least one physical-product test idea.

### Phase 3 — Prototype Engine (Week 7–8)
- Software path first (higher leverage, higher feasibility): build the PRD → component scaffold → preview deployment pipeline.
- Physical path second: image generation + spec sheet, with the disclaimer rule enforced per the schema.
- **Exit criteria:** a software idea produces a genuinely clickable demo; a physical idea produces a labeled concept render + spec sheet.

### Phase 4 — GTM + Unit Economics (Week 9)
- Build the deterministic Unit Economics calculator first (no LLM dependency, fastest to ship).
- Build the GTM table generator, auto-populated from Brand Brief + PRD data.
- **Exit criteria:** both render correctly and export as a combined "Launch Pack."

### Phase 5 — Tracking Dashboard, V1 scope only (Week 10)
- Build CSV upload + fixed schema parsing + dashboard charts.
- Build the anomaly-flagging logic (simple threshold-based diffing is sufficient for V1, no need for ML here).
- Build the "send to Discovery" feedback-loop action.
- **Exit criteria:** uploading a sample CSV produces a working dashboard and at least one flagged insight that successfully creates a new pain-point entry.

### Phase 6 — Polish + End-to-End Test (Week 11)
- Run one full physical-product idea and one full software-product idea through all 6 stages without manual intervention beyond the two approval checkpoints.
- Fix broken state-persistence issues (the most likely failure point in a multi-stage pipeline).
- Build the `/project/[id]/overview` export/summary screen.

### Phase 7 — Stretch / Phase 2 Roadmap (post-V1)
- Live integrations: Stripe, GA4, Mixpanel replacing manual CSV upload.
- Paid competitive-intelligence API option (e.g., Crayon) as an upgrade over public web search.
- Multi-product accounts, team collaboration, commenting.
- Engineering-feasibility-aware physical prototyping (CAD-adjacent tooling) — explicitly long-term, not implied as near-term in any pitch.

## 3. Team & Role Allocation (if solo, treat as a personal task sequence)
| Role | Primary phases |
|---|---|
| Backend/Agent Engineer | Phases 0, 1, 2, 5 |
| Frontend Engineer | Phases 0, 1, 3, 6 |
| You (Product Owner) | All phases — scope calls, mentor reviews at end of each phase, Whitespace Engine data-source decisions |

## 4. Risk Register
| Risk | Phase affected | Mitigation |
|---|---|---|
| Ai Palette API access delayed or unavailable | Phase 2 | Graceful-degradation fallback built in from the start, not bolted on later |
| Whitespace Engine takes longer than 3 weeks (likely, it's the hardest piece) | Phase 2 | Phases 3–5 don't structurally depend on a *complete* Whitespace Engine — they can proceed against stubbed/partial Brand Brief data if Phase 2 overruns |
| SSE streaming proves harder to deploy than expected (serverless timeout issues) | Phase 0, ongoing | Decided upfront in the TRD: avoid serverless functions for SSE endpoints, use a VM/container deploy target from day one |
| Scope creep into Phase 7 items before V1 ships | All | Hard rule: nothing from Phase 7 gets touched until Phase 6's end-to-end test passes |
| Physical prototype outputs misread as engineering-validated by a reviewer/stakeholder | Phase 3, ongoing | Schema-enforced disclaimer (Document 5) makes this structurally impossible to omit, not just a UI suggestion |

## 5. Definition of "Done" for V1
The project is V1-complete when: a real user can submit one idea, get a source-cited Brand Brief, approve it, get personas + a prioritized feature list + a full PRD, approve it, get a working prototype (software) or labeled concept (physical), get a GTM plan + unit economics, and — once they have real-world data — upload a CSV and see a tracking dashboard that successfully flags at least one actionable insight back into Discovery. That is the full closed loop, and it is the actual deliverable.
