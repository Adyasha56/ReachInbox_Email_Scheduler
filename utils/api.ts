import axios from "axios";

/**
 * Since frontend & backend both are Next.js
 * and auth is cookie-based (NextAuth),
 * we MUST enable credentials.
 */
const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Global response handler
 * If backend returns 401 → user not logged in
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // redirect to Google login (backend route)
      window.location.href = "/api/auth/signin/google";
    }
    return Promise.reject(error);
  }
);

/* =========================
   AUTH APIs
========================= */

export const authAPI = {
  /**
   * Start Google OAuth login
   */
  login: () => {
    window.location.href = "/api/auth/signin/google";
  },

  /**
   * Get current logged-in user
   */
  getSession: () => api.get("/api/auth/session"),

  /**
   * Logout user
   */
  logout: () => api.get("/api/auth/signout"),
};

/* =========================
   EMAIL BATCH (CAMPAIGN)
========================= */

export const batchAPI = {
  /**
   * Create a new email campaign
   */
  create: (data: {
    name: string;
    startTime: string; // ISO string
    delayBetween: number;
    hourlyLimit: number;
  }) => api.post("/api/batch/create", data),
};

/* =========================
   EMAIL APIs
========================= */

export const emailAPI = {
  /**
   * Add email to an existing batch
   */
  add: (data: {
    batchId: string;
    to: string;
    subject: string;
    bodyText: string;
  }) => api.post("/api/email/add", data),
};

export default api;
