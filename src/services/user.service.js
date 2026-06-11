import User from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';

export class UserService {
  static async createUser({ name, email, password, role }) {
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

  static async updateUser(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await User.findOne({ email: updateData.email });
      if (existingEmail) {
        throw new ApiError(400, 'Email is already in use');
      }
    }

    // Explicitly update fields
    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.role) user.role = updateData.role;
    if (updateData.password) user.password = updateData.password; // pre-save hook will hash it

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return userObj;
  }

  static async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await User.findByIdAndDelete(userId);
    return true;
  }

  static async changeUserRole(userId, role) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.role = role;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return userObj;
  }

  static async getUsersList({ search = '', page = 1, limit = 10 }) {
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skipIndex = (page - 1) * limit;

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -refreshToken')
      .skip(skipIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    return {
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
      },
    };
  }

  static async getUserById(userId) {
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  static async updateOwnProfile(userId, { name, password }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (name) {
      user.name = name;
      user.avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
    }
    if (password) {
      user.password = password;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return userObj;
  }
}

export default UserService;
