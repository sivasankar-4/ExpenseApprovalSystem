import type { Role } from "@/constants/roles";

export interface ApprovalChain {
  id: number;
  minAmount: number;
  maxAmount: number;
  stepOrder: number;
  approverRole: Role;
}

export type ApprovalChainRequest = Omit<ApprovalChain, "id">;
