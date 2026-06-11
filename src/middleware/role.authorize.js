import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Midleware to authorize specific roles.
 * Reads the JWT from Authorization header, verifies and decodes it,
 * checks if user role is in the allowed roles array, and returns 403 if unauthorized.
 * 
 * @param  {...string} roles - Allowed roles
 */
export const authorizeRole = (...roles) => {
  return async (req, res, next) => {
    try {
      let token;

      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return next(new ApiError(403, 'Access Denied. Authorization token is missing.'));
      }

      // Verify and decode JWT
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      
      // Fetch user from DB excluding password & refresh token
      const user = await User.findById(decoded.id).select('-password -refreshToken');

      if (!user) {
        return next(new ApiError(403, 'Access Denied. User associated with token no longer exists.'));
      }

      // Validate user role
      if (!roles.includes(user.role)) {
        return next(
          new ApiError(
            403,
            `Access Denied. User role '${user.role}' is not authorized to access this resource.`
          )
        );
      }

      // Attach user to request object and proceed
      req.user = user;
      next();
    } catch (error) {
      // Clear token invalidation/expiry error format
      return next(new ApiError(403, 'Access Denied. Invalid or expired token.'));
    }
  };
};

// Keep the legacy authorize middleware for backwards compatibility if needed
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required for authorization check'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access Denied. User role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

export default authorizeRole;
