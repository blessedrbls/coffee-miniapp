"""Приймання замовлення з Mini App (web_app_data)."""

import logging

from aiogram import Bot, F, Router
from aiogram.exceptions import TelegramAPIError
from aiogram.types import Message

from config import Config
from db import Database
from keyboards import menu_keyboard, status_keyboard
from orders import OrderError, admin_card, client_receipt, parse_order
from texts import lang_of, t

router = Router(name="order")
log = logging.getLogger(__name__)


@router.message(F.web_app_data)
async def on_web_app_data(message: Message, bot: Bot, config: Config, db: Database) -> None:
    user = message.from_user
    fallback_lang = lang_of(user.language_code)

    # 1. Перевіряємо й розбираємо JSON, суму рахуємо за цінами бота
    try:
        order = parse_order(message.web_app_data.data, fallback_lang)
    except OrderError as exc:
        log.warning("Відхилено замовлення від %s: %s", user.id, exc)
        await message.answer(t(fallback_lang, "order_invalid"), reply_markup=menu_keyboard(config.webapp_url))
        return

    if order.total_mismatch:
        log.warning("Сума з Mini App (%s) ≠ сума бота (%s), користувач %s",
                    order.client_total, order.total, user.id)

    # 2. Зберігаємо
    order_id = db.create_order(user.id, user.username, order)
    log.info("Нове замовлення #%s на %s ₴ від %s", order_id, order.total, user.id)

    # 3. Підтвердження клієнту
    await message.answer(client_receipt(order_id, order), reply_markup=menu_keyboard(config.webapp_url))

    # 4. Картка замовлення всім адмінам із кнопками статусів
    if not config.admin_ids:
        log.warning("ADMIN_IDS порожній — замовлення #%s нікому переслати", order_id)
    card = admin_card(order_id, order, user_id=user.id, username=user.username, status="new")
    for admin_id in config.admin_ids:
        try:
            sent = await bot.send_message(admin_id, card, reply_markup=status_keyboard(order_id, "new"))
            db.add_admin_message(order_id, sent.chat.id, sent.message_id)
        except TelegramAPIError as exc:
            # Найчастіше: адмін ще не натиснув /start у боті
            log.error("Не вдалося надіслати замовлення #%s адміну %s: %s", order_id, admin_id, exc)
