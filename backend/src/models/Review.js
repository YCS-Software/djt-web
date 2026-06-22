/**
 * Review Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      field: 'session_id',
      allowNull: false,
      references: {
        model: 'sessions',
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
    locationId: {
      type: DataTypes.UUID,
      field: 'location_id',
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    stationId: {
      type: DataTypes.UUID,
      field: 'station_id',
      allowNull: true,
      references: {
        model: 'charging_stations',
        key: 'id',
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    respondedAt: {
      type: DataTypes.DATE,
      field: 'responded_at',
      allowNull: true,
    },
    respondedBy: {
      type: DataTypes.UUID,
      field: 'responded_by',
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      field: 'is_visible',
      defaultValue: true,
    },
  }, {
    tableName: 'reviews',
    timestamps: true,
    underscored: true,
  });

  return Review;
};
