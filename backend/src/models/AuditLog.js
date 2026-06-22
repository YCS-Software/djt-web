/**
 * Audit Log Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    userType: {
      type: DataTypes.STRING(20),
      field: 'user_type',
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.UUID,
      field: 'resource_id',
      allowNull: true,
    },
    oldValues: {
      type: DataTypes.JSONB,
      field: 'old_values',
      allowNull: true,
    },
    newValues: {
      type: DataTypes.JSONB,
      field: 'new_values',
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.INET,
      field: 'ip_address',
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent',
      allowNull: true,
    },
    requestId: {
      type: DataTypes.STRING(100),
      field: 'request_id',
      allowNull: true,
    },
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false,
  });

  return AuditLog;
};
