from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_admin, require_service_center
from app.database import get_db
from app.models import (
    User,
    Product,
    WarrantyClaim,
    ServiceCenter,
)
from app.schemas import (
    WarrantyClaimCreate,
    WarrantyClaimStatusUpdate,
    WarrantyClaimRepairUpdate,
    ClaimAssign,
)
from app.utils.warranty import is_product_under_warranty, find_duplicate_claim
from app.utils.notifications import notify_user

router = APIRouter(prefix="/claims", tags=["Warranty Claims"])

VALID_STATUSES = ["pending", "approved", "in_progress", "completed", "rejected"]
VALID_REPAIR_STATUSES = [
    "not_started",
    "received",
    "in_repair",
    "repaired",
    "delivered",
]


def generate_claim_number(db: Session):
    year = datetime.now().year
    count = db.query(WarrantyClaim).count() + 1
    return f"WC-{year}-{count:06d}"


def claim_to_dict(claim: WarrantyClaim):
    return {
        "id": claim.id,
        "claim_number": claim.claim_number,
        "product_id": claim.product_id,
        "product_name": claim.product.product_name,
        "product_code": claim.product.product_code,
        "user_id": claim.user_id,
        "user_name": claim.user.full_name,
        "service_center_id": claim.service_center_id,
        "service_center_name": (
            claim.service_center.name if claim.service_center else None
        ),
        "claim_reason": claim.claim_reason,
        "description": claim.description,
        "claim_status": claim.claim_status,
        "repair_status": claim.repair_status,
        "admin_note": claim.admin_note,
        "assigned_at": claim.assigned_at,
        "completed_at": claim.completed_at,
        "created_at": claim.created_at,
        "updated_at": claim.updated_at,
    }


