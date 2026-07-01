import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5432/indiarun")

async def test():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'prototypes';"))
        print(res.fetchall())

asyncio.run(test())
