import axios from "axios";

// In production on Vercel (single domain), prefer same-origin requests by default.
const baseURL = import.meta.env.VITE_API_BASE_URL || "";

function expectArray(value, label) {
  if (!Array.isArray(value)) {
    const err = new Error(`Unexpected API response for ${label}`);
    err.code = "BAD_API_SHAPE";
    throw err;
  }
  return value;
}

function expectObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    const err = new Error(`Unexpected API response for ${label}`);
    err.code = "BAD_API_SHAPE";
    throw err;
  }
  return value;
}

export function createApi(getIdToken) {
  const client = axios.create({
    baseURL: `${baseURL}/api`,
  });

  client.interceptors.request.use(async (config) => {
    const token = await getIdToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => {
      const contentType = String(res.headers?.["content-type"] || "");
      // If the API accidentally returns HTML (SPA index), don't let the UI crash on undefined shapes.
      if (contentType.includes("text/html")) {
        const err = new Error("API returned HTML instead of JSON. Check Vercel routing / domain.");
        err.code = "API_HTML_RESPONSE";
        throw err;
      }
      return res;
    },
    (err) => Promise.reject(err),
  );

  return {
    async me() {
      const res = await client.get("/auth/me");
      return expectObject(res.data?.data, "me");
    },

    async updateSettings(payload) {
      const res = await client.patch("/users/settings", payload);
      return expectObject(res.data?.data, "updateSettings");
    },

    async listCompanies() {
      const res = await client.get("/companies");
      return expectArray(res.data?.data, "listCompanies");
    },

    async createCompany(payload) {
      const res = await client.post("/companies", payload);
      return expectObject(res.data?.data, "createCompany");
    },

    async updateCompany(id, payload) {
      const res = await client.patch(`/companies/${id}`, payload);
      return expectObject(res.data?.data, "updateCompany");
    },

    async deleteCompany(id) {
      const res = await client.delete(`/companies/${id}`);
      return expectObject(res.data?.data, "deleteCompany");
    },

    async createApplication(payload) {
      const res = await client.post("/applications", payload);
      return expectObject(res.data?.data, "createApplication");
    },

    async listApplications(params) {
      const res = await client.get("/applications", { params });
      return expectArray(res.data?.data, "listApplications");
    },

    async getApplication(id) {
      const res = await client.get(`/applications/${id}`);
      return expectObject(res.data?.data, "getApplication");
    },

    async updateApplication(id, payload) {
      const res = await client.patch(`/applications/${id}`, payload);
      return expectObject(res.data?.data, "updateApplication");
    },

    async updateApplicationStatus(id, status) {
      const res = await client.patch(`/applications/${id}/status`, { status });
      return expectObject(res.data?.data, "updateApplicationStatus");
    },

    async deleteApplication(id) {
      const res = await client.delete(`/applications/${id}`);
      return expectObject(res.data?.data, "deleteApplication");
    },

    async addInterviewRound(appId, payload) {
      const res = await client.post(`/applications/${appId}/rounds`, payload);
      return expectObject(res.data?.data, "addInterviewRound");
    },

    async updateInterviewRound(appId, roundId, payload) {
      const res = await client.patch(`/applications/${appId}/rounds/${roundId}`, payload);
      return expectObject(res.data?.data, "updateInterviewRound");
    },

    async deleteInterviewRound(appId, roundId) {
      const res = await client.delete(`/applications/${appId}/rounds/${roundId}`);
      return expectObject(res.data?.data, "deleteInterviewRound");
    },

    async listTasks(params) {
      const res = await client.get("/tasks", { params });
      return expectArray(res.data?.data, "listTasks");
    },

    async createTask(payload) {
      const res = await client.post("/tasks", payload);
      return expectObject(res.data?.data, "createTask");
    },

    async updateTask(id, payload) {
      const res = await client.patch(`/tasks/${id}`, payload);
      return expectObject(res.data?.data, "updateTask");
    },

    async completeTask(id) {
      const res = await client.patch(`/tasks/${id}/complete`);
      return expectObject(res.data?.data, "completeTask");
    },

    async dismissTask(id) {
      const res = await client.patch(`/tasks/${id}/dismiss`);
      return expectObject(res.data?.data, "dismissTask");
    },

    async deleteTask(id) {
      const res = await client.delete(`/tasks/${id}`);
      return expectObject(res.data?.data, "deleteTask");
    },

    // Phase 2 - Documents
    async listDocuments(params) {
      const res = await client.get("/documents", { params });
      return expectArray(res.data?.data, "listDocuments");
    },

    async createDocument(payload) {
      const res = await client.post("/documents", payload);
      return expectObject(res.data?.data, "createDocument");
    },

    async updateDocument(id, payload) {
      const res = await client.patch(`/documents/${id}`, payload);
      return expectObject(res.data?.data, "updateDocument");
    },

    async deleteDocument(id) {
      const res = await client.delete(`/documents/${id}`);
      return expectObject(res.data?.data, "deleteDocument");
    },

    async uploadDocument(formData) {
      const res = await client.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return expectObject(res.data?.data, "uploadDocument");
    },

    // Phase 2 - Sharing
    async createShare(payload) {
      const res = await client.post("/shares", payload);
      return expectObject(res.data?.data, "createShare");
    },

    async listShares() {
      const res = await client.get("/shares");
      return expectArray(res.data?.data, "listShares");
    },

    async revokeShare(id) {
      const res = await client.patch(`/shares/${id}/revoke`);
      return expectObject(res.data?.data, "revokeShare");
    },

    // Phase 2 - Analytics
    async analyticsSummary() {
      const res = await client.get("/analytics/summary");
      return expectObject(res.data?.data, "analyticsSummary");
    },
  };
}

// Public endpoints (no auth header)
export function publicApi() {
  const client = axios.create({
    baseURL: `${baseURL}/api`,
  });
  return {
    async getPublicShare(token) {
      const res = await client.get(`/shares/public/${token}`);
      return expectObject(res.data?.data, "getPublicShare");
    },
  };
}
