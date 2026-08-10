from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import Base, engine, SessionLocal
from app.auth import hash_password, verify_password
from app.models import User, Product, WarrantyClaim
from app.schemas import (
    UserCreate,
    UserLogin,
    ProductCreate,
    ProductUpdate,
    WarrantyClaimCreate,
    WarrantyClaimStatusUpdate
)


app = FastAPI(
    title="Product Warranty Claim Processing Platform API",
    version="1.0.0"
)


Base.metadata.create_all(bind=engine)


# -----------------------------
# Database connection check
# -----------------------------

@app.on_event("startup")
def startup():
    try:
        connection = engine.connect()
        print("✅ Database connected successfully!")
        connection.close()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")


# -----------------------------
# Database session
# -----------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Root API
# -----------------------------

@app.get("/")
def root():
    return {
        "message": "Welcome to Product Warranty Claim Processing Platform API"
    }


# -----------------------------
# Register User
# -----------------------------

@app.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "full_name": new_user.full_name,
        "email": new_user.email,
        "role": new_user.role
    }


# -----------------------------
# Login User
# -----------------------------

@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "message": "Login successful",
        "full_name": existing_user.full_name,
        "email": existing_user.email,
        "role": existing_user.role
    }


# -----------------------------
# Create Product
# -----------------------------

@app.post("/products")
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    # Check whether user exists
    user = db.query(User).filter(
        User.id == product.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check duplicate product code
    existing_product = db.query(Product).filter(
        Product.product_code == product.product_code
    ).first()

    if existing_product:
        raise HTTPException(
            status_code=400,
            detail="Product code already exists"
        )

    new_product = Product(
        product_name=product.product_name,
        product_code=product.product_code,
        purchase_date=product.purchase_date,
        warranty_period=product.warranty_period,
        user_id=product.user_id
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product created successfully",
        "product_id": new_product.id,
        "product_name": new_product.product_name,
        "product_code": new_product.product_code,
        "user_id": new_product.user_id
    }


# -----------------------------
# Get All Products
# -----------------------------

@app.get("/products")
def get_products(
    db: Session = Depends(get_db)
):
    return db.query(Product).all()


# -----------------------------
# Get Product By ID
# -----------------------------

@app.get("/products/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# -----------------------------
# Update Product
# -----------------------------

@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db)
):
    existing_product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Check duplicate product code
    duplicate_product = db.query(Product).filter(
        Product.product_code == product.product_code,
        Product.id != product_id
    ).first()

    if duplicate_product:
        raise HTTPException(
            status_code=400,
            detail="Product code already exists"
        )

    existing_product.product_name = product.product_name
    existing_product.product_code = product.product_code
    existing_product.purchase_date = product.purchase_date
    existing_product.warranty_period = product.warranty_period

    db.commit()
    db.refresh(existing_product)

    return {
        "message": "Product updated successfully",
        "product": existing_product
    }


# -----------------------------
# Delete Product
# -----------------------------

@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Check whether product has warranty claims
    existing_claim = db.query(WarrantyClaim).filter(
        WarrantyClaim.product_id == product_id
    ).first()

    if existing_claim:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product because warranty claims exist"
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }


# -----------------------------
# Create Warranty Claim
# -----------------------------

@app.post("/claims")
def create_claim(
    claim: WarrantyClaimCreate,
    db: Session = Depends(get_db)
):
    # Check user
    user = db.query(User).filter(
        User.id == claim.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check product
    product = db.query(Product).filter(
        Product.id == claim.product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    new_claim = WarrantyClaim(
        product_id=claim.product_id,
        user_id=claim.user_id,
        claim_reason=claim.claim_reason,
        claim_status="pending"
    )

    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    return {
        "message": "Warranty claim created successfully",
        "claim_id": new_claim.id,
        "product_id": new_claim.product_id,
        "user_id": new_claim.user_id,
        "claim_reason": new_claim.claim_reason,
        "claim_status": new_claim.claim_status
    }


# -----------------------------
# Get All Claims
# -----------------------------

@app.get("/claims")
def get_claims(
    db: Session = Depends(get_db)
):
    return db.query(WarrantyClaim).all()


# -----------------------------
# Get Claim By ID
# -----------------------------

@app.get("/claims/{claim_id}")
def get_claim(
    claim_id: int,
    db: Session = Depends(get_db)
):
    claim = db.query(WarrantyClaim).filter(
        WarrantyClaim.id == claim_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=404,
            detail="Warranty claim not found"
        )

    return claim


# -----------------------------
# Update Claim Status
# -----------------------------

@app.put("/claims/{claim_id}/status")
def update_claim_status(
    claim_id: int,
    status: WarrantyClaimStatusUpdate,
    db: Session = Depends(get_db)
):
    claim = db.query(WarrantyClaim).filter(
        WarrantyClaim.id == claim_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=404,
            detail="Warranty claim not found"
        )

    allowed_statuses = [
        "pending",
        "approved",
        "rejected"
    ]

    if status.claim_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid claim status. Use pending, approved, or rejected"
        )

    claim.claim_status = status.claim_status

    db.commit()
    db.refresh(claim)

    return {
        "message": "Warranty claim status updated successfully",
        "claim_id": claim.id,
        "claim_status": claim.claim_status
    }