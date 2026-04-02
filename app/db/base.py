from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass


# CRITICAL: forces model registration
import app.models