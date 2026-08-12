from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    Date,
    ForeignKey
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="customer", nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="user")
    warranty_claims = relationship("WarrantyClaim", back_populates="user")
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(100), nullable=False)
    product_code = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), nullable=True)
    purchase_date = Column(Date, nullable=False)
    warranty_period = Column(Integer, nullable=False)  # months
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="products")
    warranty_claims = relationship(
        "WarrantyClaim",
        back_populates="product",
        cascade="all, delete-orphan"
    )
    invoices = relationship(
        "Invoice",
        back_populates="product",
        cascade="all, delete-orphan"
    )


class ServiceCenter(Base):
    __tablename__ = "service_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    rating = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    warranty_claims = relationship("WarrantyClaim", back_populates="service_center")


class WarrantyClaim(Base):
    __tablename__ = "warranty_claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String(30), unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_center_id = Column(
        Integer,
        ForeignKey("service_centers.id"),
        nullable=True
    )
    claim_reason = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    claim_status = Column(String(30), default="pending", nullable=False)
    repair_status = Column(String(30), default="not_started", nullable=False)
    admin_note = Column(Text, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    product = relationship("Product", back_populates="warranty_claims")
    user = relationship("User", back_populates="warranty_claims")
    service_center = relationship(
        "ServiceCenter",
        back_populates="warranty_claims"
    )


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0)
    content_type = Column(String(100), nullable=True)
    extracted_text = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    upload_date = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="invoices")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(String(20), default="app")  # app | email | sms
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
