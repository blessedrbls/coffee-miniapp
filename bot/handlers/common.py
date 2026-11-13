"""/start, /help, /myid та відповідь на будь-які інші повідомлення."""

from aiogram import Router
from aiogram.filters import Command, CommandStart
from aiogram.types import Message

from config import Config
from keyboards import menu_keyboard
from texts import lang_of, t

router = Router(name="common")


@router.message(CommandStart())
async def cmd_start(message: Message, config: Config) -> None:
    # Вітання без імені користувача, як і задумано
    lang = lang_of(message.from_user.language_code if message.from_user else None)
    await message.answer(t(lang, "start"), reply_markup=menu_keyboard(config.webapp_url, lang))


@router.message(Command("myid"))
async def cmd_myid(message: Message) -> None:
    """Допомагає дізнатися свій ID, щоб вписати його в ADMIN_IDS."""
    lang = lang_of(message.from_user.language_code)
    await message.answer(t(lang, "myid", id=message.from_user.id))


@router.message()
async def any_message(message: Message, config: Config) -> None:
    lang = lang_of(message.from_user.language_code if message.from_user else None)
    await message.answer(t(lang, "help"), reply_markup=menu_keyboard(config.webapp_url, lang))
