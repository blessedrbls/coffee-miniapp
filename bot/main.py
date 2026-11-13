"""Точка входу: python main.py"""

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import BotCommand

from config import load_config
from db import Database
from handlers import setup_routers


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    config = load_config()
    db = Database(config.db_path)

    bot = Bot(config.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    # config і db стануть доступні в обробниках як аргументи з такими ж іменами
    dp = Dispatcher(config=config, db=db)
    dp.include_router(setup_routers())

    await bot.set_my_commands([
        BotCommand(command="start", description="Відкрити меню кав’ярні"),
        BotCommand(command="myid", description="Дізнатися свій Telegram ID"),
    ])

    if not config.admin_ids:
        logging.warning("ADMIN_IDS порожній: замовлення не надходитимуть адмінам. "
                        "Надішліть боту /myid і впишіть ID у .env")

    me = await bot.get_me()
    logging.info("Бот @%s запущено. Mini App: %s", me.username, config.webapp_url)
    try:
        await dp.start_polling(bot)
    finally:
        db.close()
        await bot.session.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
