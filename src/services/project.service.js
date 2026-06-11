import Project from '../models/project.model.js';
import { ApiError } from '../utils/apiError.js';

export class ProjectService {
  static async createProject(projectData, creatorId) {
    const project = await Project.create({
      ...projectData,
      createdBy: creatorId,
    });
    return project;
  }

  static async updateProject(projectId, updateData) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    Object.assign(project, updateData);
    await project.save();
    return project;
  }

  static async deleteProject(projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    await Project.findByIdAndDelete(projectId);
    return true;
  }

  static async updateProjectStatus(projectId, status, userId, userRole) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Authorization: Admin can update any project status. User can only update if assigned.
    if (userRole !== 'Admin') {
      const isAssigned = project.assignedUsers.some(
        (id) => id.toString() === userId.toString()
      );
      if (!isAssigned) {
        throw new ApiError(403, 'You are not authorized to update status of this project');
      }
    }

    project.status = status;
    await project.save();
    return project;
  }

  static async getProjectsList({ search = '', status = '', page = 1, limit = 10, userId, userRole }) {
    const filter = {};

    // Role restrictions: standard User sees only assigned projects
    if (userRole !== 'Admin') {
      filter.assignedUsers = userId;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skipIndex = (page - 1) * limit;

    const totalProjects = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('assignedUsers', 'name email avatar role')
      .populate('createdBy', 'name email avatar')
      .skip(skipIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    return {
      projects,
      pagination: {
        total: totalProjects,
        page,
        limit,
        pages: Math.ceil(totalProjects / limit),
      },
    };
  }

  static async getProjectById(projectId, userId, userRole) {
    const project = await Project.findById(projectId)
      .populate('assignedUsers', 'name email avatar role')
      .populate('createdBy', 'name email avatar');

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Role restrictions: user must be assigned to this project or be an Admin
    if (userRole !== 'Admin') {
      const isAssigned = project.assignedUsers.some(
        (user) => user._id.toString() === userId.toString()
      );
      if (!isAssigned) {
        throw new ApiError(403, 'Access denied. You are not assigned to this project.');
      }
    }

    return project;
  }

  static async addAttachments(projectId, newAttachments) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Max 3 attachments total
    if (project.attachments.length + newAttachments.length > 3) {
      throw new ApiError(400, 'A project can have a maximum of 3 attachments');
    }

    project.attachments.push(...newAttachments);
    await project.save();
    return project;
  }

  static async removeAttachment(projectId, attachmentId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    project.attachments = project.attachments.filter(
      (att) => att._id.toString() !== attachmentId
    );
    await project.save();
    return project;
  }
}

export default ProjectService;
