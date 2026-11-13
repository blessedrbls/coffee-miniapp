from aiogram import Router

from . import admin, common, order


def setup_routers() -> Router:
    root = Router()
    # Порядок важливий: загальний обробник «усе інше» — останнім
    root.include_routers(admin.router, order.router, common.router)
    return root
