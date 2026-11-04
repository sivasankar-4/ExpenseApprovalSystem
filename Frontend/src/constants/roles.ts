export const ROLES = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  FINANCE_ADMIN: "FINANCE_ADMIN",
} as const;

export type Role = keyof typeof ROLES;
