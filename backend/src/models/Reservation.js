/**
 * Reservation Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reservation = sequelize.define('Reservation', {
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
      allowNull: false,
      references: {
        model: 'ev_drivers',
        key: 'id',
      },
    },
    reservationId: {
      type: DataTypes.INTEGER,
      field: 'reservation_id',
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      field: 'start_time',
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      field: 'end_time',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'used', 'expired', 'cancelled'),
      defaultValue: 'pending',
    },
    idTag: {
      type: DataTypes.STRING(50),
      field: 'id_tag',
      allowNull: true,
    },
    parentIdTag: {
      type: DataTypes.STRING(50),
      field: 'parent_id_tag',
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      field: 'cancelled_at',
      allowNull: true,
    },
    cancelledReason: {
      type: DataTypes.TEXT,
      field: 'cancelled_reason',
      allowNull: true,
    },
  }, {
    tableName: 'reservations',
    timestamps: true,
    underscored: true,
  });

  return Reservation;
};
