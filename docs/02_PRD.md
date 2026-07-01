# Document 2 of 6 — Product Requirements Document (PRD)
## Project: UAPA — End-to-End Autonomous PM Agent (with ValueForge Engine)

---

### 1. Version Control
| Field | Value |
|---|---|
| Document | UAPA Master PRD v0.1 |
| Owner | Swastik (Product/Founder) |
| Status | Initial draft |
| Last updated | Current build cycle |
| Reviewed by | Pending mentor review |

### 2. Project Team
| Name/Role | Responsibility | Contact for |
|---|---|---|
| Product Owner (you) | Overall vision, prioritization calls | Strategy, scope decisions |
| Backend/AI Engineer | FastAPI + agent orchestration | Engine logic, API contracts |
| Frontend Engineer | Next.js 14 UI | App-flow, SSE rendering |
| (Optional) Data/ML support | Whitespace engine tuning, Ai Palette integration | Data sourcing, model accuracy |

### 3. Problem Definition
**Objective:** Let a user take a raw product idea through validated whitespace discovery, full PM documentation, a working prototype, a GTM plan, and post-launch tracking — without assembling a full PM/research/design team.

**Context:** Most early-stage product ideas fail validation not because the idea is bad, but because whitespace was never properly checked, failure precedents were never reviewed, and PM documentation (PRD, personas, prioritization) was skipped or done superficially under time/resource pressure.

**Opportunity:** Compress weeks of PM + market research + prototyping work into a guided, transparent, AI-assisted pipeline, monetizable to brand teams, founders, and innovation teams.

**Success metrics:**
- Time from idea intake → completed Brand Brief + PRD: target under 30 minutes of active engine time.
- Whitespace claims are 100% source-traceable (no unattributed claims).
- At least one full physical-product and one full software-product idea successfully traverse the entire pipeline end-to-end during testing.

### 4. User Personas & Use Cases
- **Brand Manager (Priya, FMCG)** — has a new snack concept; needs to know if the price tier is saturated, what consumer psychographic segment to target, and what packaging/ingredient direction supports differentiation.
- **Student/Early-stage Founder (you, as a proxy persona)** — has a software idea; needs personas, a PRD, and a clickable demo to pitch a club/competition/mentor without hiring a team.
- **Internal Innovation Lead** — wants a faster front-end to their existing NPD process; uses UAPA to generate first-draft artifacts that a human team then refines.

### 5. High-Level Solution
A guided multi-stage pipeline (chat-driven intake → discovery/whitespace engine → definition engine → prototype engine → GTM/economics engine → tracking dashboard), with each stage streaming its reasoning live (via SSE) and producing a structured, downloadable artifact. Stages are connected — outputs from one stage become inputs to the next automatically, with explicit human-approval checkpoints after Discovery and after Prioritization.

### 6. Proposed Approach (User Flow Summary)
1. User describes their idea in a guided intake chat → structured brief.
2. ValueForge engine runs whitespace analysis (price-tier saturation, psychographic fit, brand credibility) + failure simulation → Brand Brief, with human approval checkpoint.
3. Definition Engine generates personas + feature list → user adjusts RICE inputs → prioritized roadmap, with human approval checkpoint.
4. PRD Agent compiles everything into a full PRD.
5. Prototype Engine generates either a working software demo or a physical concept render + spec sheet.
6. GTM + Unit Economics engines generate the launch plan and financial model.
7. User launches in the real world; post-launch, they upload metrics (CSV, V1) into the Tracking Dashboard, which feeds new insights back into the Discovery stage.

*(Detailed screen-by-screen flow is in Document 4 — App Flow.)*

### 7. Product Definition

