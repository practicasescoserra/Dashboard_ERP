import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Autocomplete from "../ui/Autocomplete";
import { TrashBinIcon } from "../../icons";

export default function OrderFormModal({ isOpen, onClose, onSaved }) {
  const { authRequest } = useAuth();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [status, setStatus] = useState("Pending");
  const [items, setItems] = useState([{ product_id: null, quantity: 1 }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([authRequest("/customers/options"), authRequest("/products/options")])
      .then(([customersData, productsData]) => {
        setCustomers(customersData);
        setProducts(productsData);
      })
      .catch((err) => setError(err.message));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCustomerId(null);
      setStatus("Pending");
      setItems([{ product_id: null, quantity: 1 }]);
      setError("");
    }
  }, [isOpen]);

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { product_id: null, quantity: 1 }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const estimatedTotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) return sum;
    return sum + Number(product.price) * Number(item.quantity || 0);
  }, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!customerId) {
      setError("Selecciona un cliente");
      return;
    }
    const validItems = items.filter((item) => item.product_id);
    if (validItems.length === 0) {
      setError("Agrega al menos un producto");
      return;
    }

    setSaving(true);
    try {
      await authRequest("/orders/", {
        method: "POST",
        body: JSON.stringify({
          customer_id: customerId,
          status,
          items: validItems.map((item) => ({
            product_id: item.product_id,
            quantity: Number(item.quantity),
          })),
        }),
      });
      showToast("create", "Pedido");
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      showToast("error", null, err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="p-6">
        <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">Nuevo pedido</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Cliente</label>
            <Autocomplete
              options={customers}
              selectedValue={customerId}
              onSelect={setCustomerId}
              placeholder="Escribe el nombre del cliente..."
              getOptionLabel={(c) => c.full_name}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Estado inicial</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="Pending">Pending</option>
              <option value="Delivered">Delivered</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">Productos</label>
              <button type="button" onClick={addItem} className="text-sm font-medium text-brand-500 hover:text-brand-600">
                + Agregar producto
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Autocomplete
                      options={products}
                      selectedValue={item.product_id}
                      onSelect={(id) => updateItem(index, "product_id", id)}
                      placeholder="Buscar producto..."
                      getOptionLabel={(p) => p.name}
                      isOptionDisabled={(p) => p.stock === 0}
                      renderOption={(p) => (
                        <div className="flex justify-between gap-2">
                          <span className={p.stock === 0 ? "text-gray-400 dark:text-gray-500" : ""}>{p.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                            ${Number(p.price).toFixed(2)} · stock {p.stock}
                          </span>
                        </div>
                      )}
                    />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    className="w-16 shrink-0 rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="shrink-0 text-error-500 hover:text-error-600">
                      <TrashBinIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between border-t border-gray-100 pt-3 text-sm font-medium text-gray-800 dark:border-white/[0.05] dark:text-white/90">
            <span>Total estimado</span>
            <span>${estimatedTotal.toFixed(2)}</span>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button variant="primary" disabled={saving}>{saving ? "Guardando..." : "Crear pedido"}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}