import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    """Simple environment-based configuration for beginners to understand."""

    PROJECT_NAME = "Task Management API"
    API_PREFIX = "/api"

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost:3306/task_management",
    )

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-key")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    FRONTEND_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500,null",
        ).split(",")
        if origin.strip()
    ]
    CORS_ALLOW_ORIGIN_REGEX = os.getenv(
        "CORS_ALLOW_ORIGIN_REGEX",
        r"http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):\d+",
    )
    CREATE_TABLES_ON_STARTUP = os.getenv("CREATE_TABLES_ON_STARTUP", "true").lower() == "true"


settings = Settings()
