import api, { cancelTokenRefresh } from "@/services/api/axios";
import {
  clearAuthSession,
  getAuthSession,
  setAuthenticated,
} from "@/services/auth/authSession";

import type {
  LoginFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from "@/schemas/auth.schema";
import { loginResponseSchema } from "@/schemas/auth.schema";
import type { VerifyOtpFormData } from "@/schemas/auth.schema";

import type {
  LoginResponse,
  ResetTokenResponse,
  SignupRequest,
  VerifyOtpRequest,
} from "@/types/auth";

export const login = async (
  credentials: LoginFormData
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    "/api/auth/login",
    credentials
  );
  const loginResponse = loginResponseSchema.parse(response.data);

  setAuthenticated(loginResponse.accessToken);
  return loginResponse;
};

export const signup = async (credentials: SignupRequest): Promise<void> => {
  const response = await api.post<void>("/api/auth/signup", credentials);

  if (response.status !== 201) {
    throw new Error("Unexpected signup response status");
  }
};

/**
 * Requests a password reset token be sent via OTP to the provided email.
 * Returns a neutral message regardless of whether the email exists — the backend
 * already enforces this so we never expose account enumeration.
 */
export const forgotPassword = async (
  data: ForgotPasswordFormData
): Promise<string> => {
  const response = await api.post<string>(
    "/api/auth/forgot-password",
    data
  );
  return response.data;
};

export const verifyOtp = async (
  data: VerifyOtpFormData
): Promise<ResetTokenResponse> => {
  const response = await api.post<ResetTokenResponse>(
    "/api/auth/verify-otp",
    data satisfies VerifyOtpRequest,
  );
  return response.data;
};

/**
 * Resets the user's password using the reset token returned by OTP verification.
 * Throws on invalid/expired tokens (backend returns 400).
 */
export const resetPassword = async (
  data: ResetPasswordFormData
): Promise<void> => {
  await api.post("/api/auth/reset-password", data);
};



export const logout = async (): Promise<void> => {
  const accessToken = localStorage.getItem("accessToken");

  // Invalidate an in-flight refresh before clearing the session.
  cancelTokenRefresh();
  clearAuthSession();

  // Always call the endpoint so the HttpOnly refresh cookie is revoked and
  // cleared even when the access token is expired or already missing.
  const logoutPromise = api.post("/api/auth/logout", undefined, {
    ...(accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {}),
  });

  try {
    await logoutPromise;
  } catch (error) {
    console.error("Backend logout request failed:", error);
  }
};

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = parts[1];
    if (!payload) return false;

    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    ) as Record<string, unknown>;

    if (!decoded || typeof decoded !== "object") return false;

    if (typeof decoded.exp === "number") {
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

const approvalRoles = new Set(["MANAGER", "FINANCE_ADMIN"]);

export const getAccessTokenRoles = (): string[] => {
  if (getAuthSession().status !== "authenticated") {
    return [];
  }

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    return [];
  }

  try {
    const payload = accessToken.split(".")[1];

    if (!payload) {
      return [];
    }

    const claims: unknown = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );

    if (!claims || typeof claims !== "object") {
      return [];
    }

    const roleClaims = [
      (claims as Record<string, unknown>).role,
      (claims as Record<string, unknown>).roles,
      (claims as Record<string, unknown>).authority,
      (claims as Record<string, unknown>).authorities,
    ];

    return roleClaims.flatMap((roleClaim) => {
      if (Array.isArray(roleClaim)) {
        return roleClaim.filter((role): role is string => typeof role === "string");
      }

      return typeof roleClaim === "string" ? roleClaim.split(/[\s,]+/) : [];
    });
  } catch {
    return [];
  }
};

export const canApproveExpenses = (): boolean =>
  getAccessTokenRoles().some((role) =>
    approvalRoles.has(role.replace(/^ROLE_/, "").toUpperCase()),
  );

export interface UserClaims {
  email?: string;
  sub?: string;
  name?: string;
  fullName?: string;
  tenantName?: string;
  tenantId?: string | number;
  roles: string[];
  issuedAt?: string;
  expiresAt?: string;
}

export const getAuthUserClaims = (): UserClaims | null => {
  if (getAuthSession().status !== "authenticated") return null;

  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return null;

  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;

    const claims = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    ) as Record<string, unknown>;

    if (!claims || typeof claims !== "object") return null;

    const roles = getAccessTokenRoles();
    const email =
      typeof claims.sub === "string" && claims.sub.includes("@")
        ? claims.sub
        : typeof claims.email === "string"
        ? claims.email
        : undefined;

    const rawName =
      typeof claims.name === "string"
        ? claims.name
        : typeof claims.fullName === "string"
        ? claims.fullName
        : email
        ? email.split("@")[0]
        : undefined;

    const tenantName =
      typeof claims.tenantName === "string"
        ? claims.tenantName
        : typeof claims.tenant === "string"
        ? claims.tenant
        : typeof claims.organization === "string"
        ? claims.organization
        : undefined;

    const tenantId =
      typeof claims.tenantId === "string" || typeof claims.tenantId === "number"
        ? claims.tenantId
        : undefined;

    const formatDateVal = (timestamp: unknown): string | undefined => {
      if (typeof timestamp === "number") {
        return new Date(timestamp * 1000).toLocaleString();
      }
      return undefined;
    };

    return {
      email,
      sub: typeof claims.sub === "string" ? claims.sub : undefined,
      name: rawName,
      fullName: rawName,
      tenantName,
      tenantId,
      roles,
      issuedAt: formatDateVal(claims.iat),
      expiresAt: formatDateVal(claims.exp),
    };
  } catch {
    return null;
  }
};
