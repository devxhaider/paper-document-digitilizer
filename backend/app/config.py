from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/dms_db")
    STORAGE_ROOT: str = Field(default="d:\\Document_manager_system\\storage")
    MAX_FILE_SIZE_MB: int = Field(default=25)
    
    JWT_SECRET: str = Field(default="supersecretchangeinproduction1234567890!@#$")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # Allow loading from a .env file if it exists at the root of the project
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
