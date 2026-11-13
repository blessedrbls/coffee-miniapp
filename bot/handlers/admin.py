"""Кнопки статусів у картці замовлення: Прийнято / Готово / Скасовано."""

import logging

from aiogram import Bot, Router
from aiogram.exceptions import TelegramAPIError, TelegramBadRequest
from aiogram.types import CallbackQuery

from config import Config
from db import Database
from keyboards import StatusCallback, status_keyboard
from orders import STATUS_FLOW, admin_card
from texts import STATUS_LABELS, t

router = Router(name="admin")
log = logging.getLogger(__name__)


async def refresh_admin_cards(bot: Bot, db: Database, order_id: int) -> None:
    """Оновлює картку замовлення в чатах усіх адмінів."""
    stored = db.get_order(order_id)
    text = admin_card(order_id, stored.order, user_id=stored.user_id, username=stored.username,
                      status=stored.status, updated_by=stored.updated_by)
    markup = status_keyboard(order_id, stored.status)
    for chat_id, message_id in db.admin_messages(order_id):
        try:
            await bot.edit_message_text(text, chat_id=chat_id, message_id=message_id, reply_markup=markup)
        except TelegramBadRequest:
            pass  # повідомлення не змінилося або вже видалене


@router.callback_query(StatusCallback.filter())
async def on_status(callback: CallbackQuery, callback_data: StatusCallback,
                    bot: Bot, config: Config, db: Database) -> None:
    # Змінювати статуси можуть лише адміни
    if callback.from_user.id not in config.admin_ids:
        await callback.answer("Недостатньо прав", show_alert=True)
        return

    order_id, new_status = callback_data.order_id, callback_data.status
    stored = db.get_order(order_id)
    if stored is None:
        await callback.answer("Замовлення не знайдено", show_alert=True)
        return

    if new_status not in STATUS_FLOW.get(stored.status, ()):
        await callback.answer(f"Статус уже: {STATUS_LABELS[stored.status]}", show_alert=True)
        await refresh_admin_cards(bot, db, order_id)
        return

    if not db.set_status(order_id, stored.status, new_status, callback.from_user.full_name):
        await callback.answer("Інший адмін щойно змінив статус", show_alert=True)
        await refresh_admin_cards(bot, db, order_id)
        return

    log.info("Замовлення #%s: %s → %s (%s)", order_id, stored.status, new_status, callback.from_user.id)
    await refresh_admin_cards(bot, db, order_id)

    # Сповіщення клієнту його мовою
    try:
        await bot.send_message(stored.user_id, t(stored.order.lang, f"status_{new_status}", id=order_id))
        await callback.answer(f"{STATUS_LABELS[new_status]} — клієнта сповіщено")
    except TelegramAPIError as exc:
        log.warning("Не вдалося сповістити клієнта %s: %s", stored.user_id, exc)
        await callback.answer("Статус змінено, але клієнт заблокував бота", show_alert=True)
