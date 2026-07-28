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
import { PencilIcon, TrashBinIcon } from "../../icons";

export default function ProductsTable({ onEdit, refreshKey }) {
  const { authRequest } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
          authRequest("/products/"),
          authRequest("/categories/"),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
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
      await authRequest(`/products/${deleteTarget.id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast("delete", "Producto");
    } catch (err) {
      showToast("error", null, err.message);
    } finally {
      setDeleteTarget(null);
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? p.category_id === Number(categoryFilter) : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Cargando productos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Producto</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Categoría</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Precio</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Stock</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="px-5 py-4 text-start">
                    <div className="flex items-center gap-3">
                      <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {product.category.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    ${Number(product.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge size="sm" color={product.stock > 10 ? "success" : product.stock > 0 ? "warning" : "error"}>
                      {product.stock} unidades
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        title="Editar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-warning-300 text-warning-500 hover:bg-warning-50 dark:border-warning-500/30 dark:hover:bg-warning-500/15"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
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
        title="Eliminar producto"
        message={deleteTarget ? `¿Seguro que quieres eliminar "${deleteTarget.name}"? Esta acción no se puede deshacer.` : ""}
      />
    </div>
  );
}