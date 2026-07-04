from datetime import datetime

from pydantic import BaseModel, Field, field_validator


VALID_PRIORITIES = {"Low", "Medium", "High"}
VALID_STATUSES = {"pending", "completed"}


class TaskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    priority: str = "Medium"
    status: str = "pending"
    due_date: datetime | None = None

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, value: str) -> str:
        if value not in VALID_PRIORITIES:
            raise ValueError("Priority must be Low, Medium, or High")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in VALID_STATUSES:
            raise ValueError("Status must be pending or completed")
        return value


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    priority: str | None = None
    status: str | None = None
    due_date: datetime | None = None

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, value: str | None) -> str | None:
        if value is not None and value not in VALID_PRIORITIES:
            raise ValueError("Priority must be Low, Medium, or High")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is not None and value not in VALID_STATUSES:
            raise ValueError("Status must be pending or completed")
        return value


class TaskStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in VALID_STATUSES:
            raise ValueError("Status must be pending or completed")
        return value


class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None
    user_id: int

    class Config:
        from_attributes = True


class TaskStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    high_priority_tasks: int
    completion_rate: float
