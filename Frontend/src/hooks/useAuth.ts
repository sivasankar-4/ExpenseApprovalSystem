import { useSyncExternalStore, useEffect } from "react";
import { getAccessTokenRoles, getAuthUserClaims, isTokenValid } from "@/services/auth/authService";
import {
  getAuthSession,
  subscribeToAuthSession,
  clearAuthSession,
} from "@/services/auth/authSession";
import { ROLES } from "@/constants/roles";

/**
 * Hook to expose authentication state derived from the stored JWT.
 * The backend is the source of truth – we simply decode the token locally
 * to obtain role claims (no client‑side trust for security).
 */
export const useAuth = () => {
  const session = useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSession,
    getAuthSession,
  );

  const token = localStorage.getItem("accessToken");
  const hasValidToken = isTokenValid(token);
  const isAuthenticated = session.status === "authenticated" && hasValidToken;

  useEffect(() => {
    if (session.status === "authenticated" && !hasValidToken) {
      clearAuthSession();
    }
  }, [session.status, hasValidToken]);

  // Compute role set – fallback to empty array if token missing/invalid.
  const tokenRoles = isAuthenticated ? getAccessTokenRoles() : [];
  const claims = isAuthenticated ? getAuthUserClaims() : null;

  // Determine the highest‑privilege role present.
  const role = (() => {
    if (tokenRoles.includes(ROLES.FINANCE_ADMIN)) return ROLES.FINANCE_ADMIN;
    if (tokenRoles.includes(ROLES.MANAGER)) return ROLES.MANAGER;
    if (tokenRoles.includes(ROLES.EMPLOYEE)) return ROLES.EMPLOYEE;
    return undefined;
  })();

  const user = claims
    ? {
        email: claims.email || claims.sub || "User",
        name: claims.name || claims.fullName || (claims.email ? claims.email.split("@")[0] : "User"),
        role: role || "EMPLOYEE",
        tenantName: claims.tenantName,
        tenantId: claims.tenantId,
        issuedAt: claims.issuedAt,
        expiresAt: claims.expiresAt,
      }
    : null;

  return {
    isAuthenticated,
    authStatus: session.status,
    role,
    tokenRoles,
    user,
    claims,
  };
};
