import UserService from '../services/user.service.js';
import AuditLogService from '../services/auditLog.service.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export class UserController {
  static getUsers = asyncHandler(async (req, res) => {
    const search = req.query.search || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const data = await UserService.getUsersList({ search, page, limit });
    new ApiResponse(200, data, 'Users fetched successfully').send(res);
  });

  static getUserById = asyncHandler(async (req, res) => {
    const user = await UserService.getUserById(req.params.id);
    new ApiResponse(200, user, 'User details fetched successfully').send(res);
  });

  static createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const user = await UserService.createUser({ name, email, password, role });

    await AuditLogService.logAction(
      'ADMIN_CREATE_USER',
      req.user._id,
      `Admin created user account: ${user.email} (${user.role})`,
      req.ip
    );

    new ApiResponse(201, user, 'User created successfully').send(res);
  });

  static updateUser = asyncHandler(async (req, res) => {
    const user = await UserService.updateUser(req.params.id, req.body);

    await AuditLogService.logAction(
      'ADMIN_UPDATE_USER',
      req.user._id,
      `Admin updated user account: ${user.email}`,
      req.ip
    );

    new ApiResponse(200, user, 'User updated successfully').send(res);
  });

  static deleteUser = asyncHandler(async (req, res) => {
    const user = await UserService.getUserById(req.params.id);
    await UserService.deleteUser(req.params.id);

    await AuditLogService.logAction(
      'ADMIN_DELETE_USER',
      req.user._id,
      `Admin deleted user account: ${user.email}`,
      req.ip
    );

    new ApiResponse(200, null, 'User deleted successfully').send(res);
  });

  static changeUserRole = asyncHandler(async (req, res) => {
    const { userId, role } = req.body;
    const user = await UserService.changeUserRole(userId, role);

    await AuditLogService.logAction(
      'ADMIN_CHANGE_ROLE',
      req.user._id,
      `Admin changed user ${user.email} role to ${role}`,
      req.ip
    );

    new ApiResponse(200, user, 'User role updated successfully').send(res);
  });

  static updateOwnProfile = asyncHandler(async (req, res) => {
    const { name, password } = req.body;
    const user = await UserService.updateOwnProfile(req.user._id, { name, password });

    await AuditLogService.logAction(
      'USER_UPDATE_PROFILE',
      req.user._id,
      `User updated their profile`,
      req.ip
    );

    new ApiResponse(200, user, 'Profile updated successfully').send(res);
  });
}

export default UserController;
