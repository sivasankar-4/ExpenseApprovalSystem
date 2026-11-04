import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const roleLabels: Record<string, string> = {
  FINANCE_ADMIN: "Finance Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <div
        className="flex min-h-64 items-center justify-center p-6 text-center shadow-xl"
        style={{
          background: "rgba(20, 18, 17, 0.7)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
        }}
      >
        <div>
          <h3 className="text-base font-semibold text-[#F5F6F5]">
            Session Required
          </h3>
          <p className="mt-1 text-sm text-[#A1A1A4]">
            Please sign in to view your account and security settings.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const roleKey = role ? String(role).replace(/^ROLE_/, "").toUpperCase() : "EMPLOYEE";
  const roleLabel = roleLabels[roleKey] || roleKey;

  const displayName = user?.name || user?.email?.split("@")[0] || "Authenticated User";
  const displayEmail = user?.email || "N/A";
  const tenantName = user?.tenantName || "Organization Workspace";
  const tenantId = user?.tenantId ? `Tenant #${user.tenantId}` : null;

  const darkSlateCardStyle = {
    background: "#14171F",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#F5F6F5]">
          Settings
        </h1>
        <p className="mt-2 text-sm text-[#A1A1A4]">
          View your account profile, organization tenant scoping, and active session details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Information Card */}
        <div className="p-6 shadow-xl overflow-hidden" style={darkSlateCardStyle}>
          <div className="border-b border-white/[0.08] pb-4">
            <h2 className="text-lg font-bold text-[#F5F6F5]">Account Information</h2>
            <p className="mt-1 text-xs text-[#A1A1A4]">
              Personal identity details and role permissions.
            </p>
          </div>

          <dl className="mt-4 divide-y divide-white/[0.08] text-sm">
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-medium text-[#A1A1A4]">Full Name</dt>
              <dd className="mt-1 font-semibold text-[#F5F6F5] sm:col-span-2 sm:mt-0">
                {displayName}
              </dd>
            </div>

            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-medium text-[#A1A1A4]">Email Address</dt>
              <dd className="mt-1 font-semibold text-[#F5F6F5] sm:col-span-2 sm:mt-0">
                {displayEmail}
              </dd>
            </div>

            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-medium text-[#A1A1A4]">Assigned Role</dt>
              <dd className="mt-1 sm:col-span-2 sm:mt-0">
                <span className="inline-flex rounded-full bg-white/10 text-white border border-white/15 px-3 py-1 text-xs font-semibold">
                  {roleLabel}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Organization Section */}
        <div className="p-6 shadow-xl overflow-hidden" style={darkSlateCardStyle}>
          <div className="border-b border-white/[0.08] pb-4">
            <h2 className="text-lg font-bold text-[#F5F6F5]">Organization & Tenant</h2>
            <p className="mt-1 text-xs text-[#A1A1A4]">
              Current organization scoping and tenant isolation status.
            </p>
          </div>

          <dl className="mt-4 divide-y divide-white/[0.08] text-sm">
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-medium text-[#A1A1A4]">Organization</dt>
              <dd className="mt-1 font-semibold text-[#F5F6F5] sm:col-span-2 sm:mt-0">
                {tenantName}
              </dd>
            </div>

            {tenantId && (
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-[#A1A1A4]">Tenant Identifier</dt>
                <dd className="mt-1 font-semibold text-[#F5F6F5] sm:col-span-2 sm:mt-0">
                  {tenantId}
                </dd>
              </div>
            )}

            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-medium text-[#A1A1A4]">Tenant Isolation</dt>
              <dd className="mt-1 sm:col-span-2 sm:mt-0">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white border border-white/15 px-3 py-1 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  Server Enforced & Isolated
                </span>
              </dd>
            </div>
          </dl>

          {/* Tenant Scoping Notice Box */}
          <div
            className="mt-5 p-4 text-xs rounded-r-xl"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              borderLeft: "3px solid #B13A29",
              color: "#A1A1A4",
            }}
          >
            <span className="font-bold text-[#F5F6F5]">Notice: </span>
            Tenant scoping is enforced by server-side authorization headers. Organization assignments cannot be modified locally.
          </div>
        </div>

        {/* Security & Session Card */}
        <div className="p-6 shadow-xl overflow-hidden lg:col-span-2" style={darkSlateCardStyle}>
          <div className="border-b border-white/[0.08] pb-4">
            <h2 className="text-lg font-bold text-[#F5F6F5]">Security & Session</h2>
            <p className="mt-1 text-xs text-[#A1A1A4]">
              Active authentication session state and security actions.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <span className="text-xs font-medium text-[#A1A1A4]">Session Status</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="text-sm font-semibold text-[#F5F6F5]">Active Session</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-[#A1A1A4]">Authentication Method</span>
              <p className="mt-1 text-sm font-semibold text-[#F5F6F5]">JWT Bearer Token</p>
            </div>

            {user?.issuedAt && (
              <div>
                <span className="text-xs font-medium text-[#A1A1A4]">Session Issued At</span>
                <p className="mt-1 text-sm font-semibold text-[#F5F6F5]">{user.issuedAt}</p>
              </div>
            )}

            {user?.expiresAt && (
              <div>
                <span className="text-xs font-medium text-[#A1A1A4]">Session Expiration</span>
                <p className="mt-1 text-sm font-semibold text-[#F5F6F5]">{user.expiresAt}</p>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-white/[0.08] pt-6">
            <p className="text-xs text-[#A1A1A4]">
              For security, authentication tokens are managed securely in storage and never exposed in full text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;