const AuditLog = require('../models/AuditLog');

/**
 * Records an audit log entry for compliance and platform security
 */
const logAudit = async ({ action, user = null, role = '', entityType, entityId = null, details = {}, ipAddress = '' }) => {
  try {
    await AuditLog.create({
      action,
      user,
      role,
      entityType,
      entityId,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('[AuditService] Failed to record audit log:', error.message);
  }
};

module.exports = { logAudit };

