import apiClient from "./client";

export async function getPayments() {
  const response = await apiClient.get("/payments/");
  return response.data;
}

export async function getMyPayments() {
  const response = await apiClient.get("/payments/my");
  return response.data;
}

export async function getPayment(paymentId) {
  const response = await apiClient.get(`/payments/${paymentId}`);
  return response.data;
}

export async function createPayment(paymentData) {
  const response = await apiClient.post("/payments/", paymentData);
  return response.data;
}

export async function updatePayment(paymentId, paymentData) {
  const response = await apiClient.put(`/payments/${paymentId}`, paymentData);
  return response.data;
}

export async function deletePayment(paymentId) {
  const response = await apiClient.delete(`/payments/${paymentId}`);
  return response.data;
}

