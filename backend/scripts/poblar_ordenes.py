# scripts/seed_orders.py
import app.models  # fuerza el registro de todas las clases mapeadas antes de usarlas
import asyncio
import random
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import Order_Item

STATUSES = ["Delivered", "Pending", "Canceled"]
STATUS_WEIGHTS = [0.7, 0.2, 0.1]  # 70% entregados, 20% pendientes, 10% cancelados

ORDERS_PER_MONTH_MIN = 40
ORDERS_PER_MONTH_MAX = 90
MONTHS_BACK = 12


async def seed():
    async with AsyncSessionLocal() as db:  
        customer_ids = (await db.execute(select(Customer.id))).scalars().all()
        products = (await db.execute(select(Product.id, Product.price))).all()

        if not customer_ids or not products:
            print("Necesitas poblar 'customers' y 'products' antes de correr este script.")
            return

        total_orders_created = 0
        now = datetime.utcnow()

        for months_ago in range(MONTHS_BACK):
            # Calculamos el primer día del mes correspondiente, contando hacia atrás
            target_month = (now.month - months_ago - 1) % 12 + 1
            target_year = now.year + ((now.month - months_ago - 1) // 12)
            month_start = datetime(target_year, target_month, 1)

            # Último día válido del mes (sin pasarnos al mes siguiente)
            if target_month == 12:
                next_month_start = datetime(target_year + 1, 1, 1)
            else:
                next_month_start = datetime(target_year, target_month + 1, 1)

            days_in_month = (next_month_start - month_start).days
            orders_this_month = random.randint(ORDERS_PER_MONTH_MIN, ORDERS_PER_MONTH_MAX)

            for _ in range(orders_this_month):
                random_day = random.randint(0, days_in_month - 1)
                random_seconds = random.randint(0, 86399)
                order_date = month_start + timedelta(days=random_day, seconds=random_seconds)

                # No generar pedidos en el futuro (relevante solo para el mes actual)
                if order_date > now:
                    order_date = now - timedelta(minutes=random.randint(1, 60))

                status = random.choices(STATUSES, weights=STATUS_WEIGHTS, k=1)[0]
                customer_id = random.choice(customer_ids)

                # Elegimos entre 1 y 5 productos distintos para este pedido
                chosen_products = random.sample(products, k=min(random.randint(1, 5), len(products)))

                order = Order(
                    customer_id=customer_id,
                    status=status,
                    total=Decimal("0"),  # se calcula abajo
                    created_at=order_date,
                )
                db.add(order)
                await db.flush()  # para obtener order.id antes del commit

                order_total = Decimal("0")
                for product_id, product_price in chosen_products:
                    quantity = random.randint(1, 3)
                    unit_price = product_price
                    order_total += unit_price * quantity

                    db.add(Order_Item(
                        order_id=order.id,
                        product_id=product_id,
                        quantity=quantity,
                        unit_price=unit_price,
                    ))

                order.total = order_total
                total_orders_created += 1

        await db.commit()
        print(f"Se crearon {total_orders_created} pedidos con sus items correspondientes.")


if __name__ == "__main__":
    asyncio.run(seed())