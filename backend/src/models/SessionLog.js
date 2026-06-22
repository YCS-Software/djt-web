/**
 * Session Log Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SessionLog = sequelize.define('SessionLog', {
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
    eventType: {
      type: DataTypes.STRING(50),
      field: 'event_type',
      allowNull: false,
    },
    eventData: {
      type: DataTypes.JSONB,
      field: 'event_data',
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'session_logs',
    timestamps: false,
    underscored: true,
  });

  return SessionLog;
};
