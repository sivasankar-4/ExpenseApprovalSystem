import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearAuthSession,
  setAuthenticated,
  getAuthSession,
} from "@/services/auth/authSession";
import { API_BASE_URL } from "@/config/api";

// ── Types ─────────────────────────────────────────────────────────────────────
// Extend config to carry the retry flag
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// A single shared promise makes every 401 observer wait for the same refresh.
let refreshPromise: Promise<string> | null = null;
let refreshGeneration = 0;
let logoutRedirected = false;

// ── Force logout helper ───────────────────────────────────────────────────────
// Lives outside React so interceptors can call it safely.
const forceLogout = (): void => {
  if (logoutRedirected) return;

  logoutRedirected = true;
  clearAuthSession();
  if (window.location.pathname !== "/login") {
    // Hard redirect; the interceptor lives outside the React component tree.
    window.location.href = "/login";
  }
};

// ── Centralized Axios instance ────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  // Required for the browser to accept and send the backend's HttpOnly refresh
  // cookie (including when the API is on a different allowed origin).
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const publicAuthPaths = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/verify-otp",
  "/api/auth/reset-password",
];

const isPublicAuthRequest = (url?: string): boolean => {
  if (!url) return false;
  const path = url.split("?")[0];
  return publicAuthPaths.some((publicPath) => path.endsWith(publicPath));
};

const performRefreshAccessToken = async (): Promise<string> => {
  const sessionAtStart = getAuthSession();
  const refreshGenerationAtStart = refreshGeneration;

  if (sessionAtStart.status === "unauthenticated") {
    throw new Error("Session is already unauthenticated; aborting refresh.");
  }

  const { data } = await axios.post<{
    accessToken: string;
    tokenType?: string;
  }>(`${API_BASE_URL}/api/auth/refresh`, undefined, {
    withCredentials: true,
  });

  // Guard: If the session was cleared while the request was in flight, do not store the new token
  const sessionAfterRefresh = getAuthSession();
  if (
    sessionAfterRefresh.status === "unauthenticated" ||
    sessionAfterRefresh.generation !== sessionAtStart.generation ||
    refreshGeneration !== refreshGenerationAtStart
  ) {
    throw new Error("Session was invalidated during refresh; aborting token storage.");
  }

  if (!data.accessToken) {
    throw new Error("Refresh response did not include an access token");
  }

  setAuthenticated(data.accessToken);
  return data.accessToken;
};

const getRefreshPromise = (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  const promise = performRefreshAccessToken().catch((error: unknown) => {
    // A startup refresh can legitimately fail for a logged-out visitor. Only
    // an established session should trigger the hard login redirect.
    if (getAuthSession().status === "authenticated") {
      forceLogout();
    }
    throw error;
  });

  refreshPromise = promise;
  void promise.then(
    () => {
      if (refreshPromise === promise) refreshPromise = null;
    },
    () => {
      if (refreshPromise === promise) refreshPromise = null;
    },
  );
  return promise;
};

export const refreshAccessToken = (): Promise<string> => getRefreshPromise();

export const cancelTokenRefresh = (): void => {
  refreshGeneration += 1;
};

// ── REQUEST interceptor: attach current access token ─────────────────────────
api.interceptors.request.use(
  (config) => {
    if (isPublicAuthRequest(config.url)) {
      delete config.headers.Authorization;
      return config;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else if (!config.headers.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE interceptor: handle 401 with queued token refresh ───────────────
api.interceptors.response.use(
  // Pass successful responses straight through.
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    // Only handle 401s on requests we haven't already retried,
    // and never retry the refresh endpoint itself (avoids infinite loop).
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isPublicAuthRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // Guard: do not attempt refresh if already unauthenticated (logged out)
    if (getAuthSession().status === "unauthenticated") {
      return Promise.reject(error);
    }

    // Mark the request before waiting so a 401 from its retry cannot refresh again.
    originalRequest._retry = true;
    const sessionAtRequest = getAuthSession();

    try {
      const newAccessToken = await getRefreshPromise();
      const sessionAfterRefresh = getAuthSession();
      if (
        sessionAfterRefresh.status !== "authenticated" ||
        sessionAfterRefresh.generation !== sessionAtRequest.generation
      ) {
        throw new Error("Session changed while waiting for token refresh.");
      }

      if (originalRequest.headers) {
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
      }
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;
