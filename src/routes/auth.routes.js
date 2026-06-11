import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
import UserController from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';
import { protect } from '../middleware/auth.protect.js';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);

// Protected routes
router.use(protect);
router.get('/profile', AuthController.getProfile);
router.post('/logout', AuthController.logout);
router.put('/profile', UserController.updateOwnProfile); // Map profile updates

export default router;
