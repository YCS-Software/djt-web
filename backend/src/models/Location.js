/**
 * Location Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Location = sequelize.define('Location', {
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
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'India',
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    operatingHours: {
      type: DataTypes.JSONB,
      field: 'operating_hours',
      defaultValue: {
        monday: { open: '06:00', close: '22:00' },
        tuesday: { open: '06:00', close: '22:00' },
        wednesday: { open: '06:00', close: '22:00' },
        thursday: { open: '06:00', close: '22:00' },
        friday: { open: '06:00', close: '22:00' },
        saturday: { open: '06:00', close: '22:00' },
        sunday: { open: '06:00', close: '22:00' },
      },
    },
    amenities: {
      type: sequelize.getDialect() === 'sqlite' ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    images: {
      type: sequelize.getDialect() === 'sqlite' ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      field: 'contact_phone',
      allowNull: true,
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      field: 'contact_email',
      allowNull: true,
    },
    directions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'coming_soon'),
      defaultValue: 'active',
    },
  }, {
    tableName: 'locations',
    timestamps: true,
    paranoid: true,
    underscored: true,
  });

  return Location;
};
