import axios from "axios";

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXTAUTH_URL || "http://localhost:3000";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  getSession: () => api.get("/api/auth/session"),
  logout: () => api.get("/api/auth/signout"),
};

export const batchAPI = {
  create: (data: {
    name: string;
    startTime: string;
    delayBetween: number;
    hourlyLimit: number;
  }) => api.post("/api/batch/create", data),
  list: () => api.get("/api/batch/list"),
};

export const emailAPI = {
  add: (data: {
    batchId: string;
    to: string;
    subject: string;
    bodyText: string;
  }) => api.post("/api/email/add", data),
  getScheduled: () => api.get("/api/email/scheduled"),
  getSent: () => api.get("/api/email/sent"),
};

export default api;
