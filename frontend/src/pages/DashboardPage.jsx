import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import PageMeta from "../components/common/PageMeta";
import EcommerceMetrics from "../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../components/ecommerce/MonthlyTarget";
import RecentOrders from "../components/ecommerce/RecentOrders";
import CustomersByCountry from "../components/ecommerce/CustomersByCountry";

export default function DashboardPage() {
  const { authRequest } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authRequest("/dashboard/")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-gray-500 dark:text-gray-400">Cargando dashboard...</p>;

  return (
    <>
      <PageMeta title="Dashboard" description="Panel principal" />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics
            customers={data.metrics.total_customers}
            customersGrowth={data.metrics.customers_growth_pct}
            orders={data.metrics.total_orders}
            ordersGrowth={data.metrics.orders_growth_pct}
          />
          <MonthlySalesChart data={data.monthly_sales} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget
            target={data.monthly_target.target}
            currentRevenue={Number(data.monthly_target.current_month_revenue)}
            progressPct={data.monthly_target.progress_pct}
          />
        </div>

        <div className="col-span-12">
          <StatisticsChart data={data.monthly_sales} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <CustomersByCountry data={data.customers_by_country} />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders orders={data.recent_orders} />
        </div>
      </div>
    </>
  );
}