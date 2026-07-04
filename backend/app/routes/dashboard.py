from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.task import TaskStats
from app.services.auth_service import get_current_user
from app.services.task_service import get_task_stats


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=TaskStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_task_stats(db, current_user.id)
