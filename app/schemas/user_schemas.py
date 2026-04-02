"""
Pydantic schemas for the Users (form-submission) module.
"""
import uuid
import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator, ConfigDict


PHONE_REGEX = re.compile(r"^\+?[1-9]\d{6,14}$")


class UserBase(BaseModel):
    name:      str
    business:  str
    category:  str
    phone_no:  str
    team_name: Optional[str] = None
    role:      Optional[str] = None

    @field_validator("phone_no")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if not PHONE_REGEX.match(cleaned):
            raise ValueError(
                "Invalid phone number. Must be 7–15 digits, optionally starting with '+'."
            )
        return cleaned

    @field_validator("name", "business", "category")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field must not be empty or whitespace.")
        return v.strip()


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id:         uuid.UUID
    photo_url:  str
    created_at: datetime
    updated_at: datetime


class UserListResponse(BaseModel):
    total:     int
    page:      int
    page_size: int
    items:     list[UserResponse]


class MessageResponse(BaseModel):
    message: str
