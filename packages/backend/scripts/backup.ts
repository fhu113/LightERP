import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const DB_PATH = path.join(__dirname, '../prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../prisma/backups');
const MAX_BACKUPS = 5;
const BACKUP_PREFIX = 'dev-backup-';

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`创建备份目录: ${BACKUP_DIR}`);
}

// 获取所有备份文件
function getBackups(): string[] {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(BACKUP_PREFIX) && f.endsWith('.db'))
    .sort()
    .reverse(); // 最新在前
  return files;
}

// 创建备份
function createBackup(): string | null {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.error('数据库文件不存在:', DB_PATH);
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${BACKUP_PREFIX}${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    // 复制数据库文件
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`备份创建成功: ${backupFilename}`);

    // 清理旧备份
    cleanupOldBackups();

    return backupFilename;
  } catch (error) {
    console.error('备份创建失败:', error);
    return null;
  }
}

// 清理旧备份，保留最新的N个
function cleanupOldBackups(): void {
  const backups = getBackups();
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    toDelete.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      fs.unlinkSync(filePath);
      console.log(`删除旧备份: ${file}`);
    });
  }
}

// 列出所有备份
function listBackups(): Array<{ filename: string; size: number; created: string }> {
  return getBackups().map(filename => {
    const filePath = path.join(BACKUP_DIR, filename);
    const stats = fs.statSync(filePath);
    return {
      filename,
      size: stats.size,
      created: stats.mtime.toISOString()
    };
  });
}

// 恢复指定备份
function restoreBackup(filename: string): boolean {
  try {
    const backupPath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(backupPath)) {
      console.error('备份文件不存在:', filename);
      return false;
    }

    // 先备份当前数据库
    const currentTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackup = `${BACKUP_PREFIX}before-restore-${currentTimestamp}.db`;
    fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, currentBackup));
    console.log(`当前数据库已备份: ${currentBackup}`);

    // 恢复备份
    fs.copyFileSync(backupPath, DB_PATH);
    console.log(`恢复成功: ${filename}`);
    return true;
  } catch (error) {
    console.error('恢复失败:', error);
    return false;
  }
}

// 命令行操作
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'backup':
    createBackup();
    break;
  case 'list':
    console.log('可用备份:');
    listBackups().forEach(b => {
      console.log(`  ${b.filename} - ${(b.size / 1024).toFixed(1)}KB - ${b.created}`);
    });
    break;
  case 'restore':
    const restoreFile = args[1];
    if (restoreFile) {
      restoreBackup(restoreFile);
    } else {
      console.error('请指定要恢复的备份文件名');
    }
    break;
  case 'restore-latest':
    const latest = getBackups()[0];
    if (latest) {
      restoreBackup(latest);
    } else {
      console.error('没有可用的备份');
    }
    break;
  default:
    console.log(`
数据库备份工具

用法:
  node scripts/backup.js backup         - 创建新备份
  node scripts/backup.js list           - 列出所有备份
  node scripts/backup.js restore <file> - 恢复指定备份
  node scripts/backup.js restore-latest - 恢复最新备份
`);
}
