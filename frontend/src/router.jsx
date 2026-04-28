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
        <Route path="clients" element={<ClientsPage />} />
        <Route path="domains" element={<DomainsPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRouter;