/**
 * Card Request Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CardRequest = sequelize.define('CardRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.UUID,
      field: 'driver_id',
      allowNull: false,
      references: {
        model: 'ev_drivers',
        key: 'id',
      },
    },
    requestType: {
      type: DataTypes.ENUM('new', 'replacement', 'additional'),
      field: 'request_type',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'shipped', 'delivered'),
      defaultValue: 'pending',
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      field: 'shipping_address',
      allowNull: false,
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      field: 'tracking_number',
      allowNull: true,
    },
    rfidCardId: {
      type: DataTypes.UUID,
      field: 'rfid_card_id',
      allowNull: true,
      references: {
        model: 'rfid_cards',
        key: 'id',
      },
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      field: 'rejection_reason',
      allowNull: true,
    },
    processedAt: {
      type: DataTypes.DATE,
      field: 'processed_at',
      allowNull: true,
    },
    processedBy: {
      type: DataTypes.UUID,
      field: 'processed_by',
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    shippedAt: {
      type: DataTypes.DATE,
      field: 'shipped_at',
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      field: 'delivered_at',
      allowNull: true,
    },
  }, {
    tableName: 'card_requests',
    timestamps: true,
    underscored: true,
  });

  return CardRequest;
};
