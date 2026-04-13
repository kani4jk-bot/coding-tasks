from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./travel.db"
engine = create_engine(DATABASE_URL, echo=False)


def create_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
