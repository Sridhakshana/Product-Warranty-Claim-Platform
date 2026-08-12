from sqlalchemy.orm import Session

from app.models import Notification


def notify_user(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    channel: str = "app",
):
    """Create an in-app notification row (email/SMS simulation)."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        channel=channel,
    )
    db.add(notification)

    # Simulated email / SMS output for demonstration
    if channel in ("email", "sms"):
        print(f"[{channel.upper()}] To user {user_id}: {title} - {message}")

    db.commit()
    db.refresh(notification)
    return notification


def unread_count(db: Session, user_id: int):
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .count()
    )
