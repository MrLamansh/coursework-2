import apiClient from "./http";

export async function getUsers(skip = 0, limit = 100) {
  const response = await apiClient.get("/users/", {
    params: { skip, limit },
  });
  return response.data;
}


export async function createUser(userData) {
  const response = await apiClient.post("/users/", userData);
  return response.data;
}

export async function updateUser(userId, userData) {
  const response = await apiClient.put(`/users/${userId}`, userData);
  return response.data;
}

export async function deleteUser(userId) {
  await apiClient.delete(`/users/${userId}`);
}
