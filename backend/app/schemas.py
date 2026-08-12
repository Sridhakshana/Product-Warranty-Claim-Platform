from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# -----------------------------
# Auth
# -----------------------------

class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: str = "customer"
    phone: Optional[str] = None
    address: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


# -----------------------------
# Product
# -----------------------------

class ProductCreate(BaseModel):
    product_name: str = Field(min_length=2, max_length=100)
    product_code: str = Field(min_length=3, max_length=100)
    category: Optional[str] = None
    purchase_date: date
    warranty_period: int = Field(ge=1, le=120)  # months


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    purchase_date: Optional[date] = None
    warranty_period: Optional[int] = Field(default=None, ge=1, le=120)


class WarrantyStatus(BaseModel):
    product_id: int
    product_name: str
    product_code: str
    purchase_date: date
    warranty_period: int
    warranty_end: date
    status: str  # valid | expired | expiring_soon
    days_left: int


# -----------------------------
# Warranty Claim
# -----------------------------

class WarrantyClaimCreate(BaseModel):
    product_id: int
    claim_reason: str = Field(min_length=3, max_length=255)
    description: Optional[str] = None


class WarrantyClaimStatusUpdate(BaseModel):
    claim_status: str  # pending | approved | in_progress | completed | rejected


class WarrantyClaimRepairUpdate(BaseModel):
    repair_status: Optional[str] = None
    admin_note: Optional[str] = None


class ClaimAssign(BaseModel):
    service_center_id: int


# -----------------------------
# Service Center
# -----------------------------

class ServiceCenterCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class ServiceCenterUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


# -----------------------------
# Notification
# -----------------------------

class NotificationRead(BaseModel):
    id: int
    title: str
    message: str
    channel: str
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -----------------------------
# Chatbot
# -----------------------------

class ChatMessage(BaseModel):
    message: str = Field(min_length=1, max_length=500)


class ChatResponse(BaseModel):
    reply: str
    intent: str
