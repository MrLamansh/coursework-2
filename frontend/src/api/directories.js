import apiClient from "./client";

export async function getDomainStatuses() {
  const response = await apiClient.get("/directories/domain-statuses");
  return response.data;
}

export async function getContractStatuses() {
  const response = await apiClient.get("/directories/contract-statuses");
  return response.data;
}

export async function getRegistrars() {
  const response = await apiClient.get("/directories/registrars");
  return response.data;
}

export async function getEventTypes() {
  const response = await apiClient.get("/directories/event-types");
  return response.data;
}

export async function getPaymentStatuses() {
  const response = await apiClient.get("/directories/payment-statuses");
  return response.data;
}

export async function getPaymentTypes() {
  const response = await apiClient.get("/directories/payment-types");
  return response.data;
}

export async function getRequestStatuses() {
  const response = await apiClient.get("/directories/request-statuses");
  return response.data;
}

export async function getRequestTypes() {
  const response = await apiClient.get("/directories/request-types");
  return response.data;
}

