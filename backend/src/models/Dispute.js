/**
 * Dispute Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Dispute = sequelize.define('Dispute', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    transactionId: {
      type: DataTypes.UUID,
      field: 'transaction_id',
      allowNull: true,
      references: {
        model: 'transactions',
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
    partnerId: {
      type: DataTypes.UUID,
      field: 'partner_id',
      allowNull: false,
      references: {
        model: 'partners',
        key: 'id',
      },
    },
    category: {
      type: DataTypes.ENUM('incorrect_billing', 'session_not_started', 'payment_issue', 'station_malfunction', 'other'),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed', 'escalated'),
      defaultValue: 'open',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'refund_amount',
      allowNull: true,
    },
    assignedTo: {
      type: DataTypes.UUID,
      field: 'assigned_to',
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resolvedAt: {
      type: DataTypes.DATE,
      field: 'resolved_at',
      allowNull: true,
    },
    resolvedBy: {
      type: DataTypes.UUID,
      field: 'resolved_by',
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    attachments: {
      type: sequelize.getDialect() === 'sqlite' ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
  }, {
    tableName: 'disputes',
    timestamps: true,
    underscored: true,
  });

  return Dispute;
};
