import api from './api';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    email?: string;
    role: string;
  };
}

export const authApi = {
  // 登录
  login: (params: LoginParams) => {
    return api.post<LoginResult>( '/api/auth/login', params);
  },

  // 注册
  register: (data: { username: string; password: string; name: string; email?: string }) => {
    return api.post( '/api/auth/register', data);
  },

  // 获取当前用户
  getCurrentUser: () => {
    return api.get( '/api/auth/users/me');
  },

  // 获取用户列表
  getUsers: () => {
    return api.get( '/api/auth/users');
  },

  // 创建用户
  createUser: (data: { username: string; password: string; name: string; email?: string; role?: string }) => {
    return api.post( '/api/auth/users', data);
  },

  // 更新用户
  updateUser: (id: string, data: { name?: string; email?: string; role?: string; status?: string }) => {
    return api.put(`/auth/users/${id}`, data);
  },

  // 删除用户
  deleteUser: (id: string) => {
    return api.delete(`/api/auth/users/${id}`);
  },
};
