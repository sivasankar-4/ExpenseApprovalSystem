import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import { ROLES, type Role } from "@/constants/roles";
import { approvalChainService } from "@/services/approvalChain/approvalChainService";
import type { ApprovalChain, ApprovalChainRequest } from "@/types/approvalChain";

const emptyForm: ApprovalChainRequest = {
  minAmount: 0,
  maxAmount: 0,
  stepOrder: 1,
  approverRole: ROLES.MANAGER,
};

const errorMessage = (error: unknown, action: string) => {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) return "You do not have permission to manage approval chains.";
    if (error.response?.status === 409) return "This approval chain conflicts with an existing workflow rule.";
    if (error.response?.status === 400) return "The backend rejected these approval chain values.";
  }
  return `Unable to ${action} approval chain. Please try again.`;
};

const ApprovalChainsPage = () => {
  const [chains, setChains] = useState<ApprovalChain[]>([]);
  const [form, setForm] = useState<ApprovalChainRequest>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setChains(await approvalChainService.getApprovalChains());
    } catch (requestError) {
      setError(errorMessage(requestError, "load"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updateField = (field: keyof ApprovalChainRequest, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "approverRole" ? value as Role : Number(value),
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.minAmount < 0 || form.maxAmount <= form.minAmount || form.stepOrder < 1) {
      setError("Enter a non-negative minimum, a greater maximum, and a step order of at least 1.");
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      setFeedback(null);
      const saved = editingId === null
        ? await approvalChainService.createApprovalChain(form)
        : await approvalChainService.updateApprovalChain(editingId, form);
      setChains((current) => editingId === null
        ? [...current, saved]
        : current.map((chain) => chain.id === saved.id ? saved : chain));
      setForm(emptyForm);
      setEditingId(null);
      setFeedback("Approval chain saved successfully.");
    } catch (requestError) {
      setError(errorMessage(requestError, "save"));
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (chain: ApprovalChain) => {
    if (!window.confirm("Delete this approval chain? This action cannot be undone.")) return;
    try {
      setError(null);
      await approvalChainService.deleteApprovalChain(chain.id);
      setChains((current) => current.filter((item) => item.id !== chain.id));
      setFeedback("Approval chain deleted successfully.");
    } catch (requestError) {
      setError(errorMessage(requestError, "delete"));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F6F5]">Approval Chains</h1>
        <p className="mt-2 text-sm text-[#A1A1A4]">Configure backend-enforced approval rules for expense amounts.</p>
      </div>
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      {feedback && <p className="text-sm text-emerald-400" role="status">{feedback}</p>}
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-white/10 bg-[#14171F] p-6 sm:grid-cols-2 lg:grid-cols-5">
        {(["minAmount", "maxAmount", "stepOrder"] as const).map((field) => (
          <label key={field} className="text-sm text-[#A1A1A4]">
            {field === "stepOrder" ? "Step order" : field === "minAmount" ? "Minimum amount" : "Maximum amount"}
            <input type="number" min="0" step="0.01" value={form[field]} onChange={(event) => updateField(field, event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white" />
          </label>
        ))}
        <label className="text-sm text-[#A1A1A4]">Approver role
          <select value={form.approverRole} onChange={(event) => updateField("approverRole", event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#14171F] px-3 py-2 text-white">
            <option value={ROLES.MANAGER}>Manager</option>
            <option value={ROLES.FINANCE_ADMIN}>Finance Admin</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button disabled={isSaving} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{isSaving ? "Saving..." : editingId === null ? "Add chain" : "Save changes"}</button>
          {editingId !== null && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white">Cancel</button>}
        </div>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#14171F]">
        {isLoading ? <p className="p-6 text-sm text-[#A1A1A4]">Loading approval chains...</p> : chains.length === 0 ? <p className="p-6 text-sm text-[#A1A1A4]">No approval chains configured.</p> : (
          <table className="w-full text-left text-sm"><thead><tr className="border-b border-white/10 text-[#A1A1A4]"><th className="p-4">Minimum</th><th className="p-4">Maximum</th><th className="p-4">Step</th><th className="p-4">Approver</th><th className="p-4">Actions</th></tr></thead><tbody>
            {chains.map((chain) => <tr key={chain.id} className="border-b border-white/10 text-white last:border-0"><td className="p-4">{chain.minAmount}</td><td className="p-4">{chain.maxAmount}</td><td className="p-4">{chain.stepOrder}</td><td className="p-4">{chain.approverRole}</td><td className="flex gap-2 p-4"><button onClick={() => { setEditingId(chain.id); setForm({ minAmount: chain.minAmount, maxAmount: chain.maxAmount, stepOrder: chain.stepOrder, approverRole: chain.approverRole }); }} className="rounded-lg border border-white/20 px-3 py-1">Edit</button><button onClick={() => void remove(chain)} className="rounded-lg border border-red-500/30 px-3 py-1 text-red-400">Delete</button></td></tr>)}
          </tbody></table>
        )}
      </div>
    </div>
  );
};

export default ApprovalChainsPage;
