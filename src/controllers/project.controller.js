import ProjectService from '../services/project.service.js';
import UploadService from '../services/upload.service.js';
import AuditLogService from '../services/auditLog.service.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { emitToUser, emitToAdmins } from '../config/socket.js';
import { ApiError } from '../utils/apiError.js';
import fs from 'fs';

export class ProjectController {
  static createProject = asyncHandler(async (req, res) => {
    let { title, description, startDate, endDate, status, assignedUsers } = req.body;

    // Parse assignedUsers if it's sent as string (common with multipart/form-data)
    if (typeof assignedUsers === 'string') {
      try {
        assignedUsers = JSON.parse(assignedUsers);
      } catch (err) {
        assignedUsers = assignedUsers.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Process uploaded files if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        req.files.forEach(f => {
          try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch (e) {}
        });
        throw new ApiError(400, 'A project cannot have more than 3 attachments.');
      }
      for (const file of req.files) {
        const fileData = await UploadService.uploadFile(file);
        attachments.push(fileData);
      }
    }

    const project = await ProjectService.createProject(
      {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        assignedUsers,
        attachments,
      },
      req.user._id
    );

    // Logs & Notifications
    await AuditLogService.logAction(
      'PROJECT_CREATE',
      req.user._id,
      `Project created: "${project.title}"`,
      req.ip
    );

    // Notify assigned users
    if (project.assignedUsers && project.assignedUsers.length > 0) {
      project.assignedUsers.forEach((userId) => {
        emitToUser(userId.toString(), 'notification', {
          type: 'PROJECT_ASSIGNED',
          message: `You have been assigned to project: "${project.title}"`,
          projectId: project._id,
        });
      });
    }

    emitToAdmins('notification', {
      type: 'PROJECT_CREATED',
      message: `New project created: "${project.title}" by ${req.user.name}`,
      projectId: project._id,
    });

    new ApiResponse(201, project, 'Project created successfully').send(res);
  });

  static updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Find project first to inspect attachments length
    const existingProject = await ProjectService.getProjectById(id, req.user._id, req.user.role);

    // Parse assignedUsers if it's string format
    if (typeof updateData.assignedUsers === 'string') {
      try {
        updateData.assignedUsers = JSON.parse(updateData.assignedUsers);
      } catch (err) {
        updateData.assignedUsers = updateData.assignedUsers.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Process new attachments
    const newAttachments = [];
    if (req.files && req.files.length > 0) {
      const totalCount = existingProject.attachments.length + req.files.length;
      if (totalCount > 3) {
        // Clean up temp uploads before erroring out
        req.files.forEach(f => {
          try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch (e) {}
        });
        throw new ApiError(400, `A project cannot have more than 3 attachments. Currently has ${existingProject.attachments.length}.`);
      }

      for (const file of req.files) {
        const fileData = await UploadService.uploadFile(file);
        newAttachments.push(fileData);
      }
    }

    if (newAttachments.length > 0) {
      updateData.attachments = [...existingProject.attachments, ...newAttachments];
    }

    const updatedProject = await ProjectService.updateProject(id, updateData);

    // Logs & Notifications
    await AuditLogService.logAction(
      'PROJECT_UPDATE',
      req.user._id,
      `Project updated: "${updatedProject.title}"`,
      req.ip
    );

    // Notify assigned users
    if (updatedProject.assignedUsers && updatedProject.assignedUsers.length > 0) {
      updatedProject.assignedUsers.forEach((userId) => {
        emitToUser(userId.toString(), 'notification', {
          type: 'PROJECT_UPDATED',
          message: `Project "${updatedProject.title}" details have been updated.`,
          projectId: updatedProject._id,
        });
      });
    }

    new ApiResponse(200, updatedProject, 'Project updated successfully').send(res);
  });

  static deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const project = await ProjectService.getProjectById(id, req.user._id, req.user.role);

    // Remove files from Cloudinary or local disk
    if (project.attachments && project.attachments.length > 0) {
      for (const att of project.attachments) {
        await UploadService.deleteFile(att.public_id, att.url);
      }
    }

    await ProjectService.deleteProject(id);

    await AuditLogService.logAction(
      'PROJECT_DELETE',
      req.user._id,
      `Project deleted: "${project.title}"`,
      req.ip
    );

    new ApiResponse(200, null, 'Project deleted successfully').send(res);
  });

  static getProjects = asyncHandler(async (req, res) => {
    const search = req.query.search || '';
    const status = req.query.status || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const data = await ProjectService.getProjectsList({
      search,
      status,
      page,
      limit,
      userId: req.user._id,
      userRole: req.user.role,
    });

    new ApiResponse(200, data, 'Projects fetched successfully').send(res);
  });

  static getProjectById = asyncHandler(async (req, res) => {
    const project = await ProjectService.getProjectById(req.params.id, req.user._id, req.user.role);
    new ApiResponse(200, project, 'Project details fetched successfully').send(res);
  });

  static updateProjectStatus = asyncHandler(async (req, res) => {
    const projectId = req.params.id || req.body.projectId;
    const { status, doing, done, willDo } = req.body;
    const project = await ProjectService.updateProjectStatus(
      projectId,
      status,
      req.user._id,
      req.user.role
    );

    await AuditLogService.logAction(
      'PROJECT_STATUS_UPDATE',
      req.user._id,
      `Project "${project.title}" status changed to "${status}"`,
      req.ip,
      done,
      doing,
      willDo
    );

    // Notify assigned users & admins
    if (project.assignedUsers && project.assignedUsers.length > 0) {
      project.assignedUsers.forEach((userId) => {
        emitToUser(userId.toString(), 'notification', {
          type: 'STATUS_UPDATED',
          message: `Project "${project.title}" status updated to "${status}"`,
          projectId: project._id,
        });
      });
    }

    emitToAdmins('notification', {
      type: 'STATUS_UPDATED',
      message: `Project "${project.title}" status updated to "${status}" by ${req.user.name}`,
      projectId: project._id,
    });

    new ApiResponse(200, project, `Project status updated to ${status}`).send(res);
  });

  static removeProjectAttachment = asyncHandler(async (req, res) => {
    const { id, attachmentId } = req.params;
    const project = await ProjectService.getProjectById(id, req.user._id, req.user.role);
    const attachment = project.attachments.find(a => a._id.toString() === attachmentId);

    if (!attachment) {
      throw new ApiError(404, 'Attachment not found');
    }

    // Delete actual file
    await UploadService.deleteFile(attachment.public_id, attachment.url);
    const updatedProject = await ProjectService.removeAttachment(id, attachmentId);

    new ApiResponse(200, updatedProject, 'Attachment removed successfully').send(res);
  });
}

export default ProjectController;
