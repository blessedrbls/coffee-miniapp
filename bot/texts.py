"""Тексти бота двома мовами. Повідомлення для адмінів — українською."""

from html import escape

CAFE_ADDRESS = {"uk": "вул. Кавова, 7", "en": "7 Coffee St."}
MENU_BUTTON = "☕ Відкрити меню"

TEXTS = {
    "uk": {
        "start": (
            "Вітаємо в <b>Bean &amp; Brew</b>! ☕\n\n"
            "Тут можна замовити каву, чай і десерти на самовивіз — без черги.\n"
            "Натисніть кнопку <b>«{button}»</b> внизу, оберіть напої та оформіть замовлення.\n\n"
            "🕗 Щодня 08:00–21:00 · 📍 {address}"
        ),
        "help": "Натисніть кнопку <b>«{button}»</b> під полем вводу, щоб відкрити меню й оформити замовлення.",
        "order_received": (
            "🧾 <b>Замовлення #{id} отримано!</b>\n\n"
            "{lines}\n\n"
            "<b>Разом: {total}</b>\n"
            "🕒 Самовивіз: {pickup}\n"
            "📍 {address}\n"
            "💳 Оплата при отриманні\n\n"
            "Ми напишемо, щойно бариста прийме замовлення."
        ),
        "order_invalid": "😔 Не вдалося прочитати замовлення. Спробуйте оформити його ще раз через меню.",
        "status_accepted": "✅ Замовлення #{id} прийнято! Бариста вже готує.",
        "status_ready": "🔔 Замовлення #{id} готове! Чекаємо на вас: {address}.",
        "status_cancelled": "❌ На жаль, замовлення #{id} скасовано. Якщо є питання — напишіть або зателефонуйте нам.",
        "asap": "якнайшвидше (~15 хв)",
        "today": "сьогодні",
        "tomorrow": "завтра",
        "myid": "Ваш Telegram ID: <code>{id}</code>",
    },
    "en": {
        "start": (
            "Welcome to <b>Bean &amp; Brew</b>! ☕\n\n"
            "Order coffee, tea and desserts for pickup — no queues.\n"
            "Tap <b>“{button}”</b> below, choose your drinks and place an order.\n\n"
            "🕗 Daily 08:00–21:00 · 📍 {address}"
        ),
        "help": "Tap <b>“{button}”</b> below the message field to open the menu and place an order.",
        "order_received": (
            "🧾 <b>Order #{id} received!</b>\n\n"
            "{lines}\n\n"
            "<b>Total: {total}</b>\n"
            "🕒 Pickup: {pickup}\n"
            "📍 {address}\n"
            "💳 Pay at the counter\n\n"
            "We’ll message you as soon as the barista accepts the order."
        ),
        "order_invalid": "😔 Could not read the order. Please place it again from the menu.",
        "status_accepted": "✅ Order #{id} accepted! The barista is on it.",
        "status_ready": "🔔 Order #{id} is ready! See you at {address}.",
        "status_cancelled": "❌ Sorry, order #{id} was cancelled. Questions? Message or call us.",
        "asap": "as soon as possible (~15 min)",
        "today": "today",
        "tomorrow": "tomorrow",
        "myid": "Your Telegram ID: <code>{id}</code>",
    },
}

# Статуси замовлення та підписи для адмінів
STATUS_LABELS = {
    "new": "🆕 Новий",
    "accepted": "✅ Прийнято",
    "ready": "🔔 Готово",
    "cancelled": "❌ Скасовано",
}


def lang_of(language_code: str | None) -> str:
    """Та сама логіка, що й у Mini App: uk → українська, решта → English."""
    return "uk" if (language_code or "").lower().startswith("uk") else "en"


def t(lang: str, key: str, **kwargs) -> str:
    text = TEXTS.get(lang, TEXTS["en"]).get(key) or TEXTS["en"][key]
    return text.format(button=escape(MENU_BUTTON), address=CAFE_ADDRESS.get(lang, CAFE_ADDRESS["en"]), **kwargs)


def money(cents: int) -> str:
    """380 (центів) → "$3.80". Ціни зберігаємо в центах — цілими числами без похибок."""
    return f"${cents // 100:,}.{cents % 100:02d}"
