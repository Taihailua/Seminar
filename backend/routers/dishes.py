"""
routers/dishes.py — Dish CRUD under a restaurant
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Restaurant, Dish, UserRole, User
from schemas import DishCreate, DishUpdate, DishOut
from auth.dependencies import require_owner

router = APIRouter(tags=["dishes"])


@router.get("/api/restaurants/{restaurant_id}/dishes", response_model=List[DishOut])
async def list_dishes(restaurant_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dish).where(Dish.restaurant_id == restaurant_id))
    return result.scalars().all()


@router.post(
    "/api/restaurants/{restaurant_id}/dishes",
    response_model=DishOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_dish(
    restaurant_id: uuid.UUID,
    data: DishCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    # Verify ownership
    result = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not your restaurant")

    dish = Dish(restaurant_id=restaurant_id, **data.model_dump())
    db.add(dish)
    await db.flush()
    await db.refresh(dish)
    return dish


@router.put("/api/dishes/{dish_id}", response_model=DishOut)
async def update_dish(
    dish_id: int,
    data: DishUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    result = await db.execute(select(Dish).where(Dish.id == dish_id))
    dish = result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    for field, val in data.model_dump(exclude_none=True).items():
        setattr(dish, field, val)
    await db.flush()
    return dish


@router.delete("/api/dishes/{dish_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dish(
    dish_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    result = await db.execute(select(Dish).where(Dish.id == dish_id))
    dish = result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    await db.delete(dish)
