import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export function createApi(getIdToken) {
  const client = axios.create({
    baseURL: `${baseURL}/api`,
  });

  client.interceptors.request.use(async (config) => {
    const token = await getIdToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return {
    async me() {
      const res = await client.get("/auth/me");
      return res.data.data;
    },

    async listCompanies() {
      const res = await client.get("/companies");
      return res.data.data;
    },

    async createCompany(payload) {
      const res = await client.post("/companies", payload);
      return res.data.data;
    },

    async updateCompany(id, payload) {
      const res = await client.patch(`/companies/${id}`, payload);
      return res.data.data;
    },

    async deleteCompany(id) {
      const res = await client.delete(`/companies/${id}`);
      return res.data.data;
    },

    async createApplication(payload) {
      const res = await client.post("/applications", payload);
      return res.data.data;
    },

    async listApplications(params) {
      const res = await client.get("/applications", { params });
      return res.data.data;
    },

    async getApplication(id) {
      const res = await client.get(`/applications/${id}`);
      return res.data.data;
    },

    async updateApplication(id, payload) {
      const res = await client.patch(`/applications/${id}`, payload);
      return res.data.data;
    },

    async updateApplicationStatus(id, status) {
      const res = await client.patch(`/applications/${id}/status`, { status });
      return res.data.data;
    },

    async deleteApplication(id) {
      const res = await client.delete(`/applications/${id}`);
      return res.data.data;
    },

    async addInterviewRound(appId, payload) {
      const res = await client.post(`/applications/${appId}/rounds`, payload);
      return res.data.data;
    },

    async updateInterviewRound(appId, roundId, payload) {
      const res = await client.patch(`/applications/${appId}/rounds/${roundId}`, payload);
      return res.data.data;
    },

    async deleteInterviewRound(appId, roundId) {
      const res = await client.delete(`/applications/${appId}/rounds/${roundId}`);
      return res.data.data;
    },

    async listTasks(params) {
      const res = await client.get("/tasks", { params });
      return res.data.data;
    },

    async createTask(payload) {
      const res = await client.post("/tasks", payload);
      return res.data.data;
    },

    async updateTask(id, payload) {
      const res = await client.patch(`/tasks/${id}`, payload);
      return res.data.data;
    },

    async completeTask(id) {
      const res = await client.patch(`/tasks/${id}/complete`);
      return res.data.data;
    },

    async dismissTask(id) {
      const res = await client.patch(`/tasks/${id}/dismiss`);
      return res.data.data;
    },

    async deleteTask(id) {
      const res = await client.delete(`/tasks/${id}`);
      return res.data.data;
    },
  };
}
