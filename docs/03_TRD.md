# Document 3 of 6 — Technical Requirements Document (TRD)
## Project: UAPA — End-to-End Autonomous PM Agent (with ValueForge Engine)

## 1. Architecture Overview
A modular, agent-per-stage backend, orchestrated behind a single FastAPI gateway, streaming results to a Next.js 14 frontend via SSE. Each pipeline stage is an independent service/module so stages can be built, tested, and deployed incrementally (matches the phased build order in Document 6).

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js 14 Frontend                        │
│   (Idea Intake / Discovery / Definition / Prototype / GTM /     │
│              Tracking — one route per stage)                    │
└───────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS + SSE
┌───────────────────────────▼─────────────────────────────────────┐
│                    FastAPI Gateway / Orchestrator                │
│  - Session/Project state manager                                 │
│  - Routes requests to the correct stage agent                    │
│  - Streams agent reasoning + output via SSE                      │
└───┬──────┬──────┬──────┬──────┬──────┬──────────────────────────┘
    │      │      │      │      │      │
    v      v      v      v      v      v
 Intake  Whitespace  Definition  Prototype  GTM/Econ  Tracking
 Agent   Engine      Agent       Engine     Agent     Agent
 (Stage1) (ValueForge) (Stage3)  (Stage4)   (Stage5)  (Stage6)
    │      │              │          │          │         │
    └──────┴──────────────┴──────────┴──────────┴─────────┘
                             │
                  ┌──────────▼──────────┐
                  │     PostgreSQL       │  (see Doc 5 — Schema)
                  └──────────┬──────────┘
                             │
              ┌──────────────┼──────────────┐
              v               v               v
        External APIs   Web Search/Scrape  Image Gen API
        (Ai Palette)      Tooling           (physical concepts)
