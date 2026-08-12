import csv
import io
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth import require_admin
from app.database import get_db
from app.models import (
    User,
    Product,
    WarrantyClaim,
    ServiceCenter,
    Invoice,
)

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])


@router.get("/dashboard")
def dashboard(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()
    total_customers = (
        db.query(User).filter(User.role == "customer").count()
    )
    total_products = db.query(Product).count()
    total_claims = db.query(WarrantyClaim).count()
    total_centers = db.query(ServiceCenter).filter(ServiceCenter.is_active.is_(True)).count()
    total_invoices = db.query(Invoice).count()

    status_counts = (
        db.query(WarrantyClaim.claim_status, func.count(WarrantyClaim.id))
        .group_by(WarrantyClaim.claim_status)
        .all()
    )
    status_map = {status: count for status, count in status_counts}

    repair_counts = (
        db.query(WarrantyClaim.repair_status, func.count(WarrantyClaim.id))
        .group_by(WarrantyClaim.repair_status)
        .all()
    )

    # Claims per month for the last 6 months
    today = date.today()
    monthly_labels = []
    monthly_counts = []
    for offset in range(5, -1, -1):
        start = today.replace(day=1) - timedelta(days=offset * 31)
        label = start.strftime("%b %Y")
        month = start.month
        year = start.year
        count = (
            db.query(WarrantyClaim)
            .filter(
                func.year(WarrantyClaim.created_at) == year,
                func.month(WarrantyClaim.created_at) == month,
            )
            .count()
        )
        monthly_labels.append(label)
        monthly_counts.append(count)

    # Top claim reasons
    reason_rows = (
        db.query(WarrantyClaim.claim_reason, func.count(WarrantyClaim.id))
        .group_by(WarrantyClaim.claim_reason)
        .order_by(func.count(WarrantyClaim.id).desc())
        .limit(5)
        .all()
    )

    # Service center workload
    center_rows = (
        db.query(ServiceCenter.name, func.count(WarrantyClaim.id))
        .join(WarrantyClaim, WarrantyClaim.service_center_id == ServiceCenter.id)
        .group_by(ServiceCenter.name)
        .all()
    )

    return {
        "total_users": total_users,
        "total_customers": total_customers,
        "total_products": total_products,
        "total_claims": total_claims,
        "total_centers": total_centers,
        "total_invoices": total_invoices,
        "status_breakdown": status_map,
        "repair_breakdown": {s: c for s, c in repair_counts},
        "claims_last_6_months": {
            "labels": monthly_labels,
            "counts": monthly_counts,
        },
        "top_reasons": [{"reason": r, "count": c} for r, c in reason_rows],
        "center_workload": [{"center": n, "count": c} for n, c in center_rows],
    }


@router.get("/reports/claims")
def claims_report(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    claims = db.query(WarrantyClaim).order_by(WarrantyClaim.created_at.desc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "Claim Number",
            "Product",
            "Customer",
            "Reason",
            "Status",
            "Repair Status",
            "Service Center",
            "Created At",
        ]
    )
    for c in claims:
        writer.writerow(
            [
                c.claim_number,
                c.product.product_name if c.product else "",
                c.user.full_name if c.user else "",
                c.claim_reason,
                c.claim_status,
                c.repair_status,
                c.service_center.name if c.service_center else "",
                c.created_at,
            ]
        )

    buffer.seek(0)
    filename = f"claims_report_{date.today().isoformat()}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/reports/products")
def products_report(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    products = db.query(Product).order_by(Product.created_at.desc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "Product Code",
            "Product Name",
            "Category",
            "Purchase Date",
            "Warranty (months)",
            "Customer",
        ]
    )
    for p in products:
        writer.writerow(
            [
                p.product_code,
                p.product_name,
                p.category or "",
                p.purchase_date,
                p.warranty_period,
                p.user.full_name if p.user else "",
            ]
        )

    buffer.seek(0)
    filename = f"products_report_{date.today().isoformat()}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
