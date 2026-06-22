/**
 * OCPP MeterValues Handler
 */

const { ChargingStation, Session, SessionMeterValue } = require('../../models');
const logger = require('../../utils/logger');
const { getIO } = require('../../socket');

/**
 * Handle MeterValues from charge point
 */
async function meterValuesHandler(chargePointId, payload) {
  const { connectorId, transactionId, meterValue } = payload;

  logger.debug('MeterValues received', { chargePointId, connectorId, valuesCount: meterValue?.length });

  try {
    // Find station
    const station = await ChargingStation.findOne({
      where: { ocppIdentity: chargePointId },
    });

    if (!station) {
      logger.warn('Station not found for MeterValues', { chargePointId });
      return {};
    }

    // Find active session
    const session = await Session.findOne({
      where: {
        stationId: station.id,
        connectorNumber: connectorId,
        status: 'active',
      },
    });

    if (!session) {
      logger.debug('No active session for MeterValues', { chargePointId, connectorId });
      return {};
    }

    // Process meter values
    const processedValues = [];
    let currentPower = 0;
    let currentEnergy = 0;
    let currentSoC = null;

    for (const mv of meterValue || []) {
      const timestamp = mv.timestamp ? new Date(mv.timestamp) : new Date();

      for (const sv of mv.sampledValue || []) {
        const value = parseFloat(sv.value);
        const measurand = sv.measurand || 'Energy.Active.Import.Register';
        const unit = sv.unit || 'Wh';
        const phase = sv.phase || null;
        const location = sv.location || 'Outlet';
        const context = sv.context || 'Sample.Periodic';

        // Store meter value
        const meterValueRecord = await SessionMeterValue.create({
          sessionId: session.id,
          timestamp,
          measurand,
          value,
          unit,
          phase,
          location,
          context,
        });

        processedValues.push(meterValueRecord);

        // Track current values for real-time updates
        if (measurand === 'Power.Active.Import') {
          currentPower = unit === 'kW' ? value * 1000 : value;
        } else if (measurand === 'Energy.Active.Import.Register') {
          currentEnergy = unit === 'kWh' ? value : value / 1000;
        } else if (measurand === 'SoC') {
          currentSoC = value;
        }
      }
    }

    // Update session with latest values
    const updateData = {};
    if (currentEnergy > 0) {
      updateData.energyDelivered = currentEnergy - (session.meterStart / 1000);
    }
    if (currentPower > 0) {
      updateData.currentPower = currentPower;
    }
    if (currentSoC !== null) {
      updateData.currentSoC = currentSoC;
    }

    if (Object.keys(updateData).length > 0) {
      await session.update(updateData);
    }

    // Emit real-time update
    try {
      const io = getIO();

      const meterData = {
        sessionId: session.id,
        stationId: station.id,
        connectorId,
        timestamp: new Date().toISOString(),
        power: currentPower,
        energyDelivered: updateData.energyDelivered || session.energyDelivered || 0,
        soc: currentSoC,
        duration: Math.round((new Date() - session.startTime) / (1000 * 60)),
      };

      io.to(`session:${session.id}`).emit('meter:values', meterData);
      io.to(`station:${station.id}`).emit('meter:values', meterData);

      if (session.driverId) {
        io.to(`driver:${session.driverId}`).emit('meter:values', meterData);
      }
    } catch (socketError) {
      logger.debug('Socket emit skipped', { error: socketError.message });
    }

    return {};

  } catch (error) {
    logger.error('MeterValues handler error', { chargePointId, error: error.message });
    return {};
  }
}

module.exports = meterValuesHandler;
