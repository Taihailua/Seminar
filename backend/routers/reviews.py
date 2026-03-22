"""
routers/reviews.py — Review submission and listing
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Restaurant, Review, User
from schemas import ReviewCreate, ReviewOut
from auth.dependencies import get_current_user

router = APIRouter(tags=["reviews"])


@router.get("/api/restaurants/{restaurant_id}/reviews", response_model=List[ReviewOut])
async def list_reviews(restaurant_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review, User.username)
        .outerjoin(User, Review.user_id == User.id)
        .where(Review.restaurant_id == restaurant_id)
        .order_by(Review.created_at.desc())
    )
    rows = result.all()
    reviews = []
    for review, username in rows:
        out = ReviewOut.model_validate(review)
        out.username = username or "Khách vãng lai"
        reviews.append(out)
    return reviews


@router.post(
    "/api/restaurants/{restaurant_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_review(
    restaurant_id: uuid.UUID,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Restaurant not found")

    review = Review(
        restaurant_id=restaurant_id,
        user_id=current_user.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    await db.flush()
    await db.refresh(review)

    out = ReviewOut.model_validate(review)
    out.username = current_user.username
    return out
