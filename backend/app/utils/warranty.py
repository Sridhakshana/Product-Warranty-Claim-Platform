from datetime import date

from sqlalchemy.orm import Session

from app.models import Product


def compute_warranty_end(purchase_date: date, warranty_period: int):
    """Add warranty_period months to the purchase date."""
    year = purchase_date.year + (purchase_date.month - 1 + warranty_period) // 12
    month = (purchase_date.month - 1 + warranty_period) % 12 + 1
    day = min(purchase_date.day, 28)
    return date(year, month, day)


def get_warranty_status(product: Product):
    """Return dict with warranty status for a product."""
    purchase_date = product.purchase_date
    warranty_end = compute_warranty_end(
        purchase_date, product.warranty_period
    )
    today = date.today()
    days_left = (warranty_end - today).days

    if days_left < 0:
        status = "expired"
    elif days_left <= 30:
        status = "expiring_soon"
    else:
        status = "valid"

    return {
        "product_id": product.id,
        "product_name": product.product_name,
        "product_code": product.product_code,
        "purchase_date": purchase_date,
        "warranty_period": product.warranty_period,
        "warranty_end": warranty_end,
        "status": status,
        "days_left": max(days_left, 0),
    }


def is_product_under_warranty(product: Product):
    return get_warranty_status(product)["status"] != "expired"


def find_duplicate_claim(db: Session, product_id: int, user_id: int):
    """Detect duplicate claims for the same product by the same user."""
    from app.models import WarrantyClaim

    return (
        db.query(WarrantyClaim)
        .filter(
            WarrantyClaim.product_id == product_id,
            WarrantyClaim.user_id == user_id,
        )
        .all()
    )
