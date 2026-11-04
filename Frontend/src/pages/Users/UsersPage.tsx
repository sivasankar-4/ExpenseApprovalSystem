import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import { ROLES, type Role } from "@/constants/roles";
import { userService } from "@/services/user/userService";
import type { CreateUserRequest, User } from "@/types/user";

const roleLabels: Record<string, string> = {
  FINANCE_ADMIN: "Finance Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return "You do not have permission to access user administration.";
      case 404:
        return "User management endpoint was not found on the server.";
      case 500:
        return "The server could not process your user request. Please try again later.";
      default:
        return "Unable to load user list. Please try again.";
    }
  }
  return "Unable to load user list. Please try again.";
};

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<CreateUserRequest>({ name: "", email: "", password: "", role: ROLES.EMPLOYEE });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await userService.getUsers();
        if (isMounted) {
          setUsers(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const formError = (err: unknown, action: string) => {
    if (isAxiosError(err)) {
      if (err.response?.status === 403) return "You do not have permission to manage users.";
      if (err.response?.status === 409) return "A user with this email already exists.";
      if (err.response?.status === 400) return "The backend rejected the supplied user details.";
    }
    return `Unable to ${action} user. Please try again.`;
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setFeedback(null);
      const saved = editingUser
        ? await userService.updateUser(editingUser.id, { name: form.name, email: form.email, role: form.role })
        : await userService.createUser(form);
      setUsers((current) => editingUser
        ? current.map((user) => user.id === saved.id ? saved : user)
        : [...current, saved]);
      setEditingUser(null);
      setForm({ name: "", email: "", password: "", role: ROLES.EMPLOYEE });
      setFeedback("User saved successfully.");
    } catch (err) {
      setError(formError(err, "save"));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Delete ${user.name}? This action cannot be undone.`)) return;
    try {
      setError(null);
      await userService.deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setFeedback("User deleted successfully.");
    } catch (err) {
      setError(formError(err, "delete"));
    }
  };

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
          User Administration
        </h1>
        <p className="mt-2 text-sm text-[#A1A1A4]">
          Manage organization team members and access control roles.
        </p>
      </div>
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      {feedback && <p className="text-sm text-emerald-400" role="status">{feedback}</p>}
      <form onSubmit={saveUser} className="grid gap-4 rounded-2xl border border-white/10 bg-[#14171F] p-6 sm:grid-cols-2 lg:grid-cols-5">
        <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white" />
        <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white" />
        {!editingUser && <input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white" />}
        <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })} className="rounded-xl border border-white/15 bg-[#14171F] px-3 py-2 text-white">
          <option value={ROLES.EMPLOYEE}>Employee</option><option value={ROLES.MANAGER}>Manager</option><option value={ROLES.FINANCE_ADMIN}>Finance Admin</option>
        </select>
        <div className="flex gap-2"><button disabled={isSaving} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{isSaving ? "Saving..." : editingUser ? "Save changes" : "Create user"}</button>{editingUser && <button type="button" onClick={() => { setEditingUser(null); setForm({ name: "", email: "", password: "", role: ROLES.EMPLOYEE }); }} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white">Cancel</button>}</div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div
          className="flex min-h-64 items-center justify-center p-6 shadow-xl"
          style={darkSlateCardStyle}
        >
          <p className="text-sm text-[#A1A1A4]">Loading organization users...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div
          className="p-6 text-center shadow-xl"
          style={darkSlateCardStyle}
        >
          <p className="text-sm font-medium text-red-400" role="alert">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && users.length === 0 && (
        <div
          className="flex min-h-64 items-center justify-center p-6 shadow-xl"
          style={darkSlateCardStyle}
        >
          <div className="text-center">
            <h3 className="text-base font-bold text-[#F5F6F5]">No users found</h3>
            <p className="mt-1 text-sm text-[#A1A1A4]">
              There are currently no user accounts associated with your tenant organization.
            </p>
          </div>
        </div>
      )}

      {/* User Table & Details */}
      {!isLoading && !error && users.length > 0 && (
        <>
          <div
            className="overflow-hidden shadow-xl"
            style={darkSlateCardStyle}
          >
            <div className="border-b border-white/[0.08] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#F5F6F5]">
                  Team Members ({users.length})
                </h2>
                <p className="mt-1 text-sm text-[#A1A1A4]">
                  Users registered under your organization tenant.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.08] text-[#F5F6F5]">
                  <tr>
                    <th className="px-6 py-4 font-bold text-[#F5F6F5]">User / Name</th>
                    <th className="px-6 py-4 font-bold text-[#F5F6F5]">Email</th>
                    <th className="px-6 py-4 font-bold text-[#F5F6F5]">Role</th>
                    <th className="px-6 py-4 font-bold text-[#F5F6F5]">Tenant ID</th>
                    <th className="px-6 py-4 font-bold text-[#F5F6F5]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08]">
                  {users.map((user) => {
                    const displayName = user.name;
                    const roleKey = String(user.role).replace(/^ROLE_/, "").toUpperCase();
                    const roleLabel = roleLabels[roleKey] || roleKey;

                    return (
                      <tr key={user.id} className="border-b border-white/[0.08] last:border-0 hover:bg-white/[0.03] transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#F5F6F5]">{displayName}</td>
                        <td className="px-6 py-4 font-medium text-[#F5F6F5]">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-white/10 text-white border border-white/15 px-3 py-1 text-xs font-semibold">
                            {roleLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#F5F6F5]">{user.tenantid}</td>
                        <td className="flex gap-2 px-6 py-4">
                          <button type="button" onClick={() => { setEditingUser(user); setForm({ name: user.name, email: user.email, password: "", role: roleKey as Role }); }} className="rounded-lg border border-white/20 px-3 py-1 text-white">Edit</button>
                          <button type="button" onClick={() => void deleteUser(user)} className="rounded-lg border border-red-500/30 px-3 py-1 text-red-400">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className="p-4 text-xs rounded-r-xl"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              borderLeft: "3px solid #B13A29",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#A1A1A4",
            }}
          >
            <span className="font-bold text-[#F5F6F5]">Note: </span>
            Account activation and deactivation are not available because the current backend does not expose those operations.
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;