/**
 * Coupon Usage Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CouponUsage = sequelize.define('CouponUsage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    couponId: {
      type: DataTypes.UUID,
      field: 'coupon_id',
      allowNull: false,
      references: {
        model: 'coupons',
        key: 'id',
      },
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
    sessionId: {
      type: DataTypes.UUID,
      field: 'session_id',
      allowNull: true,
      references: {
        model: 'sessions',
        key: 'id',
      },
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'discount_amount',
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      field: 'used_at',
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'coupon_usage',
    timestamps: false,
    underscored: true,
  });

  return CouponUsage;
};
