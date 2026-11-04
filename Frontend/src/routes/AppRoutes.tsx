import { Route, Routes } from "react-router-dom";
import LoginPage from "../pages/Login/LoginPage";
import SignUpPage from "../pages/SignUp/SignUpPage";
import AuthLayout from "../components/layout/AuthLayout";
import AppLayout from "../components/layout/AppLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import ExpensesPage from "../pages/Expenses/ExpensesPage";
import ExpenseDetailsPage from "../pages/Expenses/ExpenseDetailsPage";
import ApprovalsPage from "../pages/Approvals/ApprovalsPage";
import ReportsPage from "../pages/Reports/ReportsPage";
import SettingsPage from "../pages/Settings/SettingsPage";
import NotFoundPage from "../pages/NotFound/NotFoundPage";
import UsersPage from "../pages/Users/UsersPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";
import { ROLES } from "@/constants/roles";
import HomePage from "../pages/Home/HomePage";
import ApprovalChainsPage from "../pages/ApprovalChains/ApprovalChainsPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/expenses/:id" element={<ExpenseDetailsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Manager & Finance Admin Routes */}
          <Route
            element={
              <RoleProtectedRoute
                allowedRoles={[ROLES.MANAGER, ROLES.FINANCE_ADMIN]}
              />
            }
          >
            <Route path="/approvals" element={<ApprovalsPage />} />
          </Route>

          {/* Finance Admin Only Routes */}
          <Route
            element={
              <RoleProtectedRoute allowedRoles={[ROLES.FINANCE_ADMIN]} />
            }
          >
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/approval-chains" element={<ApprovalChainsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
