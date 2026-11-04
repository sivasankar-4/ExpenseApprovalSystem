import type { Role } from "@/constants/roles";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role | string;
  tenantid: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: Role;
}
