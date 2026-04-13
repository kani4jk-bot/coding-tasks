import os

from sqlmodel import SQLModel, create_engine, Session


def _db_url() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///./travel.db")
    # Railway PostgreSQL uses postgres:// but SQLAlchemy needs postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


engine = create_engine(_db_url(), echo=False)


def create_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
