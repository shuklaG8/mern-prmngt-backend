import { Router } from 'express';
import ProjectController from '../controllers/project.controller.js';
import { protect } from '../middleware/auth.protect.js';
import { authorizeRole } from '../middleware/role.authorize.js';
import { validate } from '../middleware/validate.middleware.js';
import { projectUpload } from '../middleware/upload.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  updateProjectStatusParamSchema,
  projectIdParamSchema,
} from '../validations/project.validation.js';

const router = Router();

// Standard authenticated routes
router.use(protect);

// Shared endpoints (Users can view their own projects)
router.get('/', ProjectController.getProjects);
router.get('/:id', validate(projectIdParamSchema), ProjectController.getProjectById);

// Status updates: Support both body-based and param-based routes
router.patch('/status', validate(updateProjectStatusSchema), ProjectController.updateProjectStatus);

// PATCH /api/projects/:id/status (Admin + User role allowed)
router.patch(
  '/:id/status',
  authorizeRole('Admin', 'User'),
  validate(updateProjectStatusParamSchema),
  ProjectController.updateProjectStatus
);

// Admin-only CRUD operations
router.post(
  '/',
  authorizeRole('Admin'),
  projectUpload,
  validate(createProjectSchema),
  ProjectController.createProject
);

router.put(
  '/:id',
  authorizeRole('Admin'),
  projectUpload,
  validate(updateProjectSchema),
  ProjectController.updateProject
);

router.delete('/:id', authorizeRole('Admin'), validate(projectIdParamSchema), ProjectController.deleteProject);

router.delete('/:id/attachments/:attachmentId', authorizeRole('Admin'), ProjectController.removeProjectAttachment);

export default router;
