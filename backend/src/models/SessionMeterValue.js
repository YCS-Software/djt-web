/**
 * Session Meter Value Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SessionMeterValue = sequelize.define('SessionMeterValue', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      field: 'session_id',
      allowNull: false,
      references: {
        model: 'sessions',
        key: 'id',
      },
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    measurand: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    phase: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    context: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    format: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  }, {
    tableName: 'session_meter_values',
    timestamps: true,
    underscored: true,
    updatedAt: false,
  });

  return SessionMeterValue;
};
