import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// 公开路由
router.post('/login', ...AuthController.login);
router.post('/register', ...AuthController.createUser); // 注册（无需认证）

// 需要认证的路由
router.get('/users', authenticate, ...AuthController.getUsers);
router.get('/users/me', authenticate, ...AuthController.getCurrentUser);
router.get('/users/:id', authenticate, ...AuthController.getUserById);
router.post('/users', authenticate, ...AuthController.createUser);
router.put('/users/:id', authenticate, ...AuthController.updateUser);
router.delete('/users/:id', authenticate, ...AuthController.deleteUser);

export default router;
