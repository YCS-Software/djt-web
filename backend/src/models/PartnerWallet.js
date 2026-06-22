/**
 * Partner Wallet Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PartnerWallet = sequelize.define('PartnerWallet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    partnerId: {
      type: DataTypes.UUID,
      field: 'partner_id',
      allowNull: false,
      unique: true,
      references: {
        model: 'partners',
        key: 'id',
      },
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    pendingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      field: 'pending_balance',
      allowNull: false,
      defaultValue: 0.00,
    },
    totalEarned: {
      type: DataTypes.DECIMAL(12, 2),
      field: 'total_earned',
      allowNull: false,
      defaultValue: 0.00,
    },
    totalSettled: {
      type: DataTypes.DECIMAL(12, 2),
      field: 'total_settled',
      allowNull: false,
      defaultValue: 0.00,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR',
    },
  }, {
    tableName: 'partner_wallets',
    timestamps: true,
    underscored: true,
  });

  return PartnerWallet;
};
