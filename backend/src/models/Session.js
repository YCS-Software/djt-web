/**
 * Session Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    connectorId: {
      type: DataTypes.UUID,
      field: 'connector_id',
      allowNull: false,
      references: {
        model: 'connectors',
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
    rfidCardId: {
      type: DataTypes.UUID,
      field: 'rfid_card_id',
      allowNull: true,
      references: {
        model: 'rfid_cards',
        key: 'id',
      },
    },
    vehicleId: {
      type: DataTypes.UUID,
      field: 'vehicle_id',
      allowNull: true,
      references: {
        model: 'driver_vehicles',
        key: 'id',
      },
    },
    tariffId: {
      type: DataTypes.UUID,
      field: 'tariff_id',
      allowNull: true,
      references: {
        model: 'tariffs',
        key: 'id',
      },
    },
    transactionId: {
      type: DataTypes.INTEGER,
      field: 'transaction_id',
      allowNull: true,
    },
    idTag: {
      type: DataTypes.STRING(50),
      field: 'id_tag',
      allowNull: true,
    },
    startMethod: {
      type: DataTypes.ENUM('qr', 'rfid', 'remote', 'plug_and_charge'),
      field: 'start_method',
      defaultValue: 'qr',
    },
    startTime: {
      type: DataTypes.DATE,
      field: 'start_time',
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      field: 'end_time',
      allowNull: true,
    },
    startMeterWh: {
      type: DataTypes.INTEGER,
      field: 'start_meter_wh',
      allowNull: false,
      defaultValue: 0,
    },
    endMeterWh: {
      type: DataTypes.INTEGER,
      field: 'end_meter_wh',
      allowNull: true,
    },
    energyConsumedKwh: {
      type: DataTypes.DECIMAL(10, 3),
      field: 'energy_consumed_kwh',
      defaultValue: 0,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      field: 'duration_minutes',
      defaultValue: 0,
    },
    idleMinutes: {
      type: DataTypes.INTEGER,
      field: 'idle_minutes',
      defaultValue: 0,
    },
    energyAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'energy_amount',
      defaultValue: 0.00,
    },
    timeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'time_amount',
      defaultValue: 0.00,
    },
    sessionFee: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'session_fee',
      defaultValue: 0.00,
    },
    idleFee: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'idle_fee',
      defaultValue: 0.00,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'tax_amount',
      defaultValue: 0.00,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'discount_amount',
      defaultValue: 0.00,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'total_amount',
      defaultValue: 0.00,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR',
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'completed', 'failed', 'cancelled'),
      defaultValue: 'pending',
    },
    stopReason: {
      type: DataTypes.STRING(50),
      field: 'stop_reason',
      allowNull: true,
    },
    errorCode: {
      type: DataTypes.STRING(50),
      field: 'error_code',
      allowNull: true,
    },
    errorInfo: {
      type: DataTypes.TEXT,
      field: 'error_info',
      allowNull: true,
    },
    couponId: {
      type: DataTypes.UUID,
      field: 'coupon_id',
      allowNull: true,
      references: {
        model: 'coupons',
        key: 'id',
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    tableName: 'sessions',
    timestamps: true,
    underscored: true,
  });

  return Session;
};
