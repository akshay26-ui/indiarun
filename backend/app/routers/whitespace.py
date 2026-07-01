"""Mock SSE endpoint for the Whitespace (ValueForge) agent.

Streams fake reasoning_step events followed by a final_output event,
using the {type, payload} shape from the TRD, to validate the frontend
SSE contract before any real agent exists.
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/api/project", tags=["whitespace"])

# ---------------------------------------------------------------------------
# Mock data — 3-4 reasoning steps then a final output
# ---------------------------------------------------------------------------
MOCK_REASONING_STEPS = [
    {
        "type": "reasoning_step",
        "payload": {
            "step": 1,
            "title": "Competitor Discovery",
            "content": (
                "Scanning market for competitors in the health-snacks category… "
                "Found 12 active brands across 4 price tiers."
            ),
        },
    },
    {
        "type": "reasoning_step",
        "payload": {
            "step": 2,
            "title": "Price-Tier Saturation Analysis",
            "content": (
                "Premium tier ($8-12) is heavily saturated with 6 brands. "
                "Mid-range ($4-7) has only 2 players — potential whitespace identified."
            ),
        },
    },
    {
        "type": "reasoning_step",
        "payload": {
            "step": 3,
            "title": "Psychographic Driver Analysis",
            "content": (
                "Consumer sentiment analysis reveals strong unmet demand for "
                "'guilt-free indulgence' positioning. Current offerings over-index "
                "on 'health/wellness' but under-serve the indulgence motivation."
            ),
        },
    },
    {
        "type": "reasoning_step",
        "payload": {
            "step": 4,
            "title": "Failure Simulation",
            "content": (
                "Pattern-matched against 3 historical precedents. Highest-similarity: "
                "'SnackWell's Effect (1990s)' — risk of perceived health halo masking "
                "poor taste. Mitigation: lead with taste-first positioning."
            ),
        },
    },
]

MOCK_FINAL_OUTPUT = {
    "type": "final_output",
    "payload": {
        "whitespace_summary": (
            "A clear opportunity exists in the mid-range ($4-7) health-snack segment "
            "for a product positioned around 'guilt-free indulgence' rather than "
            "clinical wellness."
        ),
        "price_tier_map": [
            {"tier": "budget", "range": "$1-3", "competitor_count": 3, "recommended": False},
            {"tier": "mid-range", "range": "$4-7", "competitor_count": 2, "recommended": True},
            {"tier": "premium", "range": "$8-12", "competitor_count": 6, "recommended": False},
            {"tier": "luxury", "range": "$13+", "competitor_count": 1, "recommended": False},
        ],
        "psychographic_target": {
            "driver": "guilt-free indulgence",
            "evidence_summary": (
                "Review sentiment analysis across 1,200+ reviews shows 34% of "
                "negative reviews cite 'tastes too healthy' as primary complaint."
            ),
        },
        "brand_credibility_score": None,
        "failure_risks": [
            {
                "precedent": "SnackWell's Effect (1990s)",
                "similarity_reason": "Health halo positioning led to taste disappointment",
                "mitigation": "Lead with taste-first messaging; health benefits secondary",
            }
        ],
        "recommended_attributes": [
            "Bold, indulgent flavour profiles (dark chocolate, salted caramel)",
            "Clean-label ingredients (≤8 items)",
            "Portion-controlled single-serve packaging",
            "Transparent nutritional comparison vs. traditional snacks",
        ],
        "source_citations": [
            {"field": "price_tier_map", "source_url": "https://example.com/market-report", "source_type": "web_search"},
            {"field": "psychographic_target", "source_url": "https://example.com/sentiment", "source_type": "review_scrape"},
        ],
    },
}


async def _event_generator(project_id: str):
    """Yield mock SSE events with realistic delays."""
    for step in MOCK_REASONING_STEPS:
        await asyncio.sleep(1.2)  # simulate agent thinking time
        yield {
            "event": step["type"],
            "id": str(uuid.uuid4()),
            "data": json.dumps(step),
        }

    await asyncio.sleep(1.5)  # slightly longer pause before final output
    yield {
        "event": MOCK_FINAL_OUTPUT["type"],
        "id": str(uuid.uuid4()),
        "data": json.dumps(MOCK_FINAL_OUTPUT),
    }


@router.post("/{project_id}/whitespace")
async def run_whitespace_engine(project_id: str):
    """Mock SSE endpoint — streams reasoning steps + final Brand Brief output."""
    return EventSourceResponse(
        _event_generator(project_id),
        media_type="text/event-stream",
    )
