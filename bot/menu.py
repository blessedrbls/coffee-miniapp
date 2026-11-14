"""
Прайс кав'ярні на стороні бота — єдине джерело правди про ціни.

Ключі (id) збігаються з id товарів у webapp/products.js. Mini App надсилає
лише id та кількість, а суму бот рахує сам за цими цінами.
Змінили ціну чи додали товар — оновіть і тут, і в products.js.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class MenuItem:
    price: int  # у центах: 380 = $3.80
    uk: str
    en: str

    def name(self, lang: str) -> str:
        return self.uk if lang == "uk" else self.en


MENU: dict[str, MenuItem] = {
    # Кава
    "espresso": MenuItem(250, "Еспресо", "Espresso"),
    "americano": MenuItem(300, "Американо", "Americano"),
    "cappuccino": MenuItem(380, "Капучино", "Cappuccino"),
    "latte": MenuItem(420, "Лате", "Latte"),
    "flat_white": MenuItem(450, "Флет вайт", "Flat White"),
    # Чай
    "black_tea": MenuItem(280, "Чорний чай", "Black Tea"),
    "green_tea": MenuItem(300, "Зелений чай з м’ятою", "Green Tea with Mint"),
    "matcha_latte": MenuItem(490, "Матча лате", "Matcha Latte"),
    # Десерти
    "croissant": MenuItem(320, "Круасан", "Croissant"),
    "cheesecake": MenuItem(550, "Чизкейк з чорницею", "Blueberry Cheesecake"),
    "chocolate_cake": MenuItem(520, "Шоколадний торт", "Chocolate Cake"),
    "macarons": MenuItem(600, "Макарони", "Macarons"),
}
