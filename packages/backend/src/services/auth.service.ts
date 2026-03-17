import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  UserResponse,
  CreateUserDto,
  LoginDto,
  LoginResponse,
  JwtPayload,
} from '../types/auth';
import { config } from '../config';

// JWT密钥
const JWT_SECRET = config.security.jwtSecret || 'light-erp-secret-key';
const JWT_EXPIRES_IN = '24h';

// 加密密码
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 验证密码
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 生成JWT令牌
function generateToken(userId: string, role: string, permissions: string[] = []): string {
  return jwt.sign({ userId, role, permissions }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// 用户列表
export async function getUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: UserResponse[]; pagination: any }> {
  const { page = 1, limit = 10, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { username: { contains: search } },
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const data = users.map((user): UserResponse => ({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as any,
    permissions: user.permissions ? user.permissions.split(',').filter(Boolean) : [],
    status: user.status as any,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// 获取用户详情
export async function getUserById(id: string): Promise<UserResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      permissions: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as any,
    permissions: user.permissions ? user.permissions.split(',').filter(Boolean) : [],
    status: user.status as any,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// 创建用户
export async function createUser(data: CreateUserDto): Promise<UserResponse> {
  // 检查用户名是否已存在
  const existingUser = await prisma.user.findUnique({
    where: { username: data.username },
  });

  if (existingUser) {
    throw new AppError('用户名已存在', 400);
  }

  // 加密密码
  const hashedPassword = await hashPassword(data.password);

  // 处理权限 - 支持数组和字符串
  let permissionsStr: string | null = null;
  if (data.permissions) {
    if (Array.isArray(data.permissions)) {
      permissionsStr = (data.permissions as string[]).join(',');
    } else {
      permissionsStr = data.permissions as string;
    }
  }

  const user = await prisma.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role || 'USER',
      permissions: permissionsStr,
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      permissions: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as any,
    permissions: user.permissions ? user.permissions.split(',').filter(Boolean) : [],
    status: user.status as any,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// 更新用户
export async function updateUser(
  id: string,
  data: Partial<CreateUserDto>
): Promise<UserResponse> {
  const updateData: any = { ...data };

  // 如果更新密码，需要加密
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  // 处理权限 - 支持数组和字符串
  if (data.permissions) {
    if (Array.isArray(data.permissions)) {
      updateData.permissions = (data.permissions as string[]).join(',');
    } else {
      updateData.permissions = data.permissions as string;
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      permissions: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as any,
    permissions: user.permissions ? user.permissions.split(',').filter(Boolean) : [],
    status: user.status as any,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// 删除用户
export async function deleteUser(id: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  await prisma.user.delete({
    where: { id },
  });
}

// 登录
export async function login(data: LoginDto): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { username: data.username },
  });

  if (!user) {
    throw new AppError('用户名或密码错误', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('用户已被禁用', 401);
  }

  const isPasswordValid = await verifyPassword(data.password, user.password);

  if (!isPasswordValid) {
    throw new AppError('用户名或密码错误', 401);
  }

  const permissions = user.permissions ? user.permissions.split(',').filter(Boolean) : [];
  const token = generateToken(user.id, user.role, permissions);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as any,
      permissions,
      status: user.status as any,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  };
}

// 验证Token
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    throw new AppError('无效的令牌', 401);
  }
}
