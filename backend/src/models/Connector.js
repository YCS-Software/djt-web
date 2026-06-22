/**
 * Connector Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Connector = sequelize.define('Connector', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    stationId: {
      type: DataTypes.UUID,
      field: 'station_id',
      allowNull: false,
      references: {
        model: 'charging_stations',
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
    connectorId: {
      type: DataTypes.INTEGER,
      field: 'connector_id',
      allowNull: false,
    },
    connectorType: {
      type: DataTypes.ENUM('CCS1', 'CCS2', 'CHAdeMO', 'Type1', 'Type2', 'GBT'),
      field: 'connector_type',
      allowNull: false,
    },
    powerKw: {
      type: DataTypes.DECIMAL(6, 2),
      field: 'power_kw',
      allowNull: false,
    },
    voltage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amperage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ocppStatus: {
      type: DataTypes.ENUM(
        'Available', 'Preparing', 'Charging', 'SuspendedEVSE',
        'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'
      ),
      field: 'ocpp_status',
      defaultValue: 'Unavailable',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      defaultValue: 'active',
    },
    lastStatusUpdate: {
      type: DataTypes.DATE,
      field: 'last_status_update',
      allowNull: true,
    },
    errorCode: {
      type: DataTypes.STRING(50),
      field: 'error_code',
      allowNull: true,
    },
  }, {
    tableName: 'connectors',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['station_id', 'connector_id'],
      },
    ],
  });

  return Connector;
};
