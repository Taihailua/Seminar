"""
models.py — SQLAlchemy ORM models mirroring the PostgreSQL schema
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Numeric,
    ForeignKey, DateTime, Enum as SAEnum, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


# ── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    user = "user"
    owner = "owner"
    admin = "admin"


class RestaurantStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


# ── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    role = Column(SAEnum(UserRole, name="user_role"), default=UserRole.user)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    restaurants = relationship("Restaurant", back_populates="owner", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user")
    scan_logs = relationship("ScanLog", back_populates="user")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(150), nullable=False)
    description = Column(Text)
    audio_text = Column(Text)
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    address = Column(String(255))
    qr_code_url = Column(String(255))
    status = Column(SAEnum(RestaurantStatus, name="restaurant_status"), default=RestaurantStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="restaurants")
    dishes = relationship("Dish", back_populates="restaurant", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="restaurant", cascade="all, delete-orphan")
    scan_logs = relationship("ScanLog", back_populates="restaurant", cascade="all, delete-orphan")


class Dish(Base):
    __tablename__ = "dishes"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"))
    name = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2))
    image_url = Column(String(255))
    is_available = Column(Boolean, default=True)

    restaurant = relationship("Restaurant", back_populates="dishes")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Integer, CheckConstraint("rating >= 1 AND rating <= 5"))
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="reviews")
    user = relationship("User", back_populates="reviews")


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    scan_time = Column(DateTime, default=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="scan_logs")
    user = relationship("User", back_populates="scan_logs")
