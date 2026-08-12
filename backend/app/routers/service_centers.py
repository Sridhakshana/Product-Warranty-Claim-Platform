from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import require_admin, require_service_center, get_current_user
from app.database import get_db
from app.models import User, ServiceCenter
from app.schemas import (
    ServiceCenterCreate,
    ServiceCenterUpdate,
)

router = APIRouter(prefix="/service-centers", tags=["Service Centers"])


def center_to_dict(center: ServiceCenter):
    return {
        "id": center.id,
        "name": center.name,
        "address": center.address,
        "city": center.city,
        "phone": center.phone,
        "email": center.email,
        "rating": center.rating,
        "is_active": center.is_active,
        "created_at": center.created_at,
    }


@router.post("")
def create_center(
    data: ServiceCenterCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    center = ServiceCenter(**data.model_dump())
    db.add(center)
    db.commit()
    db.refresh(center)
    return {"message": "Service center created", "center": center_to_dict(center)}


@router.get("")
def list_centers(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    centers = db.query(ServiceCenter).order_by(ServiceCenter.id).all()
    return [center_to_dict(c) for c in centers]


@router.get("/{center_id}")
def get_center(
    center_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    center = db.query(ServiceCenter).filter(ServiceCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Service center not found")
    return center_to_dict(center)


@router.put("/{center_id}")
def update_center(
    center_id: int,
    data: ServiceCenterUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    center = db.query(ServiceCenter).filter(ServiceCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Service center not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(center, field, value)

    db.commit()
    db.refresh(center)
    return {"message": "Service center updated", "center": center_to_dict(center)}


@router.delete("/{center_id}")
def delete_center(
    center_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    center = db.query(ServiceCenter).filter(ServiceCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Service center not found")

    db.delete(center)
    db.commit()
    return {"message": "Service center deleted"}
