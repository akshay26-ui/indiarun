import asyncio
from app.db.session import async_session
from app.models.source_citation import SourceCitation
from app.models.failure_risk import FailureRisk
from app.models.brand_brief import BrandBrief
from sqlalchemy import select

async def main():
    async with async_session() as session:
        result = await session.execute(select(SourceCitation))
        citations = result.scalars().all()
        print(f"--- CITATIONS ({len(citations)}) ---")
        for c in citations:
            print(c.field_referenced, c.source_url, c.source_type)
            
        result = await session.execute(select(FailureRisk))
        risks = result.scalars().all()
        print(f"--- FAILURE RISKS ({len(risks)}) ---")
        for r in risks:
            print(r.precedent_name, "|", r.similarity_reason)

        result = await session.execute(select(BrandBrief))
        briefs = result.scalars().all()
        print(f"--- BRAND BRIEFS ({len(briefs)}) ---")
        for b in briefs:
            print(f"Credibility Score: {b.brand_credibility_score}")

asyncio.run(main())
