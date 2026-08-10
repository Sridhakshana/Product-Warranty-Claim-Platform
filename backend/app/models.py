from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="customer")

    # Relationship with products
    products = relationship("Product", back_populates="user")

    # Relationship with warranty claims
    warranty_claims = relationship("WarrantyClaim", back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(100), nullable=False)
    product_code = Column(String(100), unique=True, nullable=False)
    purchase_date = Column(String(50), nullable=False)
    warranty_period = Column(Integer, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationship with user
    user = relationship("User", back_populates="products")

    # Relationship with warranty claims
    warranty_claims = relationship(
        "WarrantyClaim",
        back_populates="product"
    )


class WarrantyClaim(Base):
    __tablename__ = "warranty_claims"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    claim_reason = Column(String(500), nullable=False)
    claim_status = Column(String(30), default="pending")

    # Relationships
    product = relationship("Product", back_populates="warranty_claims")
    user = relationship("User", back_populates="warranty_claims")