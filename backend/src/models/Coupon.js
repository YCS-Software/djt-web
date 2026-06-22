/**
 * Coupon Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Coupon = sequelize.define('Coupon', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      field: 'discount_type',
      allowNull: false,
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'discount_value',
      allowNull: false,
    },
    maxDiscount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'max_discount',
      allowNull: true,
    },
    minAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'min_amount',
      defaultValue: 0.00,
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      field: 'usage_limit',
      allowNull: true,
    },
    usageCount: {
      type: DataTypes.INTEGER,
      field: 'usage_count',
      defaultValue: 0,
    },
    perUserLimit: {
      type: DataTypes.INTEGER,
      field: 'per_user_limit',
      defaultValue: 1,
    },
    validFrom: {
      type: DataTypes.DATE,
      field: 'valid_from',
      allowNull: false,
    },
    validUntil: {
      type: DataTypes.DATE,
      field: 'valid_until',
      allowNull: false,
    },
    applicableTo: {
      type: DataTypes.ENUM('all', 'new_users', 'specific_locations'),
      field: 'applicable_to',
      defaultValue: 'all',
    },
    locations: {
      type: sequelize.getDialect() === 'sqlite' ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'expired'),
      defaultValue: 'active',
    },
  }, {
    tableName: 'coupons',
    timestamps: true,
    underscored: true,
  });

  return Coupon;
};
