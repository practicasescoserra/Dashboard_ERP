import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";

const STATUS_COLOR = { Delivered: "success", Pending: "warning", Canceled: "error" };

const STATUS_SELECTED_STYLE = {
  Delivered: "bg-success-500 border-success-500 text-white hover:bg-success-600",
  Pending: "bg-warning-500 border-warning-500 text-white hover:bg-warning-600",
  Canceled: "bg-error-500 border-error-500 text-white hover:bg-error-600",
};

const UNSELECTED_STYLE =
  "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5";

const STATUSES = ["Delivered", "Pending", "Canceled"];

export default function OrderDetailModal({ isOpen, onClose, orderId, onStatusChanged }) {
  const { authRequest } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isOpen || !orderId) return;
    setLoading(true);
    authRequest(`/orders/${orderId}`)
      .then(setOrder)
      .catch((err) => showToast("error", null, err.message))
      .finally(() => setLoading(false));
  }, [isOpen, orderId]);

  async function handleStatusChange(newStatus) {
    setUpdating(true);
    try {
      await authRequest(`/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      setOrder((prev) => ({ ...prev, status: newStatus }));
      showToast("edit", "Estado del pedido");
      onStatusChanged();
    } catch (err) {
      showToast("error", null, err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="p-6">
        {loading || !order ? (
          <p className="text-gray-500 dark:text-gray-400">Cargando detalle...</p>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 pr-12">
              <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">Pedido #{order.id}</h4>
              <Badge size="sm" color={STATUS_COLOR[order.status]}>{order.status}</Badge>
            </div>

            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              <p><span className="font-medium text-gray-700 dark:text-gray-300">Cliente:</span> {order.customer.full_name}</p>
              <p><span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> {order.customer.email}</p>
              <p><span className="font-medium text-gray-700 dark:text-gray-300">Fecha:</span> {new Date(order.created_at).toLocaleString()}</p>
            </div>

            <div className="mb-4 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2 dark:border-white/[0.05]">
                  <img src={item.product.image_url} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{item.product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.quantity} x ${Number(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    ${(item.quantity * Number(item.unit_price)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-4 flex justify-between border-t border-gray-100 pt-3 text-sm font-medium text-gray-800 dark:border-white/[0.05] dark:text-white/90">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Cambiar estado</label>
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={updating || order.status === s}
                    onClick={() => handleStatusChange(s)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default ${
                      order.status === s ? STATUS_SELECTED_STYLE[s] : UNSELECTED_STYLE
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}