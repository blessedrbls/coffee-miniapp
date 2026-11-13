"""Налаштування бота: читаємо їх із файлу .env (поруч із цим файлом)."""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


@dataclass(frozen=True)
class Config:
    bot_token: str
    admin_ids: frozenset[int]
    webapp_url: str
    db_path: Path


def _parse_admin_ids(raw: str) -> frozenset[int]:
    ids = set()
    for part in raw.replace(" ", "").split(","):
        if not part:
            continue
        if not part.lstrip("-").isdigit():
            raise SystemExit(f"ADMIN_IDS: «{part}» — не число. Приклад: ADMIN_IDS=123456789,987654321")
        ids.add(int(part))
    return frozenset(ids)


def load_config() -> Config:
    token = os.getenv("BOT_TOKEN", "").strip()
    if not token or ":" not in token or "replace" in token:
        raise SystemExit("Вкажіть BOT_TOKEN у bot/.env (токен видає @BotFather).")

    webapp_url = os.getenv("WEBAPP_URL", "").strip()
    # Telegram відкриває Mini App лише за HTTPS-адресою
    if not webapp_url.startswith("https://"):
        raise SystemExit("WEBAPP_URL має починатися з https:// (адреса Mini App на GitHub Pages).")

    db_path = Path(os.getenv("DB_PATH", "orders.db"))
    if not db_path.is_absolute():
        db_path = BASE_DIR / db_path

    return Config(
        bot_token=token,
        admin_ids=_parse_admin_ids(os.getenv("ADMIN_IDS", "")),
        webapp_url=webapp_url,
        db_path=db_path,
    )
