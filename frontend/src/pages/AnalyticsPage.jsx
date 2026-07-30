import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Chart from "react-apexcharts";
import DatePicker from "../components/ui/DatePicker";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../components/ui/table";

function toDateInputValue(date) {
  return date.toISOString().split("T")[0];
}

function getRangeForPreset(preset) {
  const now = new Date();
  const end = new Date(now);
  let start;
  if (preset === "today") {
    start = new Date(now);
  } else if (preset === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
  }
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function formatPeriodLabel(periodStr, granularity) {
  const date = new Date(periodStr + "T00:00:00");
  if (granularity === "year") {
    return date.getFullYear().toString();
  }
  if (granularity === "month") {
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function AnalyticsPage() {
  const { authRequest, authDownload } = useAuth();
  const { showToast } = useToast();

  const [range, setRange] = useState(getRangeForPreset("month"));
  const [granularity, setGranularity] = useState("day");
  const [summary, setSummary] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [newCustomersData, setNewCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activePreset, setActivePreset] = useState("month");

  function applyPreset(preset) {
    setActivePreset(preset);
    setRange(getRangeForPreset(preset));
  }

  function handleManualDateChange(field, value) {
    setActivePreset(null);
    setRange((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const params = `start=${range.start}&end=${range.end}`;
        const [summaryData, sales, products, newCustomers] = await Promise.all([
          authRequest(`/analytics/summary?${params}`),
          authRequest(`/analytics/sales-timeseries?${params}&granularity=${granularity}`),
          authRequest(`/analytics/top-products?${params}&limit=8`),
          authRequest(`/analytics/new-customers?${params}&granularity=${granularity}`),
        ]);
        setSummary(summaryData);
        setSalesData(sales);
        setTopProducts(products);
        setNewCustomersData(newCustomers);
      } catch (err) {
        showToast("error", null, err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [range, granularity]);

  async function handleExport(reportType, format) {
    setExporting(true);
    try {
      await authDownload(`/analytics/export?start=${range.start}&end=${range.end}&type=${reportType}&format=${format}`);
      showToast("create", "Reporte");
    } catch (err) {
      showToast("error", null, err.message);
    } finally {
      setExporting(false);
    }
  }

  const salesChartOptions = {
    chart: { type: "area", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: ["#465fff"],
    xaxis: { categories: salesData.map((p) => formatPeriodLabel(p.period, granularity)) },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
  };
  const salesChartSeries = [{ name: "Ventas", data: salesData.map((p) => Number(p.total_sales)) }];

  const customersChartOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: ["#12b76a"],
    xaxis: { categories: newCustomersData.map((p) => formatPeriodLabel(p.period, granularity)) },
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "40%" } },
  };
  const customersChartSeries = [{ name: "Clientes nuevos", data: newCustomersData.map((p) => p.new_customers) }];

  return (
    <>
      <PageMeta title="Analytics" description="Análisis de ventas y clientes" />
      <PageBreadcrumb pageTitle="Analytics" />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <Button size="sm" variant={activePreset === "today" ? "primary" : "outline"} onClick={() => applyPreset("today")}>Hoy</Button>
          <Button size="sm" variant={activePreset === "month" ? "primary" : "outline"} onClick={() => applyPreset("month")}>Este mes</Button>
          <Button size="sm" variant={activePreset === "year" ? "primary" : "outline"} onClick={() => applyPreset("year")}>Este año</Button>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Desde</label>
          <DatePicker id="start-date" value={range.start} onChange={(val) => handleManualDateChange("start", val)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Hasta</label>
          <DatePicker id="end-date" value={range.end} onChange={(val) => handleManualDateChange("end", val)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Agrupar por</label>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="day">Día</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </select>
        </div>
      </div>

      {loading || !summary ? (
        <p className="text-gray-500 dark:text-gray-400">Cargando analytics...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Ingresos totales", value: `$${Number(summary.total_revenue).toFixed(2)}` },
              { label: "Pedidos totales", value: summary.total_orders },
              { label: "Ticket promedio", value: `$${Number(summary.average_order_value).toFixed(2)}` },
              { label: "Clientes nuevos", value: summary.new_customers },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{stat.value}</p>
              </div>
            ))}
          </div>

          <ComponentCard title="Ventas en el tiempo">
            <Chart options={salesChartOptions} series={salesChartSeries} type="area" height={250} />
          </ComponentCard>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ComponentCard title="Top productos">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto</TableCell>
                    <TableCell isHeader className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Vendidos</TableCell>
                    <TableCell isHeader className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ingresos</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {topProducts.map((p) => (
                    <TableRow key={p.product_id}>
                      <TableCell className="px-3 py-2 text-gray-800 text-theme-sm dark:text-white/90">{p.name}</TableCell>
                      <TableCell className="px-3 py-2 text-gray-500 text-theme-sm dark:text-gray-400">{p.quantity_sold}</TableCell>
                      <TableCell className="px-3 py-2 text-gray-500 text-theme-sm dark:text-gray-400">${Number(p.revenue).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ComponentCard>

            <ComponentCard title="Clientes nuevos">
              <Chart options={customersChartOptions} series={customersChartSeries} type="bar" height={250} />
            </ComponentCard>
          </div>

          <ComponentCard title="Exportar reportes">
            <div className="flex flex-wrap gap-3">
              <Button size="sm" variant="outline" disabled={exporting} onClick={() => handleExport("orders", "csv")}>Pedidos (CSV)</Button>
              <Button size="sm" variant="outline" disabled={exporting} onClick={() => handleExport("orders", "xlsx")}>Pedidos (Excel)</Button>
              <Button size="sm" variant="outline" disabled={exporting} onClick={() => handleExport("summary", "csv")}>Resumen (CSV)</Button>
              <Button size="sm" variant="outline" disabled={exporting} onClick={() => handleExport("summary", "xlsx")}>Resumen (Excel)</Button>
            </div>
          </ComponentCard>
        </div>
      )}
    </>
  );
}