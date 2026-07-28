import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button"; 

export default function ProductFormModal({ isOpen, onClose, onSaved, editingProduct }) {
  const { authRequest } = useAuth();
  const { showToast } = useToast(); 
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", category_id: "", price: "", stock: "", image_url: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authRequest("/categories/").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        category_id: editingProduct.category_id,
        price: editingProduct.price,
        stock: editingProduct.stock,
        image_url: editingProduct.image_url,
      });
    } else {
      setForm({ name: "", category_id: "", price: "", stock: "", image_url: "" });
    }
  }, [editingProduct, isOpen]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        price: Number(form.price),
        stock: Number(form.stock),
      };
      if (editingProduct) {
        await authRequest(`/products/${editingProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("edit", "Producto");
      } else {
        await authRequest("/products/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("create", "Producto");
      }
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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md m-4">
      <div className="p-6">
        <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          {editingProduct ? "Editar producto" : "Nuevo producto"}
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Nombre</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Categoría</label>
            <select
              required
              value={form.category_id}
              onChange={(e) => handleChange("category_id", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Precio</label>
              <input
                type="number" step="0.01" required
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Stock</label>
              <input
                type="number" required
                value={form.stock}
                onChange={(e) => handleChange("stock", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">URL de imagen</label>
            <input
              type="text" required
              value={form.image_url}
              onChange={(e) => handleChange("image_url", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button variant="primary" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}