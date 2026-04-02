"""
SQLAlchemy ORM model for the Users (form-submission) module.

Table:
  - users : Registered users with photo URLs stored in MinIO
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

# Import the shared async Base
from app.db.async_session import AsyncBase


class User(AsyncBase):
    """Represents a registered user submitted via the form API."""
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str]         = mapped_column(Text, nullable=False)
    photo_url: Mapped[str]    = mapped_column(Text, nullable=False)
    business: Mapped[str]     = mapped_column(Text, nullable=False)
    category: Mapped[str]     = mapped_column(Text, nullable=False)
    phone_no: Mapped[str]     = mapped_column(String(20), nullable=False)
    team_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str | None]      = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return f"<User id={self.id} name={self.name!r}>"
