import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";

const ROLES = ["admin", "proveedor", "analista", "vendedor"];

export default function UserFormModal({ isOpen, onClose, onSaved, editingUser }) {
  const { authRequest } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ username: "", email: "", full_name: "", password: "", role: "vendedor" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setForm({
        username: editingUser.username,
        email: editingUser.email,
        full_name: editingUser.full_name || "",
        password: "",
        role: editingUser.role,
      });
    } else {
      setForm({ username: "", email: "", full_name: "", password: "", role: "vendedor" });
    }
  }, [editingUser, isOpen]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingUser) {
        await authRequest(`/users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify({ full_name: form.full_name, role: form.role }),
        });
        showToast("edit", "Usuario");
      } else {
        await authRequest("/users/", {
          method: "POST",
          body: JSON.stringify({
            username: form.username,
            email: form.email,
            full_name: form.full_name || null,
            password: form.password,
            role: form.role,
          }),
        });
        showToast("create", "Usuario");
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
          {editingUser ? "Editar usuario" : "Nuevo usuario"}
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingUser && (
            <>
              <div>
                <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Usuario</label>
                <input
                  type="text" required
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
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
                <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Contraseña</label>
                <input
                  type="password" required
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Nombre completo</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Rol</label>
            <select
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
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