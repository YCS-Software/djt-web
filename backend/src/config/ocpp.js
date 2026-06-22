/**
 * OCPP Configuration
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.OCPP_PORT || 9000,
    path: '/ocpp',
  },

  // Heartbeat configuration
  heartbeat: {
    interval: parseInt(process.env.OCPP_HEARTBEAT_INTERVAL, 10) || 300, // seconds
    timeout: 60, // seconds to wait before marking offline
  },

  // Supported OCPP versions
  supportedVersions: ['ocpp1.6'],

  // Message timeout (for waiting responses)
  messageTimeout: 30000, // 30 seconds

  // Retry configuration
  retry: {
    maxAttempts: 3,
    delay: 5000, // ms
  },

  // OCPP 1.6 Message Types
  messageTypes: {
    CALL: 2,
    CALLRESULT: 3,
    CALLERROR: 4,
  },

  // OCPP 1.6 Actions - Charge Point to Central System
  chargePointActions: [
    'BootNotification',
    'Heartbeat',
    'StatusNotification',
    'Authorize',
    'StartTransaction',
    'StopTransaction',
    'MeterValues',
    'DiagnosticsStatusNotification',
    'FirmwareStatusNotification',
    'DataTransfer',
  ],

  // OCPP 1.6 Actions - Central System to Charge Point
  centralSystemActions: [
    'RemoteStartTransaction',
    'RemoteStopTransaction',
    'Reset',
    'ChangeConfiguration',
    'GetConfiguration',
    'ChangeAvailability',
    'ClearCache',
    'UnlockConnector',
    'ReserveNow',
    'CancelReservation',
    'GetDiagnostics',
    'UpdateFirmware',
    'TriggerMessage',
    'DataTransfer',
  ],

  // Error codes
  errorCodes: {
    NotImplemented: 'NotImplemented',
    NotSupported: 'NotSupported',
    InternalError: 'InternalError',
    ProtocolError: 'ProtocolError',
    SecurityError: 'SecurityError',
    FormationViolation: 'FormationViolation',
    PropertyConstraintViolation: 'PropertyConstraintViolation',
    OccurrenceConstraintViolation: 'OccurrenceConstraintViolation',
    TypeConstraintViolation: 'TypeConstraintViolation',
    GenericError: 'GenericError',
  },

  // Connector status values
  connectorStatus: {
    Available: 'Available',
    Preparing: 'Preparing',
    Charging: 'Charging',
    SuspendedEVSE: 'SuspendedEVSE',
    SuspendedEV: 'SuspendedEV',
    Finishing: 'Finishing',
    Reserved: 'Reserved',
    Unavailable: 'Unavailable',
    Faulted: 'Faulted',
  },

  // Charge point status values
  chargePointStatus: {
    Available: 'Available',
    Occupied: 'Occupied',
    Unavailable: 'Unavailable',
    Faulted: 'Faulted',
  },

  // Authorization status
  authorizationStatus: {
    Accepted: 'Accepted',
    Blocked: 'Blocked',
    Expired: 'Expired',
    Invalid: 'Invalid',
    ConcurrentTx: 'ConcurrentTx',
  },

  // Registration status
  registrationStatus: {
    Accepted: 'Accepted',
    Pending: 'Pending',
    Rejected: 'Rejected',
  },

  // Reset type
  resetType: {
    Hard: 'Hard',
    Soft: 'Soft',
  },

  // Availability type
  availabilityType: {
    Inoperative: 'Inoperative',
    Operative: 'Operative',
  },

  // Stop reason
  stopReason: {
    EmergencyStop: 'EmergencyStop',
    EVDisconnected: 'EVDisconnected',
    HardReset: 'HardReset',
    Local: 'Local',
    Other: 'Other',
    PowerLoss: 'PowerLoss',
    Reboot: 'Reboot',
    Remote: 'Remote',
    SoftReset: 'SoftReset',
    UnlockCommand: 'UnlockCommand',
    DeAuthorized: 'DeAuthorized',
  },
};
