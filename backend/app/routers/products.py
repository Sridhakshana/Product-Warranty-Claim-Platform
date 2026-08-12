import qrcode as qrcode_lib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Product, WarrantyClaim
from app.schemas import (
    ProductCreate,
    ProductUpdate,
    WarrantyStatus,
)
from app.utils.qr import generate_qr_data_url, build_qr_payload
from app.utils.warranty import get_warranty_status, is_product_under_warranty

router = APIRouter(prefix="/products", tags=["Products"])


def product_to_dict(product: Product):
    return {
        "id": product.id,
        "product_name": product.product_name,
        "product_code": product.product_code,
        "category": product.category,
        "purchase_date": product.purchase_date,
        "warranty_period": product.warranty_period,
        "user_id": product.user_id,
        "created_at": product.created_at,
    }


def get_owned_product(db: Session, product_id: int, user: User):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if user.role == "customer" and product.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own products",
        )
    return product


@router.post("")
def create_product(
    data: ProductCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "customer":
        raise HTTPException(
            status_code=403, detail="Only customers can register products"
        )

    existing = (
        db.query(Product).filter(Product.product_code == data.product_code).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Product code already exists")

    product = Product(
        product_name=data.product_name,
        product_code=data.product_code,
        category=data.category,
        purchase_date=data.purchase_date,
        warranty_period=data.warranty_period,
        user_id=user.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    return {
        "message": "Product registered successfully",
        "product": product_to_dict(product),
        "warranty": get_warranty_status(product),
    }


@router.get("")
def list_products(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if user.role == "customer":
        query = query.filter(Product.user_id == user.id)

    products = query.order_by(Product.created_at.desc()).all()
    return [
        {
            **product_to_dict(p),
            "warranty": get_warranty_status(p),
            "qr_code": generate_qr_data_url(p),
        }
        for p in products
    ]


@router.get("/{product_id}")
def get_product(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = get_owned_product(db, product_id, user)
    return {
        "product": product_to_dict(product),
        "warranty": get_warranty_status(product),
        "qr_code": generate_qr_data_url(product),
    }


@router.get("/{product_id}/warranty", response_model=WarrantyStatus)
def check_warranty(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = get_owned_product(db, product_id, user)
    return get_warranty_status(product)


@router.put("/{product_id}")
def update_product(
    product_id: int,
    data: ProductUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = get_owned_product(db, product_id, user)

    if data.product_name is not None:
        product.product_name = data.product_name
    if data.category is not None:
        product.category = data.category
    if data.purchase_date is not None:
        product.purchase_date = data.purchase_date
    if data.warranty_period is not None:
        product.warranty_period = data.warranty_period

    db.commit()
    db.refresh(product)
    return {"message": "Product updated successfully", "product": product_to_dict(product)}


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = get_owned_product(db, product_id, user)

    claim = (
        db.query(WarrantyClaim).filter(WarrantyClaim.product_id == product_id).first()
    )
    if claim:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product because warranty claims exist",
        )

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}


# -----------------------------
# QR verification
# -----------------------------

@router.get("/verify/qr/{product_code}")
def verify_qr(
    product_code: str,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product).filter(Product.product_code == product_code).first()
    )
    if not product:
        raise HTTPException(
            status_code=404,
            detail="No product found for this QR code",
        )

    warranty = get_warranty_status(product)
    return {
        "message": "Product verified successfully",
        "product_name": product.product_name,
        "product_code": product.product_code,
        "category": product.category,
        "warranty": warranty,
        "under_warranty": is_product_under_warranty(product),
    }


@router.get("/{product_id}/qr")
def product_qr(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = get_owned_product(db, product_id, user)
    return {
        "qr_data": build_qr_payload(product),
        "qr_image": generate_qr_data_url(product),
    }
