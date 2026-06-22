/**
 * Wallet Transaction Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WalletTransaction = sequelize.define('WalletTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    walletType: {
      type: DataTypes.ENUM('driver', 'partner'),
      field: 'wallet_type',
      allowNull: false,
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
    transactionId: {
      type: DataTypes.UUID,
      field: 'transaction_id',
      allowNull: true,
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
    type: {
      type: DataTypes.ENUM('credit', 'debit'),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('topup', 'charge', 'refund', 'settlement', 'adjustment', 'coupon'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    balanceBefore: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'balance_before',
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'balance_after',
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  }, {
    tableName: 'wallet_transactions',
    timestamps: true,
    underscored: true,
    updatedAt: false,
  });

  return WalletTransaction;
};
