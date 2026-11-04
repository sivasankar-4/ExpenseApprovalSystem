import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ProtectedRoute = () => {
    const { isAuthenticated, authStatus } = useAuth();

    if (authStatus === "initializing") {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>
    }

    return <Outlet />
};

export default ProtectedRoute;
