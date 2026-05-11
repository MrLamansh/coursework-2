import apiClient from "./client";

export async function exportDomains() {
  const blob = await fetchCsvBlob("/reports/export?report_type=domains");
  downloadCSV(blob, "domains.csv");
}

export async function exportExpiringDomains(days = 30) {
  const blob = await fetchCsvBlob(`/reports/export?report_type=expiring&days=${days}`);
  downloadCSV(blob, "expiring_domains.csv");
}

export async function exportClientPayments(clientId) {
  const blob = await fetchCsvBlob(`/reports/export?report_type=client_payments&client_id=${clientId}`);
  downloadCSV(blob, "client_payments.csv");
}

async function fetchCsvBlob(url) {
  const response = await apiClient.post(url, {}, { responseType: "arraybuffer" });
  return new Blob([response.data], { type: "text/csv;charset=utf-8" });
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

