import apiClient from "./client";

export async function getRequests() {
  const response = await apiClient.get("/requests/");
  return response.data;
}

export async function getMyRequests() {
  const response = await apiClient.get("/requests/my");
  return response.data;
}

export async function getRequest(requestId) {
  const response = await apiClient.get(`/requests/${requestId}`);
  return response.data;
}

export async function createRequest(requestData) {
  const response = await apiClient.post("/requests/", requestData);
  return response.data;
}

export async function updateRequest(requestId, requestData) {
  const response = await apiClient.put(`/requests/${requestId}`, requestData);
  return response.data;
}

export async function deleteRequest(requestId) {
  const response = await apiClient.delete(`/requests/${requestId}`);
  return response.data;
}

