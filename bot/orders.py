"""
Перевірка замовлення з Mini App і форматування повідомлень.

Дані з web_app_data приходять від клієнта, тож їм не можна довіряти:
перевіряємо кожне поле, а суму рахуємо заново за цінами з menu.py.
"""

import json
import re
from dataclasses import asdict, dataclass
from html import escape

from menu import MENU
from texts import STATUS_LABELS, money, t

MAX_RAW_BYTES = 4096        # ліміт Telegram для sendData
MAX_QTY = 20                # як у Mini App
MAX_POSITIONS = 30
NAME_MAX = 50
COMMENT_MAX = 300

PHONE_RE = re.compile(r"^\+?[\d\s()\-]+$")
PICKUP_RE = re.compile(r"^(today|tomorrow) ([01]\d|2[0-3]):([0-5]\d)$")
CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")

# Дозволені переходи статусів: з якого стану куди можна перейти
STATUS_FLOW = {
    "new": ("accepted", "ready", "cancelled"),
    "accepted": ("ready", "cancelled"),
    "ready": (),
    "cancelled": (),
}


class OrderError(ValueError):
    """Замовлення не пройшло перевірку."""


@dataclass
class OrderLine:
    id: str
    qty: int
    price: int  # ціна з menu.py, а не з Mini App

    @property
    def total(self) -> int:
        return self.price * self.qty


@dataclass
class Order:
    lines: list[OrderLine]
    name: str
    phone: str
    pickup: str
    comment: str
    lang: str
    client_total: int | None  # сума, яку показав Mini App — лише для звірки

    @property
    def total(self) -> int:
        return sum(line.total for line in self.lines)

    @property
    def total_mismatch(self) -> bool:
        return self.client_total is not None and self.client_total != self.total

    def to_json(self) -> str:
        return json.dumps(asdict(self), ensure_ascii=False)

    @classmethod
    def from_json(cls, raw: str) -> "Order":
        data = json.loads(raw)
        data["lines"] = [OrderLine(**line) for line in data["lines"]]
        return cls(**data)


def _clean_text(value, field: str, max_len: int, required: bool) -> str:
    if value is None:
        value = ""
    if not isinstance(value, str):
        raise OrderError(f"{field}: має бути рядком")
    value = CONTROL_CHARS_RE.sub("", value)
    if field != "comment":
        value = " ".join(value.split())  # без переносів рядків і зайвих пробілів
    value = value.strip()
    if len(value) > max_len:
        raise OrderError(f"{field}: задовгий ({len(value)} > {max_len})")
    if required and not value:
        raise OrderError(f"{field}: порожній")
    return value


def parse_order(raw: str, fallback_lang: str) -> Order:
    if len(raw.encode("utf-8")) > MAX_RAW_BYTES:
        raise OrderError("завеликий обсяг даних")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise OrderError(f"некоректний JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise OrderError("очікувався JSON-об'єкт")
    if data.get("v") != 1:
        raise OrderError("невідома версія формату")

    # --- товари ---
    items = data.get("items")
    if not isinstance(items, list) or not items:
        raise OrderError("кошик порожній")
    if len(items) > MAX_POSITIONS:
        raise OrderError("забагато позицій")

    quantities: dict[str, int] = {}
    for item in items:
        if not isinstance(item, dict):
            raise OrderError("позиція має бути об'єктом")
        item_id, qty = item.get("id"), item.get("qty")
        if item_id not in MENU:
            raise OrderError(f"невідомий товар: {item_id!r}")
        # bool — підклас int у Python, тому відсікаємо його окремо
        if not isinstance(qty, int) or isinstance(qty, bool) or qty < 1:
            raise OrderError(f"некоректна кількість для {item_id}")
        quantities[item_id] = quantities.get(item_id, 0) + qty

    lines = []
    for item_id, qty in quantities.items():
        if qty > MAX_QTY:
            raise OrderError(f"забагато {item_id}: {qty}")
        lines.append(OrderLine(id=item_id, qty=qty, price=MENU[item_id].price))

    # --- контакти ---
    name = _clean_text(data.get("name"), "name", NAME_MAX, required=True)
    if len(name) < 2:
        raise OrderError("name: закоротке")

    phone = _clean_text(data.get("phone"), "phone", 20, required=True)
    digits = re.sub(r"\D", "", phone)
    if not PHONE_RE.match(phone) or not 10 <= len(digits) <= 15:
        raise OrderError("phone: некоректний номер")

    pickup = data.get("pickup")
    if pickup != "asap" and not (isinstance(pickup, str) and PICKUP_RE.match(pickup)):
        raise OrderError("pickup: некоректний час")

    comment = _clean_text(data.get("comment"), "comment", COMMENT_MAX, required=False)

    lang = data.get("lang") if data.get("lang") in ("uk", "en") else fallback_lang

    client_total = data.get("client_total")
    if not isinstance(client_total, int) or isinstance(client_total, bool):
        client_total = None

    return Order(lines, name, phone, pickup, comment, lang, client_total)


# ---------- форматування ----------

def pickup_text(pickup: str, lang: str) -> str:
    if pickup == "asap":
        return t(lang, "asap")
    day, time = pickup.split(" ")
    return f"{t(lang, day)}, {time}"


def lines_text(order: Order, lang: str) -> str:
    return "\n".join(
        f"• {escape(MENU[line.id].name(lang))} × {line.qty} — {money(line.total)}"
        for line in order.lines
    )


def client_receipt(order_id: int, order: Order) -> str:
    lang = order.lang
    return t(
        lang, "order_received",
        id=order_id,
        lines=lines_text(order, lang),
        total=money(order.total),
        pickup=pickup_text(order.pickup, lang),
    )


def admin_card(order_id: int, order: Order, *, user_id: int, username: str | None,
               status: str, updated_by: str | None = None) -> str:
    """Картка замовлення для адмінів (завжди українською)."""
    user_link = f'<a href="tg://user?id={user_id}">{escape(order.name)}</a>'
    if username:
        user_link += f" (@{escape(username)})"

    parts = [
        f"🧾 <b>Замовлення #{order_id}</b> · {STATUS_LABELS[status]}",
        "",
        lines_text(order, "uk"),
        "",
        f"<b>Разом: {money(order.total)}</b>",
        "",
        f"👤 {user_link}",
        f"📞 <code>{escape(order.phone)}</code>",
        f"🕒 {pickup_text(order.pickup, 'uk')}",
    ]
    if order.comment:
        parts.append(f"💬 {escape(order.comment)}")
    if order.total_mismatch:
        parts.append(
            f"\n⚠️ Mini App показав {money(order.client_total)} — "
            f"сума перерахована за цінами бота."
        )
    if updated_by:
        parts.append(f"\n<i>Статус змінив(ла): {escape(updated_by)}</i>")
    return "\n".join(parts)
