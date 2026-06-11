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

  static async getLogs({ page = 1, limit = 15 }) {
    const skipIndex = (page - 1) * limit;
    const query = { action: 'PROJECT_STATUS_UPDATE' };
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
