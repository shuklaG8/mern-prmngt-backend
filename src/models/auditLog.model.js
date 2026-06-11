import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  details: {
    type: String,
    required: true,
  },
  done: {
    type: String,
    default: '',
  },
  doing: {
    type: String,
    default: '',
  },
  willDo: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
