import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ClientsPage from "./pages/ClientsPage";
import DomainsPage from "./pages/DomainsPage";
import RequestsPage from "./pages/RequestsPage";
import ContractsPage from "./pages/ContractsPage";
import PaymentsPage from "./pages/PaymentsPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import MyDomainsPage from "./pages/MyDomainsPage";
import MyPaymentsPage from "./pages/MyPaymentsPage";
import MyRequestsPage from "./pages/MyRequestsPage";

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Маршруты для clients */}
        <Route
          path="my-domains"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MyDomainsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-payments"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MyPaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-requests"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MyRequestsPage />
            </ProtectedRoute>
          }
        />

        {/* Маршруты для managers и engineers */}
        <Route
          path="clients"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ClientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="domains"
          element={
            <ProtectedRoute allowedRoles={["manager", "engineer"]}>
              <DomainsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="requests"
          element={
            <ProtectedRoute allowedRoles={["manager", "engineer"]}>
              <RequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="contracts"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ContractsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payments"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRouter;