/**
 * QR Code Generator Utility
 */

const QRCode = require('qrcode');
const crypto = require('crypto');
const logger = require('./logger');

/**
 * Generate QR code as data URL
 */
async function generateQRDataURL(data, options = {}) {
  try {
    const defaultOptions = {
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
      ...options,
    };

    const dataUrl = await QRCode.toDataURL(data, defaultOptions);
    return dataUrl;

  } catch (error) {
    logger.error('Generate QR data URL error', { error: error.message });
    throw error;
  }
}

/**
 * Generate QR code as buffer
 */
async function generateQRBuffer(data, options = {}) {
  try {
    const defaultOptions = {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
      ...options,
    };

    const buffer = await QRCode.toBuffer(data, defaultOptions);
    return buffer;

  } catch (error) {
    logger.error('Generate QR buffer error', { error: error.message });
    throw error;
  }
}

/**
 * Generate QR code and save to file
 */
async function generateQRFile(data, filePath, options = {}) {
  try {
    const defaultOptions = {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
      ...options,
    };

    await QRCode.toFile(filePath, data, defaultOptions);
    return filePath;

  } catch (error) {
    logger.error('Generate QR file error', { error: error.message });
    throw error;
  }
}

/**
 * Generate unique QR code string
 */
function generateUniqueCode(prefix = 'EVQR') {
  const random = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

/**
 * Generate charging URL from QR code
 */
function generateChargingURL(qrCode, baseUrl = process.env.APP_URL) {
  return `${baseUrl || 'https://app.evcharge.com'}/charge/${qrCode}`;
}

/**
 * Generate QR code for connector
 */
async function generateConnectorQR(connectorId, stationId, options = {}) {
  const qrCode = generateUniqueCode('CON');
  const url = generateChargingURL(qrCode);

  const dataUrl = await generateQRDataURL(url, options);

  return {
    code: qrCode,
    url,
    dataUrl,
    connectorId,
    stationId,
  };
}

/**
 * Generate QR code with logo overlay
 */
async function generateQRWithLogo(data, logoPath, options = {}) {
  // For logo overlay, you would typically use a canvas library
  // This is a simplified version that just generates a standard QR
  try {
    const qrDataUrl = await generateQRDataURL(data, {
      ...options,
      width: 400,
      margin: 4,
    });

    // In a full implementation, you would:
    // 1. Create a canvas
    // 2. Draw the QR code
    // 3. Overlay the logo in the center
    // 4. Return the combined image

    return qrDataUrl;

  } catch (error) {
    logger.error('Generate QR with logo error', { error: error.message });
    throw error;
  }
}

/**
 * Parse QR code data
 */
function parseQRCode(qrCode) {
  // Extract parts from QR code
  const parts = qrCode.split('_');

  if (parts.length >= 3) {
    return {
      prefix: parts[0],
      timestamp: parts[1],
      random: parts.slice(2).join('_'),
      isValid: true,
    };
  }

  return {
    isValid: false,
    raw: qrCode,
  };
}

module.exports = {
  generateQRDataURL,
  generateQRBuffer,
  generateQRFile,
  generateUniqueCode,
  generateChargingURL,
  generateConnectorQR,
  generateQRWithLogo,
  parseQRCode,
};
