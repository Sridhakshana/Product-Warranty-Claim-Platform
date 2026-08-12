from fastapi import APIRouter, Depends, HTTPException
from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
    require_admin,
)
from app.database import get_db
from app.models import User, Notification
from app.schemas import (
    UserCreate,
    UserLogin,
    UserUpdate,
    UserProfile,
    NotificationRead,
)
from app.utils.notifications import notify_user

router = APIRouter()

VALID_ROLES = {"customer", "admin", "service_center"}


@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if user.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Use customer, admin, or service_center",
        )

    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role,
        phone=user.phone,
        address=user.address,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    notify_user(
        db,
        new_user.id,
        "Welcome to Warranty Claim Platform",
        f"Hi {new_user.full_name}, your account has been created successfully.",
        channel="email",
    )

    return {
        "message": "User registered successfully",
        "id": new_user.id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "role": new_user.role,
    }

@router.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing or not verify_password(
        user.password,
        existing.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "sub": str(existing.id),
        "role": existing.role
    })

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": UserProfile.model_validate(existing)
    }

@router.get("/profile", response_model=UserProfile)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.put("/profile", response_model=UserProfile)
def update_profile(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.address is not None:
        user.address = data.address

    db.commit()
    db.refresh(user)
    return user


# -----------------------------
# Notifications
# -----------------------------

@router.get("/notifications", response_model=list[NotificationRead])
def get_notifications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.get("/notifications/unread-count")
def unread_count(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )
    return {"unread_count": count}


@router.put("/notifications/{notification_id}/read")
def mark_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user.id,
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.put("/notifications/read-all")
def mark_all_read(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


# -----------------------------
# Admin user management
# -----------------------------

@router.get("/admin/users")
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "phone": u.phone,
            "created_at": u.created_at,
        }
        for u in users
    ]
