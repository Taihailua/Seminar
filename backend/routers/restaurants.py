"""
routers/restaurants.py — Restaurant CRUD, QR generation, and scan logging
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from database import get_db
from models import User, Restaurant, Dish, Review, ScanLog, RestaurantStatus, UserRole
from schemas import (
    RestaurantCreate, RestaurantUpdate, RestaurantOut, RestaurantListItem
)
from auth.dependencies import get_current_user, get_optional_user, require_owner
from utils.qr_generator import generate_qr_base64

router = APIRouter(prefix="/api/restaurants", tags=["restaurants"])


async def _enrich(restaurant: Restaurant, db: AsyncSession) -> RestaurantOut:
    """Add computed fields: avg_rating, review_count, scan_count."""
    avg_result = await db.execute(
        select(func.avg(Review.rating)).where(Review.restaurant_id == restaurant.id)
    )
    avg_rating = avg_result.scalar()

    count_result = await db.execute(
        select(func.count(Review.id)).where(Review.restaurant_id == restaurant.id)
    )
    review_count = count_result.scalar() or 0

    scan_result = await db.execute(
        select(func.count(ScanLog.id)).where(ScanLog.restaurant_id == restaurant.id)
    )
    scan_count = scan_result.scalar() or 0

    out = RestaurantOut.model_validate(restaurant)
    out.avg_rating = round(float(avg_rating), 2) if avg_rating else None
    out.review_count = review_count
    out.scan_count = scan_count
    return out


# ── Public Routes ──────────────────────────────────────────────────────────────

@router.get("", response_model=List[RestaurantListItem])
async def list_restaurants(db: AsyncSession = Depends(get_db)):
    """Return all approved restaurants (for map and nav bar)."""
    result = await db.execute(
        select(Restaurant).where(Restaurant.status == RestaurantStatus.approved)
    )
    restaurants = result.scalars().all()

    items = []
    for r in restaurants:
        avg_result = await db.execute(
            select(func.avg(Review.rating)).where(Review.restaurant_id == r.id)
        )
        avg = avg_result.scalar()
        items.append(RestaurantListItem(
            id=r.id,
            name=r.name,
            address=r.address,
            latitude=float(r.latitude) if r.latitude else None,
            longitude=float(r.longitude) if r.longitude else None,
            avg_rating=round(float(avg), 2) if avg else None,
            status=r.status.value,
        ))
    return items


@router.get("/{restaurant_id}", response_model=RestaurantOut)
async def get_restaurant(
    restaurant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Restaurant)
        .options(selectinload(Restaurant.dishes))
        .where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    return await _enrich(restaurant, db)


@router.post("/{restaurant_id}/scan", status_code=status.HTTP_201_CREATED)
async def log_scan(
    restaurant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Log a QR scan. Works for both authenticated and anonymous users."""
    result = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    log = ScanLog(
        restaurant_id=restaurant_id,
        user_id=current_user.id if current_user else None,
    )
    db.add(log)
    return {"message": "Scan logged"}


# ── Owner Routes ───────────────────────────────────────────────────────────────

@router.post("", response_model=RestaurantOut, status_code=status.HTTP_201_CREATED)
async def create_restaurant(
    data: RestaurantCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    restaurant = Restaurant(
        owner_id=current_user.id,
        name=data.name,
        description=data.description,
        audio_text=data.audio_text,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
        status=RestaurantStatus.pending,
    )
    db.add(restaurant)
    await db.flush()
    await db.refresh(restaurant)

    # Generate QR code immediately
    qr_data = generate_qr_base64(str(restaurant.id))
    restaurant.qr_code_url = qr_data
    await db.flush()

    return await _enrich(restaurant, db)


@router.put("/{restaurant_id}", response_model=RestaurantOut)
async def update_restaurant(
    restaurant_id: uuid.UUID,
    data: RestaurantUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    result = await db.execute(
        select(Restaurant)
        .options(selectinload(Restaurant.dishes))
        .where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Only owner or admin can update
    if restaurant.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not your restaurant")

    for field, val in data.model_dump(exclude_none=True).items():
        setattr(restaurant, field, val)

    await db.flush()
    return await _enrich(restaurant, db)


@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_restaurant(
    restaurant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    result = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if restaurant.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not your restaurant")

    await db.delete(restaurant)


@router.get("/owner/my", response_model=List[RestaurantOut])
async def get_my_restaurants(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    """Return all restaurants owned by the current owner."""
    result = await db.execute(
        select(Restaurant)
        .options(selectinload(Restaurant.dishes))
        .where(Restaurant.owner_id == current_user.id)
    )
    restaurants = result.scalars().all()
    return [await _enrich(r, db) for r in restaurants]
