"""
main.py — FastAPI application entry point
"""
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import time
from typing import Dict
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from database import engine, Base
from routers import auth, restaurants, dishes, reviews, admin

# Store active sessions: device_id -> timestamp
active_sessions: Dict[str, float] = {}

# --- THAY ĐỔI GIỚI HẠN SỐ LƯỢNG NGƯỜI TRUY CẬP Ở ĐÂY ---
# Giả sử thầy yêu cầu giới hạn là 30 người, bạn sửa số 10000 thành 30.
MAX_CONCURRENT_USERS = 10000

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5500")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


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
        "https://seminar-iv5y-git-main-taihailuas-projects.vercel.app",
        "https://seminar-iv5y.vercel.app",
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

# ── Middleware kiểm tra giới hạn người dùng ──────────────────────────────────
@app.middleware("http")
async def limit_concurrent_users(request: Request, call_next):
    # Lấy danh sách thiết bị đang active (trong 30 giây đổ lại)
    current_time = time.time()
    active_count = sum(1 for t in active_sessions.values() if current_time - t <= 30)
    
    # Cho phép các request không phải api (ví dụ: file tĩnh) qua bình thường
    if not request.url.path.startswith("/api/"):
        return await call_next(request)
        
    # Bỏ qua endpoint đếm thiết bị của admin để không bị khoá admin
    if request.url.path == "/api/admin/active-devices":
        return await call_next(request)

    # Nếu đang quá tải và đây là 1 thiết bị mới (chưa có trong danh sách active)
    # Lấy device_id từ query param (dùng cho heartbeat) hoặc tự quy ước. 
    # Tạm thời cứ hễ số lượng > MAX thì chặn các request API mới.
    if active_count > MAX_CONCURRENT_USERS:
        return JSONResponse(
            status_code=503,
            content={"detail": f"Hệ thống đang quá tải (Tối đa {MAX_CONCURRENT_USERS} người). Vui lòng thử lại sau!"}
        )
        
    response = await call_next(request)
    return response


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

@app.post("/api/heartbeat")
async def heartbeat(device_id: str):
    active_sessions[device_id] = time.time()
    # Clean up old sessions (> 30s)
    current_time = time.time()
    expired = [d_id for d_id, t in active_sessions.items() if current_time - t > 30]
    for d_id in expired:
        del active_sessions[d_id]
    return {"status": "ok"}

@app.get("/api/admin/active-devices")
async def get_active_devices():
    current_time = time.time()
    # Filter sessions active within the last 30 seconds
    active_count = sum(1 for t in active_sessions.values() if current_time - t <= 30)
    return {"count": active_count}
