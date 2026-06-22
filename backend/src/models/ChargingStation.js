/**
 * Charging Station Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChargingStation = sequelize.define('ChargingStation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    locationId: {
      type: DataTypes.UUID,
      field: 'location_id',
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    ocppIdentity: {
      type: DataTypes.STRING(50),
      field: 'ocpp_identity',
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    vendor: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    serialNumber: {
      type: DataTypes.STRING(100),
      field: 'serial_number',
      allowNull: true,
    },
    firmwareVersion: {
      type: DataTypes.STRING(50),
      field: 'firmware_version',
      allowNull: true,
    },
    iccid: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    imsi: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      field: 'is_online',
      defaultValue: false,
    },
    lastHeartbeat: {
      type: DataTypes.DATE,
      field: 'last_heartbeat',
      allowNull: true,
    },
    lastBoot: {
      type: DataTypes.DATE,
      field: 'last_boot',
      allowNull: true,
    },
    bootNotification: {
      type: DataTypes.JSONB,
      field: 'boot_notification',
      allowNull: true,
    },
    configuration: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      defaultValue: 'active',
    },
    errorCode: {
      type: DataTypes.STRING(50),
      field: 'error_code',
      allowNull: true,
    },
    errorInfo: {
      type: DataTypes.TEXT,
      field: 'error_info',
      allowNull: true,
    },
  }, {
    tableName: 'charging_stations',
    timestamps: true,
    paranoid: true,
    underscored: true,
  });

  return ChargingStation;
};
