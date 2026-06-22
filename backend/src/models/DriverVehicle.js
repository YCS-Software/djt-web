/**
 * Driver Vehicle Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DriverVehicle = sequelize.define('DriverVehicle', {
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
    make: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    registrationNumber: {
      type: DataTypes.STRING(20),
      field: 'registration_number',
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    batteryCapacityKwh: {
      type: DataTypes.DECIMAL(6, 2),
      field: 'battery_capacity_kwh',
      allowNull: true,
    },
    preferredConnector: {
      type: DataTypes.STRING(20),
      field: 'preferred_connector',
      allowNull: true,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      field: 'is_primary',
      defaultValue: false,
    },
  }, {
    tableName: 'driver_vehicles',
    timestamps: true,
    paranoid: true,
    underscored: true,
  });

  return DriverVehicle;
};
