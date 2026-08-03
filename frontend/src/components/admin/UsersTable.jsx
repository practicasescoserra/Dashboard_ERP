import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { PencilIcon } from "../../icons";

const ROLE_COLOR = { admin: "success", proveedor: "info", analista: "warning", vendedor: "primary" };

export default function UsersTable({ onEdit, refreshKey }) {
  const { authRequest, user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const data = await authRequest("/users/");
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [refreshKey]);

  async function toggleActive(targetUser) {
    try {
      await authRequest(`/users/${targetUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !targetUser.is_active }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: !u.is_active } : u))
      );
      showToast("edit", "Usuario");
    } catch (err) {
      showToast("error", null, err.message);
    }
  }

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Cargando usuarios...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Usuario</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Rol</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="px-5 py-4 text-start font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {u.username} {u.id === currentUser.id && <span className="text-xs text-gray-400">(tú)</span>}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">{u.email}</TableCell>
                <TableCell className="px-4 py-3">
                  <Badge size="sm" color={ROLE_COLOR[u.role] || "primary"}>{u.role}</Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(u)}
                    disabled={u.id === currentUser.id}
                    className="disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Badge size="sm" color={u.is_active ? "success" : "error"}>
                      {u.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <button
                    onClick={() => onEdit(u)}
                    title="Editar"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-warning-300 text-warning-500 hover:bg-warning-50 dark:border-warning-500/30 dark:hover:bg-warning-500/15"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}