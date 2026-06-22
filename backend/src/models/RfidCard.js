/**
 * RFID Card Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RfidCard = sequelize.define('RfidCard', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.UUID,
      field: 'driver_id',
      allowNull: true,
      references: {
        model: 'ev_drivers',
        key: 'id',
      },
    },
    cardNumber: {
      type: DataTypes.STRING(50),
      field: 'card_number',
      allowNull: false,
      unique: true,
    },
    uid: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'blocked', 'expired', 'lost'),
      defaultValue: 'pending',
    },
    validFrom: {
      type: DataTypes.DATEONLY,
      field: 'valid_from',
      allowNull: true,
    },
    validUntil: {
      type: DataTypes.DATEONLY,
      field: 'valid_until',
      allowNull: true,
    },
    assignedAt: {
      type: DataTypes.DATE,
      field: 'assigned_at',
      allowNull: true,
    },
    blockedAt: {
      type: DataTypes.DATE,
      field: 'blocked_at',
      allowNull: true,
    },
    blockedReason: {
      type: DataTypes.TEXT,
      field: 'blocked_reason',
      allowNull: true,
    },
  }, {
    tableName: 'rfid_cards',
    timestamps: true,
    underscored: true,
  });

  return RfidCard;
};
