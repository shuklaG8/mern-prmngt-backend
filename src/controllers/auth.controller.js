import AuthService from '../services/auth.service.js';
import AuditLogService from '../services/auditLog.service.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export class AuthController {
  static register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const user = await AuthService.registerUser({ name, email, password, role });

    await AuditLogService.logAction(
      'USER_SIGNUP',
      user._id,
      `User ${user.email} signed up with role ${user.role}`,
      req.ip
    );

    new ApiResponse(201, user, 'User registered successfully').send(res);
  });

  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.loginUser({ email, password });

    await AuditLogService.logAction(
      'USER_LOGIN',
      user._id,
      `User ${user.email} logged in successfully`,
      req.ip
    );

    new ApiResponse(200, { user, accessToken, refreshToken }, 'Login successful').send(res);
  });

  static logout = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    await AuthService.logoutUser(userId);

    await AuditLogService.logAction(
      'USER_LOGOUT',
      userId,
      `User ${req.user.email} logged out`,
      req.ip
    );

    new ApiResponse(200, null, 'Logged out successfully').send(res);
  });

  static refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refreshTokens(refreshToken);

    new ApiResponse(200, tokens, 'Token refreshed successfully').send(res);
  });

  static getProfile = asyncHandler(async (req, res) => {
    new ApiResponse(200, req.user, 'Profile fetched successfully').send(res);
  });
}

export default AuthController;