```

## 2. Stage-by-Stage Technical Spec

### 2.1 Intake Agent (Stage 1)
- **Function:** Multi-turn guided chat that progressively fills a structured JSON schema.
- **Output schema:** `{ idea_summary, problem_statement, target_user, product_type: "physical"|"software", known_competitors[], constraints: { budget, timeline }, category }`
- **Tech:** Single LLM call per turn with function-calling to extract/validate fields; frontend renders as a chat with a visible "progress" sidebar showing which fields are filled.

### 2.2 ValueForge Whitespace Engine (Stage 2)
This is the core differentiator; spec it precisely.

**Inputs:** structured brief from Stage 1.

**Sub-modules:**
1. **Competitor Discovery** — web search/scrape for products in the same category; pulls pricing, positioning, review sentiment.
2. **Price-Tier Saturation Analysis** — buckets competitors into price tiers, counts density per tier, flags under-served tiers.
3. **Psychographic Driver Analysis** — uses Ai Palette API (consumer trend/segment data) + review/sentiment clustering to identify which consumer motivations (health, indulgence, convenience, sustainability, etc.) are underserved relative to demand signals.
4. **Brand Credibility Assessment** — for an existing brand entering a new category, evaluates existing brand equity/perception data (if provided) against the new positioning's plausibility.
5. **Failure Simulation** — pattern-matches the proposed idea against a curated database of historical product-launch failure cases (categorized by failure cause: e.g., "ignored negative feedback," "feared cannibalization," "built for no one specifically," "misjudged price elasticity") and surfaces the most relevant precedents with similarity reasoning.
6. **Attribute Recommendation Engine** — given the validated whitespace + psychographic driver, recommends concrete product attributes (ingredients, packaging direction, claims/positioning language for physical; feature/positioning equivalents for software).

**Output artifact: Brand Brief** — `{ whitespace_summary, price_tier_map, psychographic_target, brand_credibility_score, failure_risks: [{precedent, similarity_reason, mitigation}], recommended_attributes: [...], source_citations: [...] }`

**Hard rule:** every field in the output must trace to a `source_citation` entry; if the engine cannot find supporting data for a claim, it must mark that field `"insufficient_data": true` rather than fabricate a value.

### 2.3 Definition Agent (Stage 3)
- **Inputs:** Brand Brief + intake brief.
- **Sub-functions:** Persona generation (1–2 personas), feature candidate generation, RICE scoring (agent proposes Reach/Impact/Confidence with stated reasoning, Effort estimated separately, all editable by user), PRD compilation (Uber-template structure, see Document 2).
- **Output:** structured PRD object + persona objects + scored/ranked feature list.

### 2.4 Prototype Engine (Stage 4)
- **Branch on `product_type`:**
  - **Software:** Takes the PRD's feature list + user flows → generates a Next.js/React component scaffold (using a fixed component library for speed/consistency) → deploys to a preview environment → returns a live URL.
  - **Physical:** Takes `recommended_attributes` from the Brand Brief → generates (a) an AI image concept render, (b) a structured spec sheet (materials/format/packaging description), both explicitly tagged `concept_stage: true` in the output schema so the frontend always renders the disclaimer.

### 2.5 GTM + Unit Economics Agent (Stage 5)
- **GTM sub-function:** auto-populates the 7-row GTM table using Brand Brief positioning/differentiator data + PRD target market data.
- **Unit Economics sub-function:** simple deterministic calculator (not LLM-dependent) — given CAC, ARPU, service delivery cost, and customer lifetime as inputs, computes gross margin, LTV, CAC payback period, and LTV:CAC ratio; LLM only used to generate the plain-language "verdict" narrative around the numbers.

### 2.6 Tracking Agent (Stage 6)
- **V1:** Accepts CSV upload against a fixed schema (date, DAU/MAU, retention_rate, NPS/CSAT, churn_rate, revenue, funnel_stage_conversion). Stores in DB, renders dashboard charts.
- **Feedback loopback:** when new data is uploaded, the agent diffs against prior data, flags significant negative shifts (e.g., retention drop > X%), and auto-drafts a new "pain point" entry that's injected back into the Discovery stage's input queue — closing the loop.
- **Phase 2 (not V1):** live integrations via Stripe/GA4/Mixpanel APIs replacing manual CSV upload.

## 3. API Contract (high-level)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/project` | POST | Create new project from intake brief |
| `/api/project/{id}/whitespace` | POST (SSE) | Run ValueForge engine, stream Brand Brief generation |
| `/api/project/{id}/definition` | POST (SSE) | Run Definition Agent, stream personas/PRD/RICE |
| `/api/project/{id}/prototype` | POST (SSE) | Run Prototype Engine |
| `/api/project/{id}/gtm-economics` | POST (SSE) | Run GTM + Unit Economics |
| `/api/project/{id}/tracking/upload` | POST | Upload CSV metrics |
| `/api/project/{id}/tracking/dashboard` | GET | Fetch dashboard data |
| `/api/project/{id}` | GET | Fetch full project state (all stage outputs) |

All `POST...SSE` endpoints stream events of the shape: `{ type: "reasoning_step" | "partial_output" | "final_output" | "error", payload: {...} }`.

## 4. Security & Auth
- Standard JWT/session-based auth for user accounts.
- Project data scoped per user/org; no cross-project data leakage.
- External API keys (Ai Palette, image gen, search) stored server-side only, never exposed to frontend.

## 5. Scalability Notes
- Each stage agent is stateless beyond reading/writing project state from Postgres — horizontally scalable behind the FastAPI gateway.
- SSE connections are the main scaling constraint (long-lived connections); use a reverse proxy (e.g., Nginx) configured for SSE pass-through, and consider connection timeouts/reconnect logic on the frontend.
- Heavy stages (Whitespace Engine's scraping, Prototype Engine's code generation) should run as background tasks with progress streamed back, not block the request thread.

## 6. Deployment
- Frontend: Vercel (native Next.js 14 support).
- Backend: containerized FastAPI (Docker), deployed on a platform supporting long-lived SSE connections (e.g., Render, Railway, or a VM-based deploy — avoid serverless functions with short timeout limits for the SSE endpoints).
- Database: managed Postgres (Supabase/Neon/RDS).
