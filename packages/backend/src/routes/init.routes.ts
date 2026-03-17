import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

const router = Router();

// 初始化管理员账户（仅用于首次部署）
router.post('/init-admin', async (req, res) => {
  try {
    const { username = 'admin', password = 'admin123', name = '系统管理员' } = req.body;

    // 检查是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.json({ message: '管理员已存在' });
    }

    // 创建管理员
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        permissions: 'finance,otc,ptp,production,warehouse,reports',
        status: 'ACTIVE'
      }
    });

    res.json({ message: '管理员创建成功', username: admin.username });
  } catch (error: any) {
    console.error('初始化管理员失败:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
