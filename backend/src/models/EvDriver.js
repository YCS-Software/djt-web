/**
 * EV Driver Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EvDriver = sequelize.define('EvDriver', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    firstName: {
      type: DataTypes.STRING(100),
      field: 'first_name',
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      field: 'last_name',
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      field: 'avatar_url',
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      field: 'date_of_birth',
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      field: 'phone_verified',
      defaultValue: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      field: 'email_verified',
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at',
      allowNull: true,
    },
    notificationPreferences: {
      type: DataTypes.JSONB,
      field: 'notification_preferences',
      defaultValue: { sms: true, email: true, push: true },
    },
  }, {
    tableName: 'ev_drivers',
    timestamps: true,
    paranoid: true,
    underscored: true,
  });

  EvDriver.prototype.getFullName = function() {
    return this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName;
  };

  return EvDriver;
};
