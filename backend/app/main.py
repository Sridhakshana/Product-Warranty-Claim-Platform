from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.auth import hash_password, verify_password
from app.models import User, Product
from app.schemas import UserCreate, UserLogin


app = FastAPI(
    title="Product Warranty Claim Processing Platform API",
    version="1.0.0"
)
Base.metadata.create_all(bind=engine)


# Database connection check
@app.on_event("startup")
def startup():
    try:
        connection = engine.connect()
        print("✅ Database connected successfully!")
        connection.close()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")


# Database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Root API
@app.get("/")
def root():
    return {
        "message": "Welcome to Product Warranty Claim Processing Platform API"
    }


# Register user
@app.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check whether email already exists
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        return {
            "message": "Email already registered"
        }

    # Hash password
    hashed_password = hash_password(user.password)

    # Create new user
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
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    }


# Login user
@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    # Find user by email
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    # Check email
    if not existing_user:
        return {
            "message": "Invalid email or password"
        }

    # Check password
    if not verify_password(
        user.password,
        existing_user.password
    ):
        return {
            "message": "Invalid email or password"
        }

    return {
        "message": "Login successful",
        "full_name": existing_user.full_name,
        "email": existing_user.email,
        "role": existing_user.role
    }