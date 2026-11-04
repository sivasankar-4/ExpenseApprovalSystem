import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Receipt,
  CheckCircle2,
  BarChart3,
  Users,
  GitBranch,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth/authService";
import { ROLES } from "@/constants/roles";

/* ── Reusable nav-link wrapper ─────────────────────────────────────── */
type NavItemProps = {
  to: string;
  icon: React.ElementType;
  label: string;
};

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-white/8 text-[#F5F6F5] border-l-2 border-[#B13A29] pl-[10px]"
          : "text-[#A1A1A4] hover:text-white hover:bg-white/5 border-l-2 border-transparent",
      ].join(" ")
    }
  >
    <Icon size={16} strokeWidth={1.8} className="shrink-0" />
    {label}
  </NavLink>
);

/* ── Category label ────────────────────────────────────────────────── */
const CategoryLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#A1A1A4] select-none">
    {children}
  </p>
);

/* ── Role display helper ───────────────────────────────────────────── */
const formatRole = (role: string | undefined) => {
  if (!role) return "Employee";
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
};

/* ── Sidebar ───────────────────────────────────────────────────────── */
const Sidebar = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const displayName = user?.name ?? "User";
  const displayRole = formatRole(user?.role ?? role);
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className="flex h-screen w-64 flex-col flex-shrink-0"
      style={{
        background: "rgba(13, 17, 23, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* ── Brand ── */}
      <div className="px-5 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "#B13A29" }}
          >
            E
          </div>
          <span className="text-sm font-semibold text-[#F5F6F5] leading-tight">
            Expense Approval<br />
            <span className="text-[10px] font-normal text-[#A1A1A4]">System</span>
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <CategoryLabel>General</CategoryLabel>
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/settings" icon={Settings} label="Settings" />

        <CategoryLabel>Expense Management</CategoryLabel>
        <NavItem to="/expenses" icon={Receipt} label="Expenses" />

        {(role === ROLES.MANAGER || role === ROLES.FINANCE_ADMIN) && (
          <>
            <CategoryLabel>Approvals</CategoryLabel>
            <NavItem to="/approvals" icon={CheckCircle2} label="Approvals" />
          </>
        )}

        {role === ROLES.FINANCE_ADMIN && (
          <>
            <CategoryLabel>Administration</CategoryLabel>
            <NavItem to="/reports" icon={BarChart3} label="Reports" />
            <NavItem to="/users" icon={Users} label="Users" />
            <NavItem to="/approval-chains" icon={GitBranch} label="Approval Chains" />
          </>
        )}
      </nav>

      {/* ── Footer: Profile chip + Logout ── */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        {/* User info chip */}
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-3"
          style={{ background: "rgba(255, 255, 255, 0.05)" }}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "rgba(177, 58, 41, 0.6)", border: "1px solid rgba(177, 58, 41, 0.4)" }}
          >
            {initials}
          </div>

          {/* Name + role badge */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#F5F6F5] truncate leading-tight">
              {displayName}
            </p>
            <span
              className="inline-flex mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#A1A1A4",
              }}
            >
              {displayRole}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-md cursor-pointer"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;