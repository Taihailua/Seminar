"""
schemas.py — Pydantic v2 request/response schemas
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ── Auth ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "user"  # user | owner


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    username: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


# ── Dishes ────────────────────────────────────────────────────────────────────

class DishCreate(BaseModel):
    name: str = Field(..., max_length=100)
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_available: bool = True


class DishUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None


class DishOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: uuid.UUID
    name: str
    price: Optional[float]
    image_url: Optional[str]
    is_available: bool


# ── Reviews ───────────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: uuid.UUID
    user_id: Optional[int]
    rating: int
    comment: Optional[str]
    created_at: datetime
    username: Optional[str] = None  # populated manually


# ── Restaurants ───────────────────────────────────────────────────────────────

class RestaurantCreate(BaseModel):
    name: str = Field(..., max_length=150)
    description: Optional[str] = None
    audio_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    audio_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


class RestaurantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: Optional[int]
    name: str
    description: Optional[str]
    audio_text: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    qr_code_url: Optional[str]
    status: str
    created_at: datetime
    dishes: List[DishOut] = []
    avg_rating: Optional[float] = None
    review_count: int = 0
    scan_count: int = 0


class RestaurantListItem(BaseModel):
    """Lightweight schema for map/nav listing."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    avg_rating: Optional[float] = None
    status: str


# ── Admin ─────────────────────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    total_restaurants: int
    pending_restaurants: int
    total_scans: int
    total_reviews: int


class UserManage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    restaurant_count: int = 0


# ── Scan Log ──────────────────────────────────────────────────────────────────

class ScanLogCreate(BaseModel):
    restaurant_id: uuid.UUID
