/**
 * Notification Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userType: {
      type: DataTypes.ENUM('user', 'driver'),
      field: 'user_type',
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      allowNull: true,
    },
    driverId: {
      type: DataTypes.UUID,
      field: 'driver_id',
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    channel: {
      type: DataTypes.ENUM('in_app', 'sms', 'email', 'push'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'read'),
      defaultValue: 'pending',
    },
    sentAt: {
      type: DataTypes.DATE,
      field: 'sent_at',
      allowNull: true,
    },
    readAt: {
      type: DataTypes.DATE,
      field: 'read_at',
      allowNull: true,
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    updatedAt: false,
  });

  return Notification;
};
