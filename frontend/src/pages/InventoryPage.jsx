import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import ProductsTable from "../components/inventory/ProductsTable";
import ProductFormModal from "../components/inventory/ProductFormModal";

export default function InventoryPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreateModal() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  function handleSaved() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <>
      <PageMeta title="Inventario" description="Gestión de inventario de productos" />
      <PageBreadcrumb pageTitle="Inventario" />
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreateModal}>+ Nuevo producto</Button>
        </div>
        <ComponentCard title="Productos">
          <ProductsTable onEdit={openEditModal} refreshKey={refreshKey} />
        </ComponentCard>
      </div>

      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editingProduct={editingProduct}
      />
    </>
  );
}