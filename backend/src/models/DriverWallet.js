/**
 * Driver Wallet Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DriverWallet = sequelize.define('DriverWallet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.UUID,
      field: 'driver_id',
      allowNull: false,
      unique: true,
      references: {
        model: 'ev_drivers',
        key: 'id',
      },
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR',
    },
    lowBalanceAlert: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'low_balance_alert',
      defaultValue: 100.00,
    },
    autoTopup: {
      type: DataTypes.BOOLEAN,
      field: 'auto_topup',
      defaultValue: false,
    },
    autoTopupAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'auto_topup_amount',
      defaultValue: 500.00,
    },
  }, {
    tableName: 'driver_wallets',
    timestamps: true,
    underscored: true,
  });

  return DriverWallet;
};
