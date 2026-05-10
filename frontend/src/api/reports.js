import apiClient from "./client";

export async function exportDomains() {
  const response = await apiClient.post("/reports/export?report_type=domains");
  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  downloadCSV(blob, "domains.csv");
}

export async function exportExpiringDomains(days = 30) {
  const response = await apiClient.post(`/reports/export?report_type=expiring&days=${days}`);
  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  downloadCSV(blob, "expiring_domains.csv");
}

export async function exportClientPayments(clientId) {
  const response = await apiClient.post(
    `/reports/export?report_type=client_payments&client_id=${clientId}`
  );
  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  downloadCSV(blob, "client_payments.csv");
}

function downloadCSV(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

