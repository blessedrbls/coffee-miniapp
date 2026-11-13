"""
Прайс кав'ярні на стороні бота — єдине джерело правди про ціни.

Ключі (id) збігаються з id товарів у webapp/products.js. Mini App надсилає
лише id та кількість, а суму бот рахує сам за цими цінами.
Змінили ціну чи додали товар — оновіть і тут, і в products.js.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class MenuItem:
    price: int  # гривні
    uk: str
    en: str

    def name(self, lang: str) -> str:
        return self.uk if lang == "uk" else self.en


MENU: dict[str, MenuItem] = {
    # Кава
    "espresso": MenuItem(45, "Еспресо", "Espresso"),
    "americano": MenuItem(55, "Американо", "Americano"),
    "cappuccino": MenuItem(70, "Капучино", "Cappuccino"),
    "latte": MenuItem(75, "Лате", "Latte"),
    "flat_white": MenuItem(80, "Флет вайт", "Flat White"),
    # Чай
    "black_tea": MenuItem(50, "Чорний чай", "Black Tea"),
    "green_tea": MenuItem(55, "Зелений чай з м’ятою", "Green Tea with Mint"),
    "matcha_latte": MenuItem(90, "Матча лате", "Matcha Latte"),
    # Десерти
    "croissant": MenuItem(65, "Круасан", "Croissant"),
    "cheesecake": MenuItem(95, "Чизкейк з чорницею", "Blueberry Cheesecake"),
    "chocolate_cake": MenuItem(90, "Шоколадний торт", "Chocolate Cake"),
    "macarons": MenuItem(120, "Макарони", "Macarons"),
}
