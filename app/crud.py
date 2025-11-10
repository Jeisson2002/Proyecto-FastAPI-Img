from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.models import User
from app.database import async_session
from typing import List, Optional

async def create_user(name: str, email: str):
    async with async_session() as session:
        async with session.begin():
            user = User(name=name, email=email)
            session.add(user)
        try:
            await session.commit()
            await session.refresh(user)
            return user
        except IntegrityError:
            await session.rollback()
            return None

async def list_users() -> List[User]:
    async with async_session() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        return users