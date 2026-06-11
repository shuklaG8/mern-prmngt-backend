import { Router } from 'express';
import DashboardController from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.protect.js';
import { authorizeRole } from '../middleware/role.authorize.js';

const router = Router();

// Dashboard routes require authentication
router.use(protect);

// GET /api/dashboard and GET /api/dashboard/stats
router.get('/', DashboardController.getStats);
router.get('/stats', DashboardController.getStats);

// Activity logs (Admin and User)
router.get('/activity', authorizeRole('Admin', 'User'), DashboardController.getActivityLogs);

export default router;
