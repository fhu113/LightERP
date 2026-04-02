import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只能上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
});

// 上传Logo
router.post('/logo', upload.single('file') as any, (req, res) => {
  try {
    const file = req.file as any;
    if (!file) {
      res.status(400).json({ success: false, error: '请选择要上传的文件' });
      return;
    }

    // 返回文件的访问URL
    const fileUrl = `/uploads/${file.filename}`;

    return res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      }
    });
  } catch (error: any) {
    console.error('上传文件失败:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
