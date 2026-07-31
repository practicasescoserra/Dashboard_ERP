import { useMemo } from "react";
import Chart from "react-apexcharts";

export default function StatisticsChart({ data }) {
  const categories = useMemo(
    () => data.map((d) => new Date(d.month + "T00:00:00").toLocaleDateString("es-ES", { month: "short", year: "2-digit" })),
    [data]
  );

  const options = useMemo(() => ({
    legend: { show: true, position: "top", horizontalAlign: "left" },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: { show: false },
      animations: { enabled: false },
    },
    stroke: { curve: "straight", width: [2, 2] },
    fill: { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } },
    markers: { size: 0, strokeColors: "#fff", strokeWidth: 2, hover: { size: 6 } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: { enabled: true },
    xaxis: { type: "category", categories, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { fontSize: "12px", colors: ["#6B7280"] } } },
  }), [categories]);

  const series = useMemo(() => [
    { name: "Pedidos", data: data.map((d) => d.order_count) },
    { name: "Ingresos", data: data.map((d) => Number(d.total_sales)) },
  ], [data]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Estadísticas (últimos 12 meses)</h3>
      <div className="max-w-full overflow-x-auto custom-scrollbar mt-6">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}