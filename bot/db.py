"""
Просте сховище замовлень у SQLite (вбудована в Python база даних, один файл).
Потрібне, щоб після перезапуску бота кнопки статусів у старих замовленнях
працювали й бот знав, кому з клієнтів надсилати сповіщення.
"""

import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from orders import Order

SCHEMA = """
CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    username    TEXT,
    data        TEXT    NOT NULL,
    total       INTEGER NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'new',
    updated_by  TEXT,
    created_at  TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_messages (
    order_id    INTEGER NOT NULL REFERENCES orders(id),
    chat_id     INTEGER NOT NULL,
    message_id  INTEGER NOT NULL
);
"""


@dataclass
class StoredOrder:
    id: int
    user_id: int
    username: str | None
    order: Order
    status: str
    updated_by: str | None


class Database:
    def __init__(self, path: Path):
        self.conn = sqlite3.connect(path)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)

    def create_order(self, user_id: int, username: str | None, order: Order) -> int:
        with self.conn:
            cur = self.conn.execute(
                "INSERT INTO orders (user_id, username, data, total, created_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, username, order.to_json(), order.total, datetime.now(timezone.utc).isoformat()),
            )
        return cur.lastrowid

    def get_order(self, order_id: int) -> StoredOrder | None:
        row = self.conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if row is None:
            return None
        return StoredOrder(
            id=row["id"],
            user_id=row["user_id"],
            username=row["username"],
            order=Order.from_json(row["data"]),
            status=row["status"],
            updated_by=row["updated_by"],
        )

    def set_status(self, order_id: int, expected: str, new: str, updated_by: str) -> bool:
        """Змінює статус, лише якщо він досі `expected` — щоб два адміни
        одночасно не змінили одне замовлення по-різному."""
        with self.conn:
            cur = self.conn.execute(
                "UPDATE orders SET status = ?, updated_by = ? WHERE id = ? AND status = ?",
                (new, updated_by, order_id, expected),
            )
        return cur.rowcount == 1

    def add_admin_message(self, order_id: int, chat_id: int, message_id: int) -> None:
        with self.conn:
            self.conn.execute(
                "INSERT INTO admin_messages (order_id, chat_id, message_id) VALUES (?, ?, ?)",
                (order_id, chat_id, message_id),
            )

    def admin_messages(self, order_id: int) -> list[tuple[int, int]]:
        rows = self.conn.execute(
            "SELECT chat_id, message_id FROM admin_messages WHERE order_id = ?", (order_id,)
        ).fetchall()
        return [(r["chat_id"], r["message_id"]) for r in rows]

    def close(self) -> None:
        self.conn.close()
