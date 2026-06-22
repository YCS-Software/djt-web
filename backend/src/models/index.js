/**
 * Sequelize Models Index
 * Initializes all models and their associations
 */

const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// SQLite (local mock stack) has no native JSONB column type; alias it to JSON
// before any model is loaded. This is a no-op for Postgres. (ARRAY columns are
// handled per-model via sequelize.getDialect(), since ARRAY must stay a class.)
// Must run before the require('./X') calls below.
if (dbConfig.dialect === 'sqlite') {
  DataTypes.JSONB = DataTypes.JSON;
}

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    storage: dbConfig.storage,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions,
  }
);

// Import models
const User = require('./User')(sequelize);
const Role = require('./Role')(sequelize);
const Permission = require('./Permission')(sequelize);
const Partner = require('./Partner')(sequelize);
const PartnerWallet = require('./PartnerWallet')(sequelize);
const Location = require('./Location')(sequelize);
const ChargingStation = require('./ChargingStation')(sequelize);
const Connector = require('./Connector')(sequelize);
const Tariff = require('./Tariff')(sequelize);
const EvDriver = require('./EvDriver')(sequelize);
const DriverWallet = require('./DriverWallet')(sequelize);
const DriverVehicle = require('./DriverVehicle')(sequelize);
const RfidCard = require('./RfidCard')(sequelize);
const Session = require('./Session')(sequelize);
const SessionLog = require('./SessionLog')(sequelize);
const SessionMeterValue = require('./SessionMeterValue')(sequelize);
const Reservation = require('./Reservation')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const WalletTransaction = require('./WalletTransaction')(sequelize);
const Refund = require('./Refund')(sequelize);
const Coupon = require('./Coupon')(sequelize);
const CouponUsage = require('./CouponUsage')(sequelize);
const Review = require('./Review')(sequelize);
const Dispute = require('./Dispute')(sequelize);
const CardRequest = require('./CardRequest')(sequelize);
const QrCode = require('./QrCode')(sequelize);
const Notification = require('./Notification')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const OcppLog = require('./OcppLog')(sequelize);

// Define associations

// User - Role (Many-to-Many)
User.belongsToMany(Role, { through: 'user_roles', foreignKey: 'user_id', otherKey: 'role_id' });
Role.belongsToMany(User, { through: 'user_roles', foreignKey: 'role_id', otherKey: 'user_id' });

// Role - Permission (Many-to-Many)
Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'role_id', otherKey: 'permission_id' });
Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permission_id', otherKey: 'role_id' });

// User - Partner
User.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });
Partner.hasMany(User, { foreignKey: 'partner_id', as: 'users' });

// Partner - PartnerWallet
Partner.hasOne(PartnerWallet, { foreignKey: 'partner_id', as: 'wallet' });
PartnerWallet.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });

// Partner - Location
Partner.hasMany(Location, { foreignKey: 'partner_id', as: 'locations' });
Location.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });

// Partner - Tariff
Partner.hasMany(Tariff, { foreignKey: 'partner_id', as: 'tariffs' });
Tariff.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });

// Location - ChargingStation
Location.hasMany(ChargingStation, { foreignKey: 'location_id', as: 'stations' });
ChargingStation.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

// ChargingStation - Connector
ChargingStation.hasMany(Connector, { foreignKey: 'station_id', as: 'connectors' });
Connector.belongsTo(ChargingStation, { foreignKey: 'station_id', as: 'station' });

// Connector - Tariff
Connector.belongsTo(Tariff, { foreignKey: 'tariff_id', as: 'tariff' });
Tariff.hasMany(Connector, { foreignKey: 'tariff_id', as: 'connectors' });

// Connector - QrCode
Connector.hasOne(QrCode, { foreignKey: 'connector_id', as: 'qrCode' });
QrCode.belongsTo(Connector, { foreignKey: 'connector_id', as: 'connector' });

