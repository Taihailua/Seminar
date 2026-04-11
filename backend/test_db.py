import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

async def test():
    url = os.getenv('DATABASE_URL')
    print(f"Connecting to: {url}")
    engine = create_async_engine(url, echo=False)
    
    try:
        async with engine.begin() as conn:
            print("Successfully connected to the database!")
    except Exception as e:
        print("Error connecting without ssl suffix:", e)

    engine_ssl = create_async_engine(url + "?ssl=require", echo=False)
    try:
        async with engine_ssl.begin() as conn:
            print("Successfully connected to the database WITH ssl suffix!")
    except Exception as e:
        print("Error connecting WITH ssl suffix:", e)

asyncio.run(test())
