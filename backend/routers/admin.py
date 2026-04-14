"""
routers/admin.py — Admin-only dashboard, approval workflow, user management
"""
from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from database import get_db
from models import User, Restaurant, Review, ScanLog, RestaurantStatus, UserRole
from schemas import AdminStats, UserManage, RestaurantOut
from auth.dependencies import require_admin
from routers.restaurants import _enrich

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_restaurants = (await db.execute(select(func.count(Restaurant.id)))).scalar()
    pending_restaurants = (await db.execute(
        select(func.count(Restaurant.id)).where(Restaurant.status == RestaurantStatus.pending)
    )).scalar()
    total_scans = (await db.execute(select(func.count(ScanLog.id)))).scalar()
    total_reviews = (await db.execute(select(func.count(Review.id)))).scalar()

    return AdminStats(
        total_users=total_users,
        total_restaurants=total_restaurants,
        pending_restaurants=pending_restaurants,
        total_scans=total_scans,
        total_reviews=total_reviews,
    )


@router.get("/restaurants/pending", response_model=List[RestaurantOut])
async def get_pending_restaurants(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(Restaurant)
        .options(selectinload(Restaurant.dishes))
        .where(Restaurant.status == RestaurantStatus.pending)
        .order_by(Restaurant.created_at.asc())
    )
    restaurants = result.scalars().all()
    return [await _enrich(r, db) for r in restaurants]


@router.post("/restaurants/{restaurant_id}/approve")
async def approve_restaurant(
    restaurant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    restaurant.status = RestaurantStatus.approved
    return {"message": "Restaurant approved"}


@router.post("/restaurants/{restaurant_id}/reject")
async def reject_restaurant(
    restaurant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    restaurant.status = RestaurantStatus.rejected
    return {"message": "Restaurant rejected"}


@router.get("/users", response_model=List[UserManage])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()

    user_list = []
    for user in users:
        count_result = await db.execute(
            select(func.count(Restaurant.id)).where(Restaurant.owner_id == user.id)
        )
        restaurant_count = count_result.scalar() or 0
        out = UserManage.model_validate(user)
        out.restaurant_count = restaurant_count
        user_list.append(out)
    return user_list


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    return {"message": f"User {user.username} banned"}


@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    return {"message": f"User {user.username} unbanned"}
