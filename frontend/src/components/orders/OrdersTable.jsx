import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../ui/ConfirmDialog";
import { TrashBinIcon } from "../../icons";

const STATUS_COLOR = {
  Delivered: "success",
  Pending: "warning",
  Canceled: "error",
};

export default function OrdersTable({ onViewDetail, refreshKey }) {
  const { authRequest } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await authRequest("/orders/");
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey]);

  async function confirmDelete() {
    try {
      await authRequest(`/orders/${deleteTarget.id}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      showToast("delete", "Pedido");
    } catch (err) {
      showToast("error", null, err.message);
    } finally {
      setDeleteTarget(null);
    }
  }

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    const matchesSearch = search ? o.id.toString().includes(search.trim()) : true;
    return matchesStatus && matchesSearch;
  });

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Cargando pedidos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por número de pedido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">Todos los estados</option>
          <option value="Delivered">Delivered</option>
          <option value="Pending">Pending</option>
          <option value="Canceled">Canceled</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Pedido #</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Cliente</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Total</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="px-5 py-4 text-start font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    #{order.id}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {order.customer.full_name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    ${Number(order.total).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge size="sm" color={STATUS_COLOR[order.status]}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewDetail(order)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        Ver detalle
                      </button>
                      <button
                        onClick={() => setDeleteTarget(order)}
                        title="Eliminar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-error-300 text-error-500 hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/15"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar pedido"
        message={deleteTarget ? `¿Seguro que quieres eliminar el pedido #${deleteTarget.id}? Esta acción no se puede deshacer.` : ""}
      />
    </div>
  );
}