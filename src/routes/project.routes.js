import { Router } from 'express';
import ProjectController from '../controllers/project.controller.js';
import { protect } from '../middleware/auth.protect.js';
import authorize from '../middleware/role.authorize.js';
import { validate } from '../middleware/validate.middleware.js';
import { projectUpload } from '../middleware/upload.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  projectIdParamSchema,
} from '../validations/project.validation.js';

const router = Router();

router.use(protect);

// Shared endpoints (Users can view their own projects, change status of assigned projects)
router.get('/', ProjectController.getProjects);
router.patch('/status', validate(updateProjectStatusSchema), ProjectController.updateProjectStatus);
router.get('/:id', validate(projectIdParamSchema), ProjectController.getProjectById);

// Admin-only CRUD operations
router.post(
  '/',
  authorize('Admin'),
  projectUpload,
  validate(createProjectSchema),
  ProjectController.createProject
);

router.put(
  '/:id',
  authorize('Admin'),
  projectUpload,
  validate(updateProjectSchema),
  ProjectController.updateProject
);

router.delete('/:id', authorize('Admin'), validate(projectIdParamSchema), ProjectController.deleteProject);

router.delete('/:id/attachments/:attachmentId', authorize('Admin'), ProjectController.removeProjectAttachment);

export default router;
