import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import UPLOAD_DIR
from app.database import get_db
from app.models import User, Product, Invoice
from app.utils.ocr import parse_invoice_text
from app.utils.notifications import notify_user

router = APIRouter(prefix="/invoices", tags=["Invoices"])

ALLOWED_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "text/plain",
}


@router.post("/upload/{product_id}")
async def upload_invoice(
    product_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.user_id != user.id:
        raise HTTPException(
            status_code=403, detail="You can only upload for your own products"
        )

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PNG, JPG, or TXT files are allowed",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename or "file")[1]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    extracted_text = None
    verified = False
    if file.content_type == "text/plain":
        try:
            extracted_text = content.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = None

    # Simulated OCR: when no text available, parse the original filename
    ocr_source = extracted_text or file.filename or ""
    parsed = parse_invoice_text(ocr_source)
    verified = parsed.get("verified", False)

    invoice = Invoice(
        product_id=product.id,
        file_name=file.filename or safe_name,
        file_path=file_path,
        file_size=len(content),
        content_type=file.content_type,
        extracted_text=extracted_text,
        verified=verified,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    notify_user(
        db,
        user.id,
        "Invoice uploaded",
        f"Invoice '{invoice.file_name}' uploaded for {product.product_name}.",
    )

    return {
        "message": "Invoice uploaded successfully",
        "invoice_id": invoice.id,
        "file_name": invoice.file_name,
        "verified": invoice.verified,
        "extracted_fields": parsed,
    }


@router.get("/product/{product_id}")
def list_product_invoices(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if user.role == "customer" and product.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    invoices = (
        db.query(Invoice)
        .filter(Invoice.product_id == product_id)
        .order_by(Invoice.upload_date.desc())
        .all()
    )
    return [
        {
            "id": inv.id,
            "product_id": inv.product_id,
            "file_name": inv.file_name,
            "file_size": inv.file_size,
            "content_type": inv.content_type,
            "verified": inv.verified,
            "upload_date": inv.upload_date,
        }
        for inv in invoices
    ]
