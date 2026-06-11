import AuditLog from '../models/auditLog.model.js';

export class AuditLogService {
  static async logAction(action, userId = null, details = '', ipAddress = '', done = '', doing = '', willDo = '') {
    try {
      const log = await AuditLog.create({
        action,
        user: userId,
        details,
        ipAddress,
        done,
        doing,
        willDo,
      });
      return log;
    } catch (error) {
      console.error('❌ Failed to create audit log:', error.message);
    }
  }

  static async getLogs({ page = 1, limit = 15, status, projectTitles, userRole }) {
    const skipIndex = (page - 1) * limit;
    const query = { action: 'PROJECT_STATUS_UPDATE' };

    if (status) {
      query.details = { $regex: new RegExp(`status changed to "${status}"`, 'i') };
    }

    if (userRole !== 'Admin') {
      if (projectTitles && projectTitles.length > 0) {
        const escapedTitles = projectTitles.map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
        const regexStr = escapedTitles.join('|');
        if (query.details) {
          query.$and = [
            { details: query.details },
            { details: { $regex: new RegExp(regexStr, 'i') } }
          ];
          delete query.details;
        } else {
          query.details = { $regex: new RegExp(regexStr, 'i') };
        }
      } else {
        return {
          logs: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        };
      }
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .skip(skipIndex)
      .limit(limit)
      .sort({ timestamp: -1 });

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export default AuditLogService;
