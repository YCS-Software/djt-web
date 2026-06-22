/**
 * QR Code Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QrCode = sequelize.define('QrCode', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    connectorId: {
      type: DataTypes.UUID,
      field: 'connector_id',
      allowNull: false,
      unique: true,
      references: {
        model: 'connectors',
        key: 'id',
      },
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      field: 'image_url',
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: true,
    },
    scansCount: {
      type: DataTypes.INTEGER,
      field: 'scans_count',
      defaultValue: 0,
    },
    lastScannedAt: {
      type: DataTypes.DATE,
      field: 'last_scanned_at',
      allowNull: true,
    },
  }, {
    tableName: 'qr_codes',
    timestamps: true,
    underscored: true,
  });

  return QrCode;
};
