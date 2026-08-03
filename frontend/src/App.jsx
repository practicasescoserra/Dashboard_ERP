import { Routes, Route } from 'react-router-dom'
import { ScrollToTop } from './components/common/ScrollToTop'
import AppLayout from './layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'

import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import InventoryPage from './pages/InventoryPage'
import CustomersPage from './pages/CustomersPage'
import NotFoundPage from './pages/NotFoundPage'
import OrdersPage from './pages/OrdersPages'
import AnalyticsPage from './pages/AnalyticsPage'
import UsersPage from './pages/UsersPage'
import HomeRedirect from './components/HomeRedirect'


function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index path="/" element={<HomeRedirect />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route
            path="/inventory"
            element={
              <RoleProtectedRoute allowedRoles={["admin", "proveedor"]}>
                <InventoryPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <RoleProtectedRoute allowedRoles={["admin", "analista"]}>
                <CustomersPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <RoleProtectedRoute allowedRoles={["admin", "vendedor"]}>
                <OrdersPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <RoleProtectedRoute allowedRoles={["admin", "analista"]}>
                <AnalyticsPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <UsersPage />
              </RoleProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App