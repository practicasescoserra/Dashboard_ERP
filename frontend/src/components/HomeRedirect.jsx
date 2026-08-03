import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardPage from "../pages/DashboardPage";

const ROLE_HOME = {
  proveedor: "/inventory",
  vendedor: "/orders",
};

export default function HomeRedirect() {
  const { user } = useAuth();
  const redirectTo = ROLE_HOME[user?.role];

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <DashboardPage />;
}