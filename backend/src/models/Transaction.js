/**
 * Transaction Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    partnerId: {
      type: DataTypes.UUID,
      field: 'partner_id',
      allowNull: true,
      references: {
        model: 'partners',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('session_charge', 'wallet_topup', 'refund', 'settlement', 'adjustment'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR',
    },
    paymentMethod: {
      type: DataTypes.STRING(30),
      field: 'payment_method',
      allowNull: true,
    },
    paymentGateway: {
      type: DataTypes.STRING(30),
      field: 'payment_gateway',
      allowNull: true,
    },
    gatewayOrderId: {
      type: DataTypes.STRING(100),
      field: 'gateway_order_id',
      allowNull: true,
    },
    gatewayPaymentId: {
      type: DataTypes.STRING(100),
      field: 'gateway_payment_id',
      allowNull: true,
    },
    gatewaySignature: {
      type: DataTypes.STRING(255),
      field: 'gateway_signature',
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    failureReason: {
      type: DataTypes.TEXT,
      field: 'failure_reason',
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
  });

  return Transaction;
};
