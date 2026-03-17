// 用户类型定义

export type UserRole = 'ADMIN' | 'KEY_USER' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

// 一般用户权限
export type UserPermission = 'finance' | 'otc' | 'ptp' | 'warehouse' | 'reports';

export interface UserResponse {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  permissions: string[]; // 逗号分隔的权限列表
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  permissions?: string[]; // 逗号分隔的权限列表
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

// JWT payload
export interface JwtPayload {
  userId: string;
  role: string;
  permissions: string[];
}