@router.post("")
def create_claim(
    data: WarrantyClaimCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "customer":
        raise HTTPException(
            status_code=403, detail="Only customers can submit claims"
        )

    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.user_id != user.id:
        raise HTTPException(
            status_code=403, detail="You can only claim your own products"
        )

    if not is_product_under_warranty(product):
        raise HTTPException(
            status_code=400,
            detail="Cannot claim - product warranty has expired",
        )

    duplicates = find_duplicate_claim(db, product.id, user.id)
    active_duplicates = [
        d for d in duplicates if d.claim_status in ("pending", "approved", "in_progress")
    ]
    if active_duplicates:
        raise HTTPException(
            status_code=400,
            detail=(
                "Duplicate claim detected. A claim is already active for this product "
                f"(Claim {active_duplicates[0].claim_number})."
            ),
        )

    claim = WarrantyClaim(
        claim_number=generate_claim_number(db),
        product_id=data.product_id,
        user_id=user.id,
        claim_reason=data.claim_reason,
        description=data.description,
        claim_status="pending",
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    notify_user(
        db,
        user.id,
        "Warranty claim submitted",
        f"Your claim {claim.claim_number} for {product.product_name} has been submitted.",
    )

    return {"message": "Warranty claim submitted successfully", "claim": claim_to_dict(claim)}


@router.get("")
def list_claims(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(WarrantyClaim)

    if user.role == "customer":
        query = query.filter(WarrantyClaim.user_id == user.id)
    elif user.role == "service_center":
        centers = (
            db.query(ServiceCenter)
            .filter(ServiceCenter.email == user.email)
            .all()
        )
        center_ids = [c.id for c in centers]
        if not center_ids:
            return []
        query = query.filter(WarrantyClaim.service_center_id.in_(center_ids))

    claims = query.order_by(WarrantyClaim.created_at.desc()).all()
    return [claim_to_dict(c) for c in claims]


@router.get("/{claim_id}")
def get_claim(
    claim_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    claim = db.query(WarrantyClaim).filter(WarrantyClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Warranty claim not found")

    if user.role == "customer" and claim.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if user.role == "service_center":
        centers = (
            db.query(ServiceCenter)
            .filter(ServiceCenter.email == user.email)
            .all()
        )
        center_ids = [c.id for c in centers]
        if claim.service_center_id not in center_ids:
            raise HTTPException(status_code=403, detail="Access denied")

    return claim_to_dict(claim)


# -----------------------------
# Admin: manage claims
# -----------------------------

@router.put("/{claim_id}/status")
def update_status(
    claim_id: int,
    data: WarrantyClaimStatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    claim = db.query(WarrantyClaim).filter(WarrantyClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Warranty claim not found")

    if data.claim_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid claim status. Use one of {VALID_STATUSES}",
        )

    claim.claim_status = data.claim_status
    if data.claim_status == "completed":
        claim.completed_at = datetime.now()

    db.commit()
    db.refresh(claim)

    notify_user(
        db,
        claim.user_id,
        "Warranty claim status updated",
        f"Your claim {claim.claim_number} is now {claim.claim_status}.",
    )

    return {"message": "Claim status updated", "claim": claim_to_dict(claim)}


@router.put("/{claim_id}/assign")
def assign_claim(
    claim_id: int,
    data: ClaimAssign,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    claim = db.query(WarrantyClaim).filter(WarrantyClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Warranty claim not found")

    center = (
        db.query(ServiceCenter).filter(ServiceCenter.id == data.service_center_id).first()
    )
    if not center:
        raise HTTPException(status_code=404, detail="Service center not found")
    if not center.is_active:
        raise HTTPException(status_code=400, detail="Service center is inactive")

    claim.service_center_id = center.id
    claim.claim_status = "approved"
    claim.assigned_at = datetime.now()
    db.commit()
    db.refresh(claim)

    notify_user(
        db,
        claim.user_id,
        "Claim assigned to service center",
        f"Your claim {claim.claim_number} was approved and assigned to {center.name}.",
        channel="email",
    )

    return {"message": "Claim assigned successfully", "claim": claim_to_dict(claim)}


@router.put("/{claim_id}/reject")
def reject_claim(
    claim_id: int,
    data: WarrantyClaimRepairUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    claim = db.query(WarrantyClaim).filter(WarrantyClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Warranty claim not found")

    claim.claim_status = "rejected"
    claim.admin_note = data.admin_note
    db.commit()
    db.refresh(claim)

    notify_user(
        db,
        claim.user_id,
        "Warranty claim rejected",
        f"Your claim {claim.claim_number} was rejected. Reason: {data.admin_note or 'Not provided'}",
        channel="email",
    )

    return {"message": "Claim rejected", "claim": claim_to_dict(claim)}


# -----------------------------
# Service center: repair status
# -----------------------------

@router.put("/{claim_id}/repair")
def update_repair_status(
    claim_id: int,
    data: WarrantyClaimRepairUpdate,
    user: User = Depends(require_service_center),
    db: Session = Depends(get_db),
):
    claim = db.query(WarrantyClaim).filter(WarrantyClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Warranty claim not found")
    
    if claim.service_center_id is None:
        raise HTTPException(
            status_code=403,
            detail="Claim is not assigned to a service center"
        )

    center = (
        db.query(ServiceCenter)
            .filter(
                ServiceCenter.id == claim.service_center_id,
                ServiceCenter.email == user.email
            )
            .first()
)

    if not center:
        raise HTTPException(
            status_code=403,
            detail="You can only update claims assigned to your service center"
    )
    if data.repair_status not in VALID_REPAIR_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid repair status. Use one of {VALID_REPAIR_STATUSES}",
        )

    claim.repair_status = data.repair_status
    if data.admin_note is not None:
        claim.admin_note = data.admin_note

    if data.repair_status == "delivered":
        claim.claim_status = "completed"
        claim.completed_at = datetime.now()

    db.commit()
    db.refresh(claim)

    notify_user(
        db,
        claim.user_id,
        "Repair status updated",
        f"Your claim {claim.claim_number} repair status is now {claim.repair_status}.",
    )

    return {"message": "Repair status updated", "claim": claim_to_dict(claim)}
