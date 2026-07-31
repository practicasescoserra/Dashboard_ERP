import { useMemo } from "react";
import Chart from "react-apexcharts";

export default function MonthlyTarget({ target, currentRevenue, progressPct }) {
  const series = useMemo(() => [progressPct], [progressPct]);

  const options = useMemo(() => ({
    colors: ["#465FFF"],
    chart: { fontFamily: "Outfit, sans-serif", type: "radialBar", height: 330, sparkline: { enabled: true }, animations: { enabled: false } },
    plotOptions: {
      radialBar: {
        startAngle: -85, endAngle: 85, hollow: { size: "80%" },
        track: { background: "#E4E7EC", strokeWidth: "100%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: { fontSize: "36px", fontWeight: "600", offsetY: -40, color: "#1D2939", formatter: (val) => val + "%" },
        },
      },
    },
    fill: { type: "solid", colors: ["#465FFF"] },
    stroke: { lineCap: "round" },
    labels: ["Progreso"],
  }), []);

  const remaining = Math.max(target - currentRevenue, 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Meta mensual</h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">Progreso de ingresos del mes actual</p>

        <div className="relative">
          <div className="max-h-[330px]">
            <Chart options={options} series={series} type="radialBar" height={330} />
          </div>
          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
            ${currentRevenue.toFixed(0)} de ${target}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">Meta</p>
          <p className="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">${target}</p>
        </div>
        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">Actual</p>
          <p className="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">${currentRevenue.toFixed(0)}</p>
        </div>
        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">Falta</p>
          <p className="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">${remaining.toFixed(0)}</p>
        </div>
      </div>
    </div>
  );
}