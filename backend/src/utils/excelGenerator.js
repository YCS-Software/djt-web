/**
 * Excel Generator Utility
 */

const ExcelJS = require('exceljs');
const logger = require('./logger');

/**
 * Generate Excel workbook from data
 */
async function generateExcel(data, options = {}) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EV Charging Platform';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(options.sheetName || 'Data');

    if (data.length === 0) {
      worksheet.addRow(['No data available']);
      return workbook.xlsx.writeBuffer();
    }

    // Get columns from first data item
    const columns = Object.keys(data[0]).map((key) => ({
      header: formatHeader(key),
      key,
      width: options.columnWidths?.[key] || 15,
    }));

    worksheet.columns = columns;

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    data.forEach((row, index) => {
      const excelRow = worksheet.addRow(row);

      // Alternate row colors
      if (index % 2 === 1) {
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
      }
    });

    // Add borders
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(64 + columns.length)}1`,
    };

    return workbook.xlsx.writeBuffer();

  } catch (error) {
    logger.error('Generate Excel error', { error: error.message });
    throw error;
  }
}

/**
 * Generate sessions report Excel
 */
async function generateSessionsExcel(sessions) {
  const data = sessions.map((s) => ({
    sessionId: s.id,
    station: s.station?.name || s.stationId,
    location: s.station?.location?.name || '',
    driver: s.driver?.name || s.driverId,
    startTime: formatDateTime(s.startTime),
    endTime: formatDateTime(s.endTime),
    duration: `${s.duration || 0} min`,
    energy: `${(s.energyDelivered || 0).toFixed(2)} kWh`,
    cost: `₹${(s.totalCost || 0).toFixed(2)}`,
    status: s.status,
  }));

  return generateExcel(data, {
    sheetName: 'Sessions Report',
    columnWidths: {
      sessionId: 20,
      station: 20,
      location: 20,
      driver: 15,
      startTime: 18,
      endTime: 18,
      duration: 12,
      energy: 12,
      cost: 12,
      status: 12,
    },
  });
}

/**
 * Generate transactions report Excel
 */
async function generateTransactionsExcel(transactions) {
  const data = transactions.map((t) => ({
    transactionId: t.id,
    type: t.type,
    amount: `₹${(t.amount || 0).toFixed(2)}`,
    status: t.status,
    paymentMethod: t.paymentMethod || 'N/A',
    driver: t.driver?.name || t.driverId || 'N/A',
    createdAt: formatDateTime(t.createdAt),
    razorpayId: t.razorpayPaymentId || 'N/A',
  }));

  return generateExcel(data, {
    sheetName: 'Transactions Report',
    columnWidths: {
      transactionId: 20,
      type: 15,
      amount: 12,
      status: 12,
      paymentMethod: 15,
      driver: 15,
      createdAt: 18,
      razorpayId: 20,
    },
  });
}

/**
 * Generate drivers report Excel
 */
async function generateDriversExcel(drivers) {
  const data = drivers.map((d) => ({
    driverId: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    status: d.status,
    walletBalance: `₹${(d.wallet?.balance || 0).toFixed(2)}`,
    totalSessions: d.sessionCount || 0,
    registeredAt: formatDateTime(d.createdAt),
  }));

  return generateExcel(data, {
    sheetName: 'Drivers Report',
    columnWidths: {
      driverId: 20,
      name: 20,
      email: 25,
      phone: 15,
      status: 10,
      walletBalance: 12,
      totalSessions: 12,
      registeredAt: 18,
    },
  });
}

/**
 * Generate stations report Excel
 */
async function generateStationsExcel(stations) {
  const data = stations.map((s) => ({
    stationId: s.id,
    name: s.name,
    ocppIdentity: s.ocppIdentity,
    location: s.location?.name || '',
    city: s.location?.city || '',
    status: s.status,
    isOnline: s.isOnline ? 'Yes' : 'No',
    connectors: s.connectors?.length || 0,
    lastHeartbeat: formatDateTime(s.lastHeartbeat),
  }));

  return generateExcel(data, {
    sheetName: 'Stations Report',
    columnWidths: {
      stationId: 20,
      name: 20,
      ocppIdentity: 20,
      location: 20,
      city: 15,
      status: 12,
      isOnline: 10,
      connectors: 10,
      lastHeartbeat: 18,
    },
  });
}

/**
 * Generate multi-sheet workbook
 */
async function generateMultiSheetExcel(sheets) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EV Charging Platform';
    workbook.created = new Date();

    for (const sheet of sheets) {
      const worksheet = workbook.addWorksheet(sheet.name);

      if (sheet.data.length === 0) {
        worksheet.addRow(['No data available']);
        continue;
      }

      const columns = Object.keys(sheet.data[0]).map((key) => ({
        header: formatHeader(key),
        key,
        width: 15,
      }));

      worksheet.columns = columns;

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4CAF50' },
      };

      // Add data
      sheet.data.forEach((row) => worksheet.addRow(row));
    }

    return workbook.xlsx.writeBuffer();

  } catch (error) {
    logger.error('Generate multi-sheet Excel error', { error: error.message });
    throw error;
  }
}

/**
 * Format header from camelCase
 */
function formatHeader(str) {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Format date time
 */
function formatDateTime(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

module.exports = {
  generateExcel,
  generateSessionsExcel,
  generateTransactionsExcel,
  generateDriversExcel,
  generateStationsExcel,
  generateMultiSheetExcel,
};
