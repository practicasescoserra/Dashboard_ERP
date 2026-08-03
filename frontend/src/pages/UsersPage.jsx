import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import UsersTable from "../components/admin/UsersTable";
import UserFormModal from "../components/admin/UserFormModal";

export default function UsersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreateModal() {
    setEditingUser(null);
    setModalOpen(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setModalOpen(true);
  }

  function handleSaved() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <>
      <PageMeta title="Usuarios" description="Gestión de usuarios y roles" />
      <PageBreadcrumb pageTitle="Usuarios" />
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreateModal}>+ Nuevo usuario</Button>
        </div>
        <ComponentCard title="Usuarios">
          <UsersTable onEdit={openEditModal} refreshKey={refreshKey} />
        </ComponentCard>
      </div>

      <UserFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editingUser={editingUser}
      />
    </>
  );
}