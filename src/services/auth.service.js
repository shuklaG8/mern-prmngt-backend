import User from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export class AuthService {
  static async registerUser({ name, email, password, role }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
    });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return userObj;
  }

  static async loginUser({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return {
      user: userObj,
      accessToken,
      refreshToken,
    };
  }

  static async logoutUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    user.refreshToken = null;
    await user.save();
    return true;
  }

  static async refreshTokens(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      throw new ApiError(401, 'Refresh token is required');
    }

    try {
      const decoded = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }

      const accessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      user.refreshToken = newRefreshToken;
      await user.save();

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new ApiError(401, error.message || 'Invalid refresh token');
    }
  }

  static async getProfile(userId) {
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }
}

export default AuthService;
