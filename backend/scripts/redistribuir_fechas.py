import asyncio
import random
from datetime import datetime, timedelta

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.customer import Customer

MONTHS_BACK = 12


async def redistribute():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Customer))
        customers = result.scalars().all()

        if not customers:
            print("No hay clientes en la base de datos.")
            return

        now = datetime.utcnow()
        random.shuffle(customers)

        # Repartimos los clientes en 12 "baldes" (uno por mes), de forma pareja
        buckets = [[] for _ in range(MONTHS_BACK)]
        for i, customer in enumerate(customers):
            buckets[i % MONTHS_BACK].append(customer)

        for months_ago, bucket in enumerate(buckets):
            target_month = (now.month - months_ago - 1) % 12 + 1
            target_year = now.year + ((now.month - months_ago - 1) // 12)
            month_start = datetime(target_year, target_month, 1)

            if target_month == 12:
                next_month_start = datetime(target_year + 1, 1, 1)
            else:
                next_month_start = datetime(target_year, target_month + 1, 1)

            days_in_month = (next_month_start - month_start).days

            for customer in bucket:
                random_day = random.randint(0, days_in_month - 1)
                random_seconds = random.randint(0, 86399)
                new_date = month_start + timedelta(days=random_day, seconds=random_seconds)
                if new_date > now:
                    new_date = now - timedelta(minutes=random.randint(1, 60))
                customer.created_at = new_date

        await db.commit()
        print(f"Se redistribuyeron las fechas de {len(customers)} clientes en los últimos {MONTHS_BACK} meses.")


if __name__ == "__main__":
    asyncio.run(redistribute())