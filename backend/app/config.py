from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    crm_base_url: str
    crm_api_token: SecretStr
    # Twenty's GraphQL endpoint, relative to crm_base_url.
    crm_graphql_path: str = "/graphql"
    crm_timeout_seconds: float = 5.0
    cache_ttl_seconds: float = 60.0


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]  # values come from the environment / .env
