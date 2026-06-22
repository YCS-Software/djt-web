/**
 * OCPP StopTransaction Handler
 */

const {
  ChargingStation,
  Connector,
  Session,
  SessionLog,
  RfidCard,
  EvDriver,
  DriverWallet,
  WalletTransaction,
  Transaction,
  Tariff
} = require('../../models');
const logger = require('../../utils/logger');
const { getIO } = require('../../socket');
const sequelize = require('../../config/database');

/**
 * Handle StopTransaction from charge point
 */
async function stopTransactionHandler(chargePointId, payload) {
  const {
    transactionId,
    idTag,
    meterStop,
    timestamp,
    reason,
    transactionData
  } = payload;

  logger.info('StopTransaction received', { chargePointId, transactionId, meterStop, reason });

  const t = await sequelize.transaction();

  try {
    // Find station
    const station = await ChargingStation.findOne({
      where: { ocppIdentity: chargePointId },
    });

    if (!station) {
      await t.rollback();
      logger.error('Station not found for StopTransaction', { chargePointId });
      return { idTagInfo: { status: 'Invalid' } };
    }

    // Find active session - try by idTag first since transactionId mapping is complex
    let session = await Session.findOne({
      where: {
        stationId: station.id,
        status: 'active',
        idTag: idTag,
      },
      include: [
        { model: EvDriver, as: 'driver' },
        { model: Tariff, as: 'tariff' },
      ],
      transaction: t,
    });

    // Fallback: find any active session on this station
    if (!session) {
      session = await Session.findOne({
        where: {
          stationId: station.id,
          status: 'active',
        },
        include: [
          { model: EvDriver, as: 'driver' },
          { model: Tariff, as: 'tariff' },
        ],
        order: [['startTime', 'DESC']],
        transaction: t,
      });
    }

    if (!session) {
      await t.rollback();
      logger.warn('No active session found for StopTransaction', { chargePointId, transactionId });
      return { idTagInfo: { status: 'Invalid' } };
    }

    // Calculate energy and cost
    const energyDelivered = (meterStop - session.meterStart) / 1000; // Convert Wh to kWh
    const endTime = timestamp ? new Date(timestamp) : new Date();
    const durationMinutes = (endTime - session.startTime) / (1000 * 60);

    // Calculate billing
    let totalCost = 0;
    let energyCost = 0;
    let timeCost = 0;
    let parkingCost = 0;

    if (session.tariff) {
      energyCost = energyDelivered * (session.tariff.energyRate || 0);
      timeCost = durationMinutes * (session.tariff.timeRate || 0);
      // Add parking fee if session exceeded free parking time
      const freeParkingMinutes = session.tariff.freeParkingMinutes || 0;
      if (durationMinutes > freeParkingMinutes) {
        parkingCost = (durationMinutes - freeParkingMinutes) * (session.tariff.parkingRate || 0);
      }
      totalCost = energyCost + timeCost + parkingCost;
    }

    // Update session
    await session.update({
      status: 'completed',
      meterStop,
      endTime,
      energyDelivered,
      duration: Math.round(durationMinutes),
      stopReason: reason || 'Local',
      energyCost,
      timeCost,
      parkingCost,
      totalCost,
      billingStatus: 'pending',
    }, { transaction: t });

    // Create session log
    await SessionLog.create({
      sessionId: session.id,
      event: 'stopped',
      data: {
        meterStop,
        energyDelivered,
        duration: Math.round(durationMinutes),
        reason,
        totalCost,
      },
    }, { transaction: t });

    // Deduct from driver wallet
    if (session.driver && totalCost > 0) {
      const wallet = await DriverWallet.findOne({
        where: { driverId: session.driver.id },
        transaction: t,
        lock: true,
      });

      if (wallet) {
        const newBalance = wallet.balance - totalCost;
        await wallet.update({
          balance: newBalance,
          lastTransactionAt: new Date(),
        }, { transaction: t });

        // Create wallet transaction
        await WalletTransaction.create({
          walletId: wallet.id,
          type: 'debit',
          amount: totalCost,
          balanceAfter: newBalance,
          description: `Charging session ${session.id}`,
          referenceType: 'session',
          referenceId: session.id,
        }, { transaction: t });

        // Create transaction record
        await Transaction.create({
          sessionId: session.id,
          driverId: session.driver.id,
          partnerId: station.partnerId,
          type: 'session_payment',
          amount: totalCost,
          status: 'completed',
          paymentMethod: 'wallet',
        }, { transaction: t });

        // Update session billing status
        await session.update({ billingStatus: 'settled' }, { transaction: t });
      }
    }

    // Update connector status
    await Connector.update(
      {
        status: 'Finishing',
        currentSessionId: null,
      },
      {
        where: {
          stationId: station.id,
          connectorId: session.connectorNumber
        },
        transaction: t,
      }
    );

    await t.commit();

    // Emit real-time update
    try {
      const io = getIO();
      io.to(`station:${station.id}`).emit('session:stopped', {
        sessionId: session.id,
        stationId: station.id,
        connectorId: session.connectorNumber,
        energyDelivered,
        duration: Math.round(durationMinutes),
        totalCost,
      });

      if (session.driver) {
        io.to(`driver:${session.driver.id}`).emit('session:stopped', {
          sessionId: session.id,
          energyDelivered,
          duration: Math.round(durationMinutes),
          totalCost,
        });
      }
    } catch (socketError) {
      logger.debug('Socket emit skipped', { error: socketError.message });
    }

    logger.info('Transaction stopped', {
      chargePointId,
      sessionId: session.id,
      energyDelivered,
      totalCost,
    });

    return {
      idTagInfo: {
        status: 'Accepted',
      },
    };

  } catch (error) {
    await t.rollback();
    logger.error('StopTransaction handler error', { chargePointId, error: error.message });
    return {
      idTagInfo: { status: 'Invalid' },
    };
  }
}

module.exports = stopTransactionHandler;
