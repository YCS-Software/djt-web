/**
 * OCPP Log Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OcppLog = sequelize.define('OcppLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    stationId: {
      type: DataTypes.UUID,
      field: 'station_id',
      allowNull: true,
      references: {
        model: 'charging_stations',
        key: 'id',
      },
    },
    ocppIdentity: {
      type: DataTypes.STRING(50),
      field: 'ocpp_identity',
      allowNull: false,
    },
    direction: {
      type: DataTypes.ENUM('incoming', 'outgoing'),
      allowNull: false,
    },
    messageType: {
      type: DataTypes.STRING(30),
      field: 'message_type',
      allowNull: false,
    },
    messageId: {
      type: DataTypes.STRING(50),
      field: 'message_id',
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    errorCode: {
      type: DataTypes.STRING(50),
      field: 'error_code',
      allowNull: true,
    },
    errorDescription: {
      type: DataTypes.TEXT,
      field: 'error_description',
      allowNull: true,
    },
  }, {
    tableName: 'ocpp_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false,
  });

  return OcppLog;
};
