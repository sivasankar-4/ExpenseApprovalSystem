export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

interface AuthSession {
  status: AuthStatus;
  generation: number;
}

let session: AuthSession = { status: "initializing", generation: 0 };
const listeners = new Set<() => void>();

// Remove refresh tokens persisted by earlier frontend versions. New refresh
// tokens remain in an HttpOnly cookie and cannot be accessed by JavaScript.
localStorage.removeItem("refreshToken");

const notify = (): void => {
  listeners.forEach((listener) => listener());
};

export const getAuthSession = (): AuthSession => session;

export const subscribeToAuthSession = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setAuthenticated = (accessToken: string): void => {
  localStorage.setItem("accessToken", accessToken);
  session = { status: "authenticated", generation: session.generation };
  notify();
};

export const clearAuthSession = (): void => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  session = { status: "unauthenticated", generation: session.generation + 1 };
  notify();
};
