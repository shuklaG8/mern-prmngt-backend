import User from '../models/user.model.js';
import Project from '../models/project.model.js';
import AuditLogService from '../services/auditLog.service.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export class DashboardController {
  static getStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Filter projects depending on roles
    const projectFilter = {};
    if (userRole !== 'Admin') {
      projectFilter.assignedUsers = userId;
    }

    // 1. Total Projects
    const totalProjects = await Project.countDocuments(projectFilter);

    // 2. Total Users (Admins see system total standard users, Users see number of unique standard user teammates on their projects)
    let totalUsers = 0;
    if (userRole === 'Admin') {
      totalUsers = await User.countDocuments({ role: 'User' });
    } else {
      // Find all projects user is assigned to
      const userProjects = await Project.find({ assignedUsers: userId }).select('assignedUsers');
      const teammateIds = new Set();
      userProjects.forEach((proj) => {
        proj.assignedUsers.forEach((id) => teammateIds.add(id.toString()));
      });
      // Filter out teammateIds that are Admins (only count standard User role accounts)
      totalUsers = await User.countDocuments({
        _id: { $in: Array.from(teammateIds) },
        role: 'User',
      });
    }

    // 3. Projects by Status using Mongoose Aggregation
    const matchStage = {};
    if (userRole !== 'Admin') {
      matchStage.assignedUsers = userId;
    }

    const statusAggregation = await Project.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const projectsByStatus = {
      pending: 0,
      inProgress: 0,
      completed: 0,
    };

    statusAggregation.forEach((item) => {
      if (item._id === 'Pending') projectsByStatus.pending = item.count;
      else if (item._id === 'In-Progress') projectsByStatus.inProgress = item.count;
      else if (item._id === 'Completed') projectsByStatus.completed = item.count;
    });

    // 4. Projects ending within next 7 days
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    // Dynamic query: endDate between now and 7 days from now, status is not completed
    const deadlineFilter = {
      ...projectFilter,
      endDate: { $gte: now, $lte: sevenDaysLater },
      status: { $ne: 'Completed' },
    };

    const endingSoonProjects = await Project.find(deadlineFilter)
      .select('title endDate status assignedUsers')
      .populate('assignedUsers', 'name email avatar')
      .sort({ endDate: 1 });

    const statsPayload = {
      totalUsers,
      totalProjects,
      projectsByStatus,
      endingSoonProjects,
    };

    new ApiResponse(200, statsPayload, 'Dashboard stats fetched successfully').send(res);
  });

  static getActivityLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;

    const data = await AuditLogService.getLogs({ page, limit });
    new ApiResponse(200, data, 'Activity logs fetched successfully').send(res);
  });
}

export default DashboardController;
