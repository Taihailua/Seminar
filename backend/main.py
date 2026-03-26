"""
main.py — FastAPI application entry point
"""
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
from routers import auth, restaurants, dishes, reviews, admin

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5500")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # NOTE: Tables already exist from the schema SQL.
    # We use checkfirst=True to avoid re-creating them.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    yield


app = FastAPI(
    title="Vinh Khanh Audio Guide API",
    description="Backend for the Vinh Khanh Food Street Audio Guide app",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "null",  # file:// protocol for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(restaurants.router)
app.include_router(dishes.router)
app.include_router(reviews.router)
app.include_router(admin.router)


@app.get("/api")
async def root():
    return {
        "app": "Vinh Khanh Audio Guide API",
        "version": "1.0.0",
        "docs": "/docs",
    }

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


@app.get("/health")
async def health():
    return {"status": "ok"}
