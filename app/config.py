from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # Groq API
    GROQ_API_KEY: str

    # Request timeout for scraper
    REQUEST_TIMEOUT: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()