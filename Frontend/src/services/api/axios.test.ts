import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
} from "axios";
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

const response = (config: Parameters<AxiosAdapter>[0], status: number, data: unknown): AxiosResponse => ({
  data,
  status,
  statusText: status === 200 ? "OK" : "No Content",
  headers: {},
  config,
});

const unauthorized = (config: Parameters<AxiosAdapter>[0]): AxiosError =>
  new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, response(config, 401, null));

const loadClient = async () => {
  vi.resetModules();
  globalThis.localStorage = new MemoryStorage();
  globalThis.window = { location: { pathname: "/expenses", href: "" } } as unknown as Window & typeof globalThis;
  const auth = await import("@/services/auth/authSession");
  const client = await import("@/services/api/axios");
  auth.setAuthenticated("old-token");
  return { auth, client };
};

const loadInitializingClient = async () => {
  vi.resetModules();
  globalThis.localStorage = new MemoryStorage();
  globalThis.window = { location: { pathname: "/", href: "" } } as unknown as Window & typeof globalThis;
  const auth = await import("@/services/auth/authSession");
  const client = await import("@/services/api/axios");
  return { auth, client };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Axios access-token refresh", () => {
  it("sends a valid stored access token without refreshing", async () => {
    const { client } = await loadClient();
    const adapter: AxiosAdapter = async (config) => {
      expect(config.headers.Authorization).toBe("Bearer old-token");
      return response(config, 200, { ok: true });
    };
    client.default.defaults.adapter = adapter;

    await expect(client.default.get("/api/expenses")).resolves.toMatchObject({ status: 200 });
  });

  it("does not redirect a public route when startup refresh has no session", async () => {
    const { auth, client } = await loadInitializingClient();
    vi.spyOn(axios, "post").mockRejectedValue(new Error("No refresh cookie"));

    await expect(client.refreshAccessToken()).rejects.toThrow("No refresh cookie");
    expect(auth.getAuthSession().status).toBe("initializing");
    expect(window.location.href).toBe("");
  });

  it.each(["/api/auth/login", "/api/auth/signup", "/api/auth/logout"])(
    "does not attach a stale bearer token to %s",
    async (url) => {
      const { client } = await loadClient();
      client.default.defaults.adapter = async (config) => {
        expect(config.headers.Authorization).toBeUndefined();
        return response(config, 200, { ok: true });
      };

      await expect(client.default.post(url)).resolves.toMatchObject({ status: 200 });
    },
  );

  it("refreshes an expired access token and retries once", async () => {
    const { auth, client } = await loadClient();
    const refresh = vi.spyOn(axios, "post").mockResolvedValue(response({} as never, 200, { accessToken: "new-token" }));
    let attempts = 0;
    client.default.defaults.adapter = async (config) => {
      attempts += 1;
      if (attempts === 1) throw unauthorized(config);
      expect(config.headers.Authorization).toBe("Bearer new-token");
      return response(config, 200, { ok: true });
    };

    await expect(client.default.get("/api/expenses")).resolves.toMatchObject({ status: 200 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(auth.getAuthSession().status).toBe("authenticated");
    expect(localStorage.getItem("accessToken")).toBe("new-token");
  });

  it("sends no refresh-token body and rejects a failed refresh", async () => {
    const { auth, client } = await loadClient();
    const refresh = vi.spyOn(axios, "post").mockRejectedValue(unauthorized({} as never));
    client.default.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    await expect(client.default.get("/api/expenses")).rejects.toBeDefined();
    expect(refresh).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/refresh"),
      undefined,
      expect.objectContaining({ withCredentials: true }),
    );
    expect(auth.getAuthSession().status).toBe("unauthenticated");
  });

  it.each(["missing refresh cookie", "revoked refresh token", "refresh endpoint returns 401"])(
    "logs out cleanly when %s",
    async () => {
      const { auth, client } = await loadClient();
      vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh failed"));
      client.default.defaults.adapter = async (config) => {
        throw unauthorized(config);
      };

      await expect(client.default.get("/api/expenses")).rejects.toBeDefined();
      expect(auth.getAuthSession().status).toBe("unauthenticated");
      expect(localStorage.getItem("accessToken")).toBeNull();
    },
  );

  it("shares one refresh request across simultaneous 401 responses", async () => {
    const { client } = await loadClient();
    let resolveRefresh!: (value: AxiosResponse) => void;
    const refresh = vi.spyOn(axios, "post").mockImplementation(
      () => new Promise((resolve) => { resolveRefresh = resolve; }),
    );
    const attempts = new Map<string, number>();
    client.default.defaults.adapter = async (config) => {
      const url = String(config.url);
      const attempt = (attempts.get(url) ?? 0) + 1;
      attempts.set(url, attempt);
      if (attempt === 1) throw unauthorized(config);
      return response(config, 200, { ok: true });
    };

    const requests = [1, 2, 3].map((id) => client.default.get(`/api/expenses/${id}`));
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(refresh).toHaveBeenCalledTimes(1);
    resolveRefresh(response({} as never, 200, { accessToken: "new-token" }));
    await expect(Promise.all(requests)).resolves.toHaveLength(3);
  });

  it("does not restore authentication when logout happens during refresh", async () => {
    const { auth, client } = await loadClient();
    let resolveRefresh!: (value: AxiosResponse) => void;
    vi.spyOn(axios, "post").mockImplementation(
      () => new Promise((resolve) => { resolveRefresh = resolve; }),
    );
    client.default.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    const request = client.default.get("/api/expenses");
    await vi.waitFor(() => expect(resolveRefresh).toBeTypeOf("function"));
    await auth.clearAuthSession();
    resolveRefresh(response({} as never, 200, { accessToken: "late-token" }));

    await expect(request).rejects.toBeDefined();
    expect(auth.getAuthSession().status).toBe("unauthenticated");
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("does not refresh a request more than once", async () => {
    const { client } = await loadClient();
    const refresh = vi.spyOn(axios, "post").mockResolvedValue(response({} as never, 200, { accessToken: "new-token" }));
    let attempts = 0;
    client.default.defaults.adapter = async (config) => {
      attempts += 1;
      throw unauthorized(config);
    };

    await expect(client.default.get("/api/expenses")).rejects.toBeDefined();
    expect(attempts).toBe(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not reuse a stale default Authorization header after logout", async () => {
    const { auth, client } = await loadClient();
    client.default.defaults.adapter = async (config) => response(config, 200, { ok: true });
    await client.default.get("/api/expenses");
    await auth.clearAuthSession();

    client.default.defaults.adapter = async (config) => {
      expect(config.headers.Authorization).toBeUndefined();
      return response(config, 200, { ok: true });
    };
    await client.default.get("/api/public");
  });
});