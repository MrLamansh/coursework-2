import apiClient from "./client";

export async function getContracts(clientId) {
  const params = {};

  if (clientId !== undefined && clientId !== null && clientId !== "") {
    params.client_id = clientId;
  }

  const response = await apiClient.get("/contracts/", { params });
  return response.data;
}

export async function getContract(contractId) {
  const response = await apiClient.get(`/contracts/${contractId}`);
  return response.data;
}

export async function createContract(contractData) {
  const response = await apiClient.post("/contracts/", contractData);
  return response.data;
}

export async function updateContract(contractId, contractData) {
  const response = await apiClient.put(`/contracts/${contractId}`, contractData);
  return response.data;
}

export async function deleteContract(contractId) {
  const response = await apiClient.delete(`/contracts/${contractId}`);
  return response.data;
}

export async function getContractStatuses() {
  const response = await apiClient.get("/directories/contract-statuses");
  return response.data;
}

