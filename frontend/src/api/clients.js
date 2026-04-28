import apiClient from "./client";

export async function getClients() {
  const response = await apiClient.get("/clients/");
  return response.data;
}

export async function createClient(clientData) {
  const response = await apiClient.post("/clients/", clientData);
  return response.data;
}

export async function updateClient(clientId, clientData) {
  const response = await apiClient.put(`/clients/${clientId}`, clientData);
  return response.data;
}

export async function deleteClient(clientId) {
  const response = await apiClient.delete(`/clients/${clientId}`);
  return response.data;
}