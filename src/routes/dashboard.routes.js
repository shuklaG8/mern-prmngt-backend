import { Router } from 'express';
import DashboardController from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.protect.js';
import authorize from '../middleware/role.authorize.js';

const router = Router();

router.use(protect);

router.get('/stats', DashboardController.getStats);
router.get('/activity', authorize('Admin'), DashboardController.getActivityLogs);

export default router;
