# Document 5 of 6 — Backend Schema
## Project: UAPA — End-to-End Autonomous PM Agent (with ValueForge Engine)

## 1. Entity Overview
```
users ──< projects ──< intake_briefs (1:1)
                  ──< brand_briefs (1:1, ValueForge output)
                  ──< personas (1:many)
                  ──< features (1:many, RICE-scored)
                  ──< prds (1:1)
                  ──< prototypes (1:1)
                  ──< gtm_plans (1:1)
                  ──< unit_economics (1:1)
                  ──< tracking_metrics (1:many, time series)
                  ──< feedback_loop_events (1:many)
brand_briefs ──< source_citations (1:many)
brand_briefs ──< failure_risks (1:many)
```

## 2. Table Definitions

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| email | text, unique | |
| name | text | |
| created_at | timestamptz | |

### `projects`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| user_id | UUID, FK → users.id | |
| idea_name | text | |
| product_type | enum('physical','software') | |
| current_stage | enum('intake','whitespace','definition','prototype','gtm','tracking') | |
| status | enum('in_progress','awaiting_approval','completed') | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `intake_briefs`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| project_id | UUID, FK → projects.id | |
| problem_statement | text | |
| target_user | text | |
| known_competitors | text[] | |
| category | text | |
| budget_constraint | text | nullable |
| timeline_constraint | text | nullable |

### `brand_briefs` (ValueForge output)
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| project_id | UUID, FK → projects.id | |
| whitespace_summary | text | |
| price_tier_map | jsonb | `{tier: string, competitor_count: int, recommended: bool}[]` |
| psychographic_target | jsonb | `{driver: string, evidence_summary: text}` |
| brand_credibility_score | numeric, nullable | only if existing brand provided |
| recommended_attributes | jsonb | ingredients/packaging/positioning array, or feature/positioning array for software |
| approved | boolean | human-checkpoint flag |
| created_at | timestamptz | |

### `failure_risks`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| brand_brief_id | UUID, FK → brand_briefs.id | |
| precedent_name | text | e.g. "Coca-Cola New Coke (1985)" |
| similarity_reason | text | |
| mitigation_suggestion | text | |

### `source_citations`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| brand_brief_id | UUID, FK → brand_briefs.id | |
| field_referenced | text | which Brand Brief field this citation supports |
| source_url | text | |
| source_type | enum('web_search','ai_palette','review_scrape') | |
| retrieved_at | timestamptz | |

### `personas`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| project_id | UUID, FK → projects.id | |
| name | text | |
| quote | text | |
| demographics | jsonb | |
| goals | text[] | |
| pain_points | text[] | |
| scenario | text | |

### `features`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| project_id | UUID, FK → projects.id | |
| title | text | |
| description | text | |
| reach | numeric | |
| impact | numeric | |
| confidence | numeric | |
| effort | numeric | |
| rice_score | numeric, generated | computed as (reach*impact*confidence)/effort |
| priority_label | enum('very_high','high','medium','low') | |
| moscow_label | enum('must','should','could','wont'), nullable | |

### `prds`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| project_id | UUID, FK → projects.id | |
| content_markdown | text | full compiled PRD |
| version | integer | |
| approved | boolean | |
| created_at | timestamptz | |

### `prototypes`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| project_id | UUID, FK → projects.id | |
| type | enum('software','physical') | |
| preview_url | text, nullable | for software |
| code_export_url | text, nullable | for software |
| concept_image_url | text, nullable | for physical |
| spec_sheet | jsonb, nullable | for physical |
| concept_stage_disclaimer | boolean, default true | always true for physical |

### `gtm_plans`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| project_id | UUID, FK → projects.id | |
| objective | text | |
| target_market | text | |
| positioning | text | |
| gtm_motion | text | |
| packaging_strategy | text | |
| key_differentiators | text[] | |
| success_metrics | text[] | |

### `unit_economics`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| project_id | UUID, FK → projects.id | |
| cac | numeric | |
| arpu | numeric | |
| service_delivery_cost | numeric | |
| customer_lifetime_months | numeric | |
| gross_margin | numeric, generated | arpu - service_delivery_cost |
| ltv | numeric, generated | gross_margin * customer_lifetime_months |
| cac_payback_months | numeric, generated | cac / gross_margin |
| ltv_cac_ratio | numeric, generated | ltv / cac |

### `tracking_metrics`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| project_id | UUID, FK → projects.id | |
| date | date | |
| dau | integer, nullable | |
| mau | integer, nullable | |
| retention_rate | numeric, nullable | |
| nps_score | numeric, nullable | |
| csat_score | numeric, nullable | |
| churn_rate | numeric, nullable | |
| revenue | numeric, nullable | |
| funnel_conversion_rate | numeric, nullable | |
| source | enum('csv_upload','stripe','ga4','mixpanel'), default 'csv_upload' |

### `feedback_loop_events`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| project_id | UUID, FK → projects.id | |
| triggered_by_metric_id | UUID, FK → tracking_metrics.id, nullable | |
| insight_summary | text | e.g. "Retention dropped 8% after week 3" |
| sent_to_discovery | boolean | |
| created_at | timestamptz | |

## 3. Indexing Notes
- Index `projects.user_id`, `projects.current_stage` for dashboard queries.
- Index `tracking_metrics.project_id, date` for time-series chart queries.
- Index `source_citations.brand_brief_id` since every Brand Brief render needs to fetch all citations.

## 4. Data Integrity Rules
- `brand_briefs.recommended_attributes` and `whitespace_summary` must not be insertable without at least one corresponding row in `source_citations` — enforce at the application layer (not DB constraint, since citation count varies) to uphold the "no unsourced claims" rule from the TRD.
- `prototypes.concept_stage_disclaimer` must default `true` and be non-editable for `type = 'physical'` rows — enforced at the application layer to prevent the disclaimer from ever being silently removed.
