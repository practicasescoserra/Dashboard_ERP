import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import PageMeta from "../components/common/PageMeta";
import BasicTableOne from "../components/tables/BasicTables/BasicTableOne";   

export default function InventoryPage() {
  return (
    <>
      <PageMeta
        title="Inventario"
        description="Gestión de inventario de productos"
      />
      <PageBreadcrumb pageTitle="Inventario" />
      <div className="space-y-6">
        <ComponentCard title="Productos">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}