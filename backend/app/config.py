import os

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def cors_origins():
    raw = os.environ.get("CORS_ORIGINS", DEFAULT_ORIGINS)
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


def is_production():
    return os.environ.get("ENVIRONMENT", "development").lower() == "production"


MAX_BODY_BYTES = 512 * 1024
