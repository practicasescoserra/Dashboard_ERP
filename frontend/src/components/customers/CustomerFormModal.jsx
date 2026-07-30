import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";

export default function CustomerFormModal({ isOpen, onClose, onSaved, editingCustomer }) {
  const { authRequest } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ full_name: "", email: "", country: "", phone: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingCustomer) {
      setForm({
        full_name: editingCustomer.full_name,
        email: editingCustomer.email,
        country: editingCustomer.country,
        phone: editingCustomer.phone || "",
      });
    } else {
      setForm({ full_name: "", email: "", country: "", phone: "" });
    }
  }, [editingCustomer, isOpen]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, phone: form.phone || null };
      if (editingCustomer) {
        await authRequest(`/customers/${editingCustomer.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("edit", "Cliente");
      } else {
        await authRequest("/customers/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("create", "Cliente");
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
          {editingCustomer ? "Editar cliente" : "Nuevo cliente"}
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Nombre completo</label>
            <input
              type="text" required
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">País</label>
            <input
              type="text" required
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Teléfono (opcional)</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
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