from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskStatusUpdate, TaskUpdate
from app.services.auth_service import get_current_user
from app.services.task_service import (
    create_task,
    delete_task,
    get_task_or_none,
    get_tasks,
    update_task,
)


router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("/", response_model=list[TaskResponse])
def list_tasks(
    status_filter: str | None = Query(default=None, alias="status"),
    priority: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_tasks(
        db=db,
        user_id=current_user.id,
        status=status_filter,
        priority=priority,
        search=search,
    )


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def add_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_task(db, task_data, current_user.id)


@router.put("/{task_id}", response_model=TaskResponse)
def edit_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task_or_none(db, task_id, current_user.id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return update_task(db, task, task_data)


@router.put("/{task_id}/status", response_model=TaskResponse)
def change_task_status(
    task_id: int,
    status_data: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task_or_none(db, task_id, current_user.id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return update_task(db, task, TaskUpdate(status=status_data.status))


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task_or_none(db, task_id, current_user.id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    delete_task(db, task)
    return None
