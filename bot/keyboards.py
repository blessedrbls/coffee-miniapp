"""Клавіатури бота."""

from aiogram.filters.callback_data import CallbackData
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)

from orders import STATUS_FLOW
from texts import MENU_BUTTON, STATUS_LABELS


def menu_keyboard(webapp_url: str, lang: str) -> ReplyKeyboardMarkup:
    """Звичайна (reply) клавіатура з кнопкою web_app.
    Саме з такої кнопки Mini App може надіслати дані боту через sendData.
    Mini App, відкритий із reply-кнопки, не отримує даних про користувача,
    тому мову передаємо в адресі: ...?lang=uk"""
    separator = "&" if "?" in webapp_url else "?"
    url = f"{webapp_url}{separator}lang={lang}"
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=MENU_BUTTON, web_app=WebAppInfo(url=url))]],
        resize_keyboard=True,
        is_persistent=True,
    )


class StatusCallback(CallbackData, prefix="st"):
    """Дані інлайн-кнопки: «st:<order_id>:<status>» (до 64 байтів)."""
    order_id: int
    status: str


def status_keyboard(order_id: int, current: str) -> InlineKeyboardMarkup | None:
    """Кнопки лише для дозволених наступних статусів. Для фінальних — без кнопок."""
    buttons = [
        InlineKeyboardButton(
            text=STATUS_LABELS[status],
            callback_data=StatusCallback(order_id=order_id, status=status).pack(),
        )
        for status in STATUS_FLOW[current]
    ]
    return InlineKeyboardMarkup(inline_keyboard=[buttons]) if buttons else None
