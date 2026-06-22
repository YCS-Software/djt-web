/**
 * OCPP Authorize Handler
 */

const { RfidCard, EvDriver, DriverWallet } = require('../../models');
const logger = require('../../utils/logger');

/**
 * Handle Authorize request from charge point
 */
async function authorizeHandler(chargePointId, payload) {
  const { idTag } = payload;

  logger.info('Authorize received', { chargePointId, idTag });

  try {
    // Find RFID card
    const rfidCard = await RfidCard.findOne({
      where: { cardNumber: idTag },
      include: [
        {
          model: EvDriver,
          as: 'driver',
          include: [
            {
              model: DriverWallet,
              as: 'wallet',
            },
          ],
        },
      ],
    });

    if (!rfidCard) {
      logger.warn('Unknown idTag', { chargePointId, idTag });
      return {
        idTagInfo: {
          status: 'Invalid',
        },
      };
    }

    // Check card status
    if (rfidCard.status !== 'active') {
      logger.warn('Card not active', { chargePointId, idTag, status: rfidCard.status });
      return {
        idTagInfo: {
          status: 'Blocked',
        },
      };
    }

    // Check expiry
    if (rfidCard.expiryDate && new Date(rfidCard.expiryDate) < new Date()) {
      logger.warn('Card expired', { chargePointId, idTag });
      return {
        idTagInfo: {
          status: 'Expired',
          expiryDate: rfidCard.expiryDate.toISOString(),
        },
      };
    }

    // Check driver status
    if (!rfidCard.driver || rfidCard.driver.status !== 'active') {
      logger.warn('Driver not active', { chargePointId, idTag });
      return {
        idTagInfo: {
          status: 'Blocked',
        },
      };
    }

    // Check wallet balance (minimum required)
    const minimumBalance = 50; // Configurable
    if (rfidCard.driver.wallet && rfidCard.driver.wallet.balance < minimumBalance) {
      logger.warn('Insufficient balance', {
        chargePointId,
        idTag,
        balance: rfidCard.driver.wallet.balance
      });
      return {
        idTagInfo: {
          status: 'ConcurrentTx', // Using this as "low balance" indicator
        },
      };
    }

    // Update last used
    await rfidCard.update({ lastUsed: new Date() });

    logger.info('Authorization accepted', { chargePointId, idTag, driverId: rfidCard.driver.id });

    return {
      idTagInfo: {
        status: 'Accepted',
        expiryDate: rfidCard.expiryDate ? rfidCard.expiryDate.toISOString() : undefined,
        parentIdTag: rfidCard.parentIdTag || undefined,
      },
    };

  } catch (error) {
    logger.error('Authorize handler error', { chargePointId, idTag, error: error.message });
    return {
      idTagInfo: {
        status: 'Invalid',
      },
    };
  }
}

module.exports = authorizeHandler;
