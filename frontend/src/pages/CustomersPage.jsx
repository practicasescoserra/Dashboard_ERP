import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import CustomersTable from "../components/customers/CustomersTable";
import CustomerFormModal from "../components/customers/CustomerFormModal";

export default function CustomersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreateModal() {
    setEditingCustomer(null);
    setModalOpen(true);
  }

  function openEditModal(customer) {
    setEditingCustomer(customer);
    setModalOpen(true);
  }

  function handleSaved() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <>
      <PageMeta title="Clientes" description="Gestión de clientes" />
      <PageBreadcrumb pageTitle="Clientes" />
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreateModal}>+ Nuevo cliente</Button>
        </div>
        <ComponentCard title="Clientes">
          <CustomersTable onEdit={openEditModal} refreshKey={refreshKey} />
        </ComponentCard>
      </div>

      <CustomerFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editingCustomer={editingCustomer}
      />
    </>
  );
}