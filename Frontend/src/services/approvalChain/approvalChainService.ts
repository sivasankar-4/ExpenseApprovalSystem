import api from "@/services/api/axios";
import type {
  ApprovalChain,
  ApprovalChainRequest,
} from "@/types/approvalChain";

export const approvalChainService = {
  async getApprovalChains(): Promise<ApprovalChain[]> {
    const response = await api.get<ApprovalChain[]>("/approvalChains");
    return response.data;
  },
  async createApprovalChain(data: ApprovalChainRequest): Promise<ApprovalChain> {
    const response = await api.post<ApprovalChain>("/approvalChains", data);
    return response.data;
  },
  async updateApprovalChain(
    id: number,
    data: ApprovalChainRequest,
  ): Promise<ApprovalChain> {
    const response = await api.put<ApprovalChain>(`/approvalChains/${id}`, data);
    return response.data;
  },
  async deleteApprovalChain(id: number): Promise<void> {
    await api.delete(`/approvalChains/${id}`);
  },
};
