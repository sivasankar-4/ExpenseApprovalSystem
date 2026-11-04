import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AccessDeniedPage from "@/pages/AccessDenied/AccessDeniedPage";

type Props = {
  allowedRoles: string[]; // array of role strings, e.g., [ROLES.FINANCE_ADMIN]
};

const RoleProtectedRoute = ({ allowedRoles }: Props) => {
  const { isAuthenticated, authStatus, role } = useAuth();

  if (authStatus === "initializing") {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && allowedRoles.includes(role)) {
    return <Outlet />;
  }

  // UI‑only denial – backend will still enforce security.
  return <AccessDeniedPage />;
};

export default RoleProtectedRoute;
