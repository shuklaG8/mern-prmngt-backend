import { Router } from 'express';
import UserController from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.protect.js';
import authorize from '../middleware/role.authorize.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
  userIdParamSchema,
} from '../validations/user.validation.js';

const router = Router();

// All user routes require authentication and Admin role
router.use(protect);
router.use(authorize('Admin'));

router.get('/', UserController.getUsers);
router.post('/', validate(createUserSchema), UserController.createUser);
router.patch('/change-role', validate(changeRoleSchema), UserController.changeUserRole);

router.get('/:id', validate(userIdParamSchema), UserController.getUserById);
router.put('/:id', validate(updateUserSchema), UserController.updateUser);
router.delete('/:id', validate(userIdParamSchema), UserController.deleteUser);

export default router;
