import api from './api';

export interface Backup {
  filename: string;
  size: number;
  sizeFormatted: string;
  created: string;
}

export const backupApi = {
  // 获取备份列表
  getBackups: (): Promise<Backup[]> => {
    return api.get('/api/backups');
  },

  // 创建备份
  createBackup: (): Promise<Backup> => {
    return api.post('/api/backups', {});
  },

  // 恢复备份
  restoreBackup: (filename: string): Promise<void> => {
    return api.post('/api/backups/restore', { filename });
  },

  // 删除备份
  deleteBackup: (filename: string): Promise<void> => {
    return api.delete(`/api/backups/${filename}`);
  },
};
