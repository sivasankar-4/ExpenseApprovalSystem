import type { AxiosAdapter } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const loadAuthService = async () => {
  vi.resetModules();
  globalThis.localStorage = new MemoryStorage();
  globalThis.window = { location: { pathname: "/login", href: "" } } as unknown as Window & typeof globalThis;
  const authSession = await import("@/services/auth/authSession");
  const api = await import("@/services/api/axios");
  const authService = await import("@/services/auth/authService");
  return { authSession, authService, api: api.default };
};

const response = (config: Parameters<AxiosAdapter>[0], status: number, data: unknown) => ({
  data,
  status,
  statusText: status === 201 ? "Created" : "OK",
  headers: {},
  config,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("authentication service boundaries", () => {
  it("stores only a runtime-validated access token after a valid login response", async () => {
    const { authSession, authService, api } = await loadAuthService();
    api.defaults.adapter = async (config) =>
      response(config, 200, { accessToken: "access-token", tokenType: "Bearer" });

    await expect(authService.login({ email: "user@example.com", password: "password" }))
      .resolves.toMatchObject({ accessToken: "access-token", tokenType: "Bearer" });
    expect(localStorage.getItem("accessToken")).toBe("access-token");
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(authSession.getAuthSession().status).toBe("authenticated");
  });

  it("does not authenticate or persist a malformed login response", async () => {
    const { authSession, authService, api } = await loadAuthService();
    api.defaults.adapter = async (config) => response(config, 200, { tokenType: "Bearer" });

    await expect(authService.login({ email: "user@example.com", password: "password" }))
      .rejects.toThrow();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(authSession.getAuthSession().status).toBe("initializing");
  });

  it("keeps signup token-free and accepts the expected created response", async () => {
    const { authSession, authService, api } = await loadAuthService();
    api.defaults.adapter = async (config) => response(config, 201, undefined);

    await expect(authService.signup({
      name: "User",
      email: "user@example.com",
      password: "password",
      companyName: "Example",
    })).resolves.toBeUndefined();
    expect(authSession.getAuthSession().status).toBe("initializing");
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("calls cookie-based logout even when no access token is present", async () => {
    const { authService, api } = await loadAuthService();
    let logoutCalls = 0;
    api.defaults.adapter = async (config) => {
      logoutCalls += 1;
      expect(config.url).toBe("/api/auth/logout");
      expect(config.headers.Authorization).toBeUndefined();
      return response(config, 204, undefined);
    };

    await expect(authService.logout()).resolves.toBeUndefined();
    expect(logoutCalls).toBe(1);
  });
});