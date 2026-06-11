import { Router } from 'express';
import UserController from '../controllers/user.controller.js';
import { authorizeRole } from '../middleware/role.authorize.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
  userIdParamSchema,
} from '../validations/user.validation.js';

const router = Router();

// All user routes require Admin role
router.use(authorizeRole('Admin'));

router.get('/', UserController.getUsers);
router.post('/', validate(createUserSchema), UserController.createUser);
router.patch('/change-role', validate(changeRoleSchema), UserController.changeUserRole);

router.get('/:id', validate(userIdParamSchema), UserController.getUserById);
router.put('/:id', validate(updateUserSchema), UserController.updateUser);
router.delete('/:id', validate(userIdParamSchema), UserController.deleteUser);

export default router;
