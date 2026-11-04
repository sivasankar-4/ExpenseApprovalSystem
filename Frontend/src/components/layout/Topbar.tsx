import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";

/* ── Route → human-readable label map ─────────────────────────────── */
const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  expenses: "Expenses",
  approvals: "Approvals",
  reports: "Reports & Analytics",
  users: "User Administration",
  settings: "Settings",
};

const Topbar = () => {
  const location = useLocation();
  const [searchValue, setSearchValue] = useState("");

  // Derive active page from path segment
  const segment = location.pathname.split("/")[1] || "dashboard";
  const pageLabel = PAGE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);

  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between px-6 gap-4"
      style={{
        background: "rgba(13, 17, 23, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* ── Left: Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm min-w-0">
        <span className="text-[#A1A1A4] shrink-0">Workspace</span>
        <span className="text-[#A1A1A4] shrink-0">/</span>
        <span className="font-semibold text-[#F5F6F5] truncate">{pageLabel}</span>
      </nav>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search bar */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.10)",
          }}
        >
          <Search size={14} className="text-[#A1A1A4] shrink-0" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Search expenses, claims..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-transparent outline-none text-[#F5F6F5] placeholder:text-[#A1A1A4] w-52 text-sm"
          />
        </div>

      </div>
    </header>
  );
};

export default Topbar;
