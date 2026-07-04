from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskStats, TaskUpdate


def create_task(db: Session, task_data: TaskCreate, user_id: int) -> Task:
    task = Task(**task_data.model_dump(), user_id=user_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task_or_none(db: Session, task_id: int, user_id: int) -> Task | None:
    return db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()


def get_tasks(
    db: Session,
    user_id: int,
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
) -> list[Task]:
    query = db.query(Task).filter(Task.user_id == user_id)

    if status and status != "all":
        query = query.filter(Task.status == status)
    if priority and priority != "all":
        query = query.filter(Task.priority == priority)
    if search:
        pattern = f"%{search}%"
        query = query.filter(or_(Task.title.ilike(pattern), Task.description.ilike(pattern)))

    return query.order_by(Task.created_at.desc()).all()


def update_task(db: Session, task: Task, task_data: TaskUpdate) -> Task:
    updates = task_data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()


def get_task_stats(db: Session, user_id: int) -> TaskStats:
    total = db.query(func.count(Task.id)).filter(Task.user_id == user_id).scalar() or 0
    completed = (
        db.query(func.count(Task.id))
        .filter(Task.user_id == user_id, Task.status == "completed")
        .scalar()
        or 0
    )
    pending = (
        db.query(func.count(Task.id))
        .filter(Task.user_id == user_id, Task.status == "pending")
        .scalar()
        or 0
    )
    high_priority = (
        db.query(func.count(Task.id))
        .filter(Task.user_id == user_id, Task.priority == "High")
        .scalar()
        or 0
    )
    completion_rate = round((completed / total) * 100, 2) if total else 0

    return TaskStats(
        total_tasks=total,
        completed_tasks=completed,
        pending_tasks=pending,
        high_priority_tasks=high_priority,
        completion_rate=completion_rate,
    )
