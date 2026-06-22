/**
 * Partner Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Partner = sequelize.define('Partner', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    legalName: {
      type: DataTypes.STRING(200),
      field: 'legal_name',
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    gstNumber: {
      type: DataTypes.STRING(20),
      field: 'gst_number',
      allowNull: true,
    },
    panNumber: {
      type: DataTypes.STRING(20),
      field: 'pan_number',
      allowNull: true,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'commission_rate',
      allowNull: false,
      defaultValue: 10.00,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      field: 'logo_url',
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    tableName: 'partners',
    timestamps: true,
    paranoid: true,
    underscored: true,
  });

  return Partner;
};
