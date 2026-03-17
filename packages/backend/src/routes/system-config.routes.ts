import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// 获取所有系统配置 - 需要认证
router.get('/', authenticate, async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取配置失败' });
  }
});

// 获取单个配置 - 需要认证
router.get('/:key', authenticate, async (req, res) => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { configKey: req.params.key },
    });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取配置失败' });
  }
});

// 设置配置 - 需要管理员或KEY_USER权限
router.post('/', authenticate, authorize('ADMIN', 'KEY_USER'), async (req, res) => {
  try {
    const { configKey, configValue, description } = req.body;
    if (!configKey || !configValue) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }
    const config = await prisma.systemConfig.upsert({
      where: { configKey },
      update: { configValue, description },
      create: { configKey, configValue, description },
    });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: '保存配置失败' });
  }
});

// 删除配置 - 需要管理员或KEY_USER权限
router.delete('/:key', authenticate, authorize('ADMIN', 'KEY_USER'), async (req, res) => {
  try {
    await prisma.systemConfig.delete({
      where: { configKey: req.params.key },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除配置失败' });
  }
});

export default router;
