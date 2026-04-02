import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

// 配置
const DB_PATH = path.join(process.cwd(), 'prisma/dev.db');
const BACKUP_DIR = path.join(process.cwd(), 'prisma/backups');
const MAX_BACKUPS = 5;
const BACKUP_PREFIX = 'dev-backup-';

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 获取备份列表
router.get('/backups', authenticate, authorize('ADMIN'), async (_req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith(BACKUP_PREFIX) && f.endsWith('.db'))
      .sort()
      .reverse();

    const backups = files.map(filename => {
      const filePath = path.join(BACKUP_DIR, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        sizeFormatted: (stats.size / 1024).toFixed(1) + ' KB',
        created: stats.mtime.toISOString()
      };
    });

    res.json({ success: true, data: backups });
  } catch (error: any) {
    console.error('获取备份列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建备份
router.post('/backups', authenticate, authorize('ADMIN'), async (_req, res) => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return res.status(400).json({ success: false, error: '数据库文件不存在' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${BACKUP_PREFIX}${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    // 复制数据库文件
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`备份创建成功: ${backupFilename}`);

    // 清理旧备份
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith(BACKUP_PREFIX) && f.endsWith('.db'))
      .sort();

    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(0, files.length - MAX_BACKUPS);
      toDelete.forEach(file => {
        fs.unlinkSync(path.join(BACKUP_DIR, file));
        console.log(`删除旧备份: ${file}`);
      });
    }

    const stats = fs.statSync(backupPath);
    res.json({
      success: true,
      data: {
        filename: backupFilename,
        size: stats.size,
        created: stats.mtime.toISOString()
      }
    });
  } catch (error: any) {
    console.error('创建备份失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 恢复备份
router.post('/backups/restore', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, error: '请指定要恢复的备份文件名' });
    }

    const backupPath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(400).json({ success: false, error: '备份文件不存在' });
    }

    // 先备份当前数据库
    const currentTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackup = `${BACKUP_PREFIX}before-restore-${currentTimestamp}.db`;
    fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, currentBackup));
    console.log(`当前数据库已备份: ${currentBackup}`);

    // 恢复备份
    fs.copyFileSync(backupPath, DB_PATH);
    console.log(`恢复成功: ${filename}`);

    res.json({ success: true, message: `已成功恢复备份: ${filename}` });
  } catch (error: any) {
    console.error('恢复备份失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除备份
router.delete('/backups/:filename', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(backupPath)) {
      return res.status(400).json({ success: false, error: '备份文件不存在' });
    }

    fs.unlinkSync(backupPath);
    res.json({ success: true, message: `删除成功: ${filename}` });
  } catch (error: any) {
    console.error('删除备份失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
