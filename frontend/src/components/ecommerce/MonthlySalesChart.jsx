import { useMemo } from "react";
import Chart from "react-apexcharts";

export default function MonthlySalesChart({ data }) {
  const categories = useMemo(
    () => data.map((d) => new Date(d.month + "T00:00:00").toLocaleDateString("es-ES", { month: "short" })),
    [data]
  );

  const options = useMemo(() => ({
    colors: ["#465fff"],
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", height: 180, toolbar: { show: false }, animations: { enabled: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "39%", borderRadius: 5, borderRadiusApplication: "end" } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false } },
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { x: { show: false }, y: { formatter: (val) => `$${val.toFixed(2)}` } },
  }), [categories]);

  const series = useMemo(() => [{ name: "Ventas", data: data.map((d) => Number(d.total_sales)) }], [data]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Ventas mensuales</h3>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}