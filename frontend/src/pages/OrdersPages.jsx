import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import OrdersTable from "../components/orders/OrdersTable";
import OrderFormModal from "../components/orders/OrderFormModal";
import OrderDetailModal from "../components/orders/OrderDetailModal";

export default function OrdersPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSaved() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <>
      <PageMeta title="Pedidos" description="Gestión de pedidos" />
      <PageBreadcrumb pageTitle="Pedidos" />
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>+ Nuevo pedido</Button>
        </div>
        <ComponentCard title="Pedidos">
          <OrdersTable onViewDetail={(order) => setDetailOrderId(order.id)} refreshKey={refreshKey} />
        </ComponentCard>
      </div>

      <OrderFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSaved={handleSaved}
      />

      <OrderDetailModal
        isOpen={detailOrderId !== null}
        onClose={() => setDetailOrderId(null)}
        orderId={detailOrderId}
        onStatusChanged={handleSaved}
      />
    </>
  );
}