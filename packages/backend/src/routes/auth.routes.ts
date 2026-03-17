import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// 公开路由
router.post('/login', ...AuthController.login);
router.post('/register', ...AuthController.createUser); // 注册（无需认证）

// 需要认证的路由
router.get('/users/me', authenticate, ...AuthController.getCurrentUser);

// 用户管理路由 - 只有管理员可以访问
router.get('/users', authenticate, authorize('ADMIN'), ...AuthController.getUsers);
router.get('/users/:id', authenticate, authorize('ADMIN'), ...AuthController.getUserById);
router.post('/users', authenticate, authorize('ADMIN'), ...AuthController.createUser);
router.put('/users/:id', authenticate, authorize('ADMIN'), ...AuthController.updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN'), ...AuthController.deleteUser);

export default router;