**7a. Functional Requirements**
- Guided idea-intake chat that outputs a structured JSON brief (problem, target user, physical/software, constraints, known competitors).
- ValueForge Whitespace Engine: ingests competitor data (via web search/scrape + Ai Palette API for consumer/FMCG data) and outputs (a) price-tier saturation map, (b) psychographic driver analysis, (c) brand credibility assessment, (d) failure-simulation report (precedent-matched risks), (e) attribute recommendations (ingredients/packaging/positioning for physical; feature/positioning equivalents for software).
- Persona Generator (from Whitespace Engine + intake data).
- RICE/MoSCoW Prioritization module with editable inputs and agent-suggested estimates (flagged as estimates).
- PRD Generator (Uber-style template, auto-populated from all prior stages).
- Prototype Generator:
  - Software: generates a real Next.js/React scaffold with working UI flows based on the PRD's feature list, deployed to a preview URL.
  - Physical: generates concept render (AI image generation) + spec sheet, explicitly labeled "concept visualization, not engineering-validated."
- GTM Generator (7-row condensed table, auto-filled from Whitespace + PRD data).
- Unit Economics Calculator (CAC, ARPU, service cost, gross margin, lifetime, LTV, CAC payback, LTV:CAC ratio).
- Tracking Dashboard: defined metrics schema (DAU/MAU, retention, NPS/CSAT, churn, revenue, funnel conversion) with manual CSV upload in V1; flags emerging issues and loops them back to the Discovery stage as new "pain point" inputs.

**7b. Non-Functional Requirements**
- Every stage must stream intermediate reasoning via SSE (no silent multi-minute waits).
- Every claim in the Whitespace Engine output must carry a source citation (URL/dataset reference).
- The system must never auto-finalize a strategic decision (pricing tier, feature cut, launch go/no-go) — it always presents options + a recommendation, with explicit user confirmation required to proceed.
- Session/project state persists across stages (no re-entering data already captured).
- System should support both "physical product" and "software product" idea types from the same intake flow, branching logic downstream.

**7c. Tech Stack**
- Frontend: Next.js 14, Tailwind, shadcn/ui components.
- Backend: FastAPI, Server-Sent Events (SSE) for streaming agent output.
- LLM orchestration: agent/tool-calling pattern (one agent per pipeline stage, see Document 3 — TRD).
- External integrations: Ai Palette API (consumer/FMCG market data), web search/scrape tooling (competitor data), image generation API (physical product concept renders).
- Database: see Document 5 — Backend Schema.

### 8. Release Criteria
- [ ] All 6 pipeline stages functional end-to-end for at least one software idea and one physical idea.
- [ ] Whitespace Engine output is 100% source-cited.
- [ ] Software prototype is genuinely interactive (clickable, not a static image).
- [ ] No stage silently fails — every failure surfaces a clear error/retry state in the UI.
- [ ] Human-approval checkpoints functioning after Discovery and Prioritization stages.

### 9. Out of Scope (V1)
- Live analytics integrations (Stripe, GA4, Mixpanel) — manual CSV upload only.
- Physical manufacturing/engineering feasibility validation.
- Legal, regulatory, or IP-clearance checking.
- Multi-user real-time collaboration / commenting.
- Paid competitive-intelligence API integrations (Crayon, etc.) — V1 uses public web search/scrape only.

### 10. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Whitespace Engine hallucinates competitor data | Hard rule: every claim must cite a retrieved source; if no source, the agent must say "insufficient data" rather than guess |
| Users over-trust physical "prototypes" as engineering-ready | UI must visibly label physical outputs as concept-stage; cannot be downloaded without the disclaimer attached |
| Scope creep across 6 ambitious stages | Build order strictly follows Document 6 — Execution Plan; later stages are explicitly deferred, not silently dropped |
| SSE streaming complexity stalls frontend work | Build with a mocked/static streaming response first, swap in real backend once the contract is stable |
| Ai Palette API access/cost constraints | Design the Whitespace Engine to degrade gracefully to web-search-only mode if the API isn't available |

### 11. Open Questions (Team Q&A Log)
- What's the actual data access plan for Ai Palette (trial/dev access vs. full integration)?
- For physical-product image generation, which provider/tool will be used, and what's the cost-per-generation budget?
- Should the tracking dashboard support multiple products per user account in V1, or one active project at a time?

### 12. Task Tracking
Maintained as a Kanban (Not Started / In Progress / Done) per the Execution Plan in Document 6 — not duplicated here to avoid drift between documents.
