import asyncio
from app.db.session import async_session
from app.models.intake_brief import IntakeBrief
from sqlalchemy import select

async def main():
    async with async_session() as session:
        result = await session.execute(select(IntakeBrief).filter(IntakeBrief.project_id == '97f22821-5ec6-4fe4-99ca-896511123fde'))
        intake = result.scalars().first()
        if intake:
            intake.brand_name = "Google"
            await session.commit()
            print("Brand name updated to Google")
        else:
            print("Intake brief not found")

asyncio.run(main())