// EvDriver - DriverWallet
EvDriver.hasOne(DriverWallet, { foreignKey: 'driver_id', as: 'wallet' });
DriverWallet.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });

// EvDriver - DriverVehicle
EvDriver.hasMany(DriverVehicle, { foreignKey: 'driver_id', as: 'vehicles' });
DriverVehicle.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });

// EvDriver - RfidCard
EvDriver.hasMany(RfidCard, { foreignKey: 'driver_id', as: 'rfidCards' });
RfidCard.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });

// Session associations
Session.belongsTo(Connector, { foreignKey: 'connector_id', as: 'connector' });
Connector.hasMany(Session, { foreignKey: 'connector_id', as: 'sessions' });

Session.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });
EvDriver.hasMany(Session, { foreignKey: 'driver_id', as: 'sessions' });

Session.belongsTo(RfidCard, { foreignKey: 'rfid_card_id', as: 'rfidCard' });
RfidCard.hasMany(Session, { foreignKey: 'rfid_card_id', as: 'sessions' });

Session.belongsTo(DriverVehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
Session.belongsTo(Tariff, { foreignKey: 'tariff_id', as: 'tariff' });
Session.belongsTo(Coupon, { foreignKey: 'coupon_id', as: 'coupon' });

// Session - SessionLog
Session.hasMany(SessionLog, { foreignKey: 'session_id', as: 'logs' });
SessionLog.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

// Session - SessionMeterValue
Session.hasMany(SessionMeterValue, { foreignKey: 'session_id', as: 'meterValues' });
SessionMeterValue.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

// Reservation associations
Reservation.belongsTo(Connector, { foreignKey: 'connector_id', as: 'connector' });
Connector.hasMany(Reservation, { foreignKey: 'connector_id', as: 'reservations' });

Reservation.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });
EvDriver.hasMany(Reservation, { foreignKey: 'driver_id', as: 'reservations' });

// Transaction associations
Transaction.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });
Transaction.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });
Transaction.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });

// WalletTransaction associations
WalletTransaction.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });
WalletTransaction.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });
WalletTransaction.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
WalletTransaction.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

// Refund associations
Refund.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
Refund.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });
Refund.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });
Refund.belongsTo(User, { foreignKey: 'processed_by', as: 'processedByUser' });

// Coupon associations
Coupon.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });
Partner.hasMany(Coupon, { foreignKey: 'partner_id', as: 'coupons' });

// CouponUsage associations
CouponUsage.belongsTo(Coupon, { foreignKey: 'coupon_id', as: 'coupon' });
CouponUsage.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });
CouponUsage.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

// Review associations
Review.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });
Review.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });
Review.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Review.belongsTo(ChargingStation, { foreignKey: 'station_id', as: 'station' });
Review.belongsTo(User, { foreignKey: 'responded_by', as: 'responder' });

// Dispute associations
Dispute.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });
Dispute.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
Dispute.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });
Dispute.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });
Dispute.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Dispute.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolver' });

// CardRequest associations
CardRequest.belongsTo(EvDriver, { foreignKey: 'driver_id', as: 'driver' });
CardRequest.belongsTo(RfidCard, { foreignKey: 'rfid_card_id', as: 'rfidCard' });
CardRequest.belongsTo(User, { foreignKey: 'processed_by', as: 'processor' });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// OcppLog associations
OcppLog.belongsTo(ChargingStation, { foreignKey: 'station_id', as: 'station' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  User,
  Role,
  Permission,
  Partner,
  PartnerWallet,
  Location,
  ChargingStation,
  Connector,
  Tariff,
  EvDriver,
  DriverWallet,
  DriverVehicle,
  RfidCard,
  Session,
  SessionLog,
  SessionMeterValue,
  Reservation,
  Transaction,
  WalletTransaction,
  Refund,
  Coupon,
  CouponUsage,
  Review,
  Dispute,
  CardRequest,
  QrCode,
  Notification,
  AuditLog,
  OcppLog,
};
