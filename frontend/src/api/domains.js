import apiClient from "./client";

export async function getDomains() {
  const response = await apiClient.get("/domains/");
  return response.data;
}

export async function createDomain(domainData) {
  const response = await apiClient.post("/domains/", domainData);
  return response.data;
}

export async function updateDomain(domainId, domainData) {
  const response = await apiClient.put(`/domains/${domainId}`, domainData);
  return response.data;
}

export async function deleteDomain(domainId) {
  const response = await apiClient.delete(`/domains/${domainId}`);
  return response.data;
}
