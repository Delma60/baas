from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=[".env", "../.env"], extra="ignore")

    # App
    app_name: str = "BaaS Platform"
    node_env: str = "development"
    fastapi_base_url: str = "http://localhost:8000"
    internal_api_secret: str = "123-76-43334-5-433-45-65665-ghfgdfv-s-6543-2v-bvc-vwe-56"

    # PostgreSQL
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/baas_platform"
    database_sync_url: str = "postgresql://postgres:postgres@localhost:5432/baas_platform"

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "baas_platform"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_public_endpoint: str = "http://localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_use_ssl: bool = False

    # Auth.js / per-project JWTs
    jwt_secret: str = "changeme-jwt"
    jwt_expiry: int = 3600

    # Staff / Superadmin
    staff_jwt_secret: str = "changeme-staff"
    staff_jwt_expiry: int = 28800
    bootstrap_admin_email: str = "admin@example.com"
    bootstrap_admin_password: str = "changeme"

    # API key encryption
    api_key_encryption_secret: str = "changeme-enc"

    # Email
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_secure: bool = False

    # Payments
    paystack_secret_key: str = ""
    paystack_public_key: str = ""
    paystack_webhook_secret: str = ""
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # AI
    openai_api_key: str = ""


settings = Settings()