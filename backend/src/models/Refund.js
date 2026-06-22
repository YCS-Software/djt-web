/**
 * Refund Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Refund = sequelize.define('Refund', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      field: 'transaction_id',
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    sessionId: {
      type: DataTypes.UUID,
      field: 'session_id',
      allowNull: true,
      references: {
        model: 'sessions',
        key: 'id',
      },
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    gatewayRefundId: {
      type: DataTypes.STRING(100),
      field: 'gateway_refund_id',
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'refunds',
    timestamps: true,
    underscored: true,
  });

  return Refund;
};
