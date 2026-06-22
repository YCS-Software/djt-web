/**
 * Tariff Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tariff = sequelize.define('Tariff', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    partnerId: {
      type: DataTypes.UUID,
      field: 'partner_id',
      allowNull: false,
      references: {
        model: 'partners',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR',
    },
    energyRate: {
      type: DataTypes.DECIMAL(8, 4),
      field: 'energy_rate',
      allowNull: true,
    },
    timeRate: {
      type: DataTypes.DECIMAL(8, 4),
      field: 'time_rate',
      allowNull: true,
    },
    sessionFee: {
      type: DataTypes.DECIMAL(8, 2),
      field: 'session_fee',
      allowNull: true,
    },
    idleFeeRate: {
      type: DataTypes.DECIMAL(8, 4),
      field: 'idle_fee_rate',
      allowNull: true,
    },
    idleGraceMinutes: {
      type: DataTypes.INTEGER,
      field: 'idle_grace_minutes',
      defaultValue: 5,
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'tax_rate',
      defaultValue: 18.00,
    },
    minAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'min_amount',
      defaultValue: 0.00,
    },
    maxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'max_amount',
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      field: 'is_default',
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
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
    timeOfUse: {
      type: DataTypes.JSONB,
      field: 'time_of_use',
      allowNull: true,
    },
  }, {
    tableName: 'tariffs',
    timestamps: true,
    paranoid: true,
    underscored: true,
  });

  return Tariff;
};
