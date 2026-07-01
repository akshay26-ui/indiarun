import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.base import Base
from app.models.unit_economics import UnitEconomics
from app.models.gtm_plan import GtmPlan
from dotenv import load_dotenv

load_dotenv()

async def init_models():
    engine = create_async_engine(os.getenv("DATABASE_URL"))
    async with engine.begin() as conn:
        print("Creating unit_economics table...")
        await conn.run_sync(Base.metadata.create_all)
        print("Done.")

if __name__ == "__main__":
    asyncio.run(init_models())
