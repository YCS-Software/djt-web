/**
 * PDF Generator Utility
 */

const PDFDocument = require('pdfkit');
const logger = require('./logger');

/**
 * Generate invoice PDF
 */
async function generateInvoicePDF(invoiceData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Company Info
      doc.fontSize(10);
      doc.text(invoiceData.companyName || 'EV Charging Platform', { align: 'left' });
      doc.text(invoiceData.companyAddress || '');
      doc.text(`GSTIN: ${invoiceData.gstin || 'N/A'}`);
      doc.moveDown();

      // Invoice Details
      doc.fontSize(12).text(`Invoice No: ${invoiceData.invoiceNumber}`);
      doc.text(`Date: ${new Date(invoiceData.date).toLocaleDateString()}`);
      doc.moveDown();

      // Customer Info
      doc.fontSize(10);
      doc.text('Bill To:', { underline: true });
      doc.text(invoiceData.customerName);
      doc.text(invoiceData.customerEmail);
      doc.text(invoiceData.customerPhone || '');
      doc.moveDown();

      // Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Qty', 250, tableTop, { width: 50, align: 'right' });
      doc.text('Rate', 320, tableTop, { width: 80, align: 'right' });
      doc.text('Amount', 420, tableTop, { width: 80, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Body
      doc.font('Helvetica');
      let yPosition = tableTop + 25;

      for (const item of invoiceData.items || []) {
        doc.text(item.description, 50, yPosition, { width: 180 });
        doc.text(item.quantity?.toString() || '1', 250, yPosition, { width: 50, align: 'right' });
        doc.text(`₹${item.rate?.toFixed(2) || '0.00'}`, 320, yPosition, { width: 80, align: 'right' });
        doc.text(`₹${item.amount?.toFixed(2) || '0.00'}`, 420, yPosition, { width: 80, align: 'right' });
        yPosition += 20;
      }

      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      // Totals
      if (invoiceData.subtotal) {
        doc.text('Subtotal:', 320, yPosition, { width: 80, align: 'right' });
        doc.text(`₹${invoiceData.subtotal.toFixed(2)}`, 420, yPosition, { width: 80, align: 'right' });
        yPosition += 20;
      }

      if (invoiceData.tax) {
        doc.text(`GST (${invoiceData.taxRate || 18}%):`, 320, yPosition, { width: 80, align: 'right' });
        doc.text(`₹${invoiceData.tax.toFixed(2)}`, 420, yPosition, { width: 80, align: 'right' });
        yPosition += 20;
      }

      doc.font('Helvetica-Bold');
      doc.text('Total:', 320, yPosition, { width: 80, align: 'right' });
      doc.text(`₹${invoiceData.total.toFixed(2)}`, 420, yPosition, { width: 80, align: 'right' });

      // Footer
      doc.font('Helvetica').fontSize(8);
      doc.text(
        'This is a computer generated invoice and does not require a signature.',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();

    } catch (error) {
      logger.error('Generate invoice PDF error', { error: error.message });
      reject(error);
    }
  });
}

/**
 * Generate session receipt PDF
 */
async function generateSessionReceiptPDF(sessionData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A5', margin: 30 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).text('CHARGING RECEIPT', { align: 'center' });
      doc.moveDown(0.5);

      // Session Info
      doc.fontSize(10);
      doc.text(`Receipt #: ${sessionData.id.slice(0, 8).toUpperCase()}`);
      doc.text(`Date: ${new Date(sessionData.endTime || sessionData.startTime).toLocaleString()}`);
      doc.moveDown();

      // Station Info
      doc.text('Station:', { underline: true });
      doc.text(sessionData.stationName);
      doc.text(sessionData.stationAddress || '');
      doc.moveDown();

      // Session Details
      doc.text('Session Details:', { underline: true });
      doc.text(`Start Time: ${new Date(sessionData.startTime).toLocaleString()}`);
      doc.text(`End Time: ${new Date(sessionData.endTime).toLocaleString()}`);
      doc.text(`Duration: ${sessionData.duration} minutes`);
      doc.text(`Energy Delivered: ${sessionData.energyDelivered?.toFixed(2)} kWh`);
      doc.moveDown();

      // Cost Breakdown
      doc.text('Cost Breakdown:', { underline: true });
      if (sessionData.energyCost) {
        doc.text(`Energy Cost: ₹${sessionData.energyCost.toFixed(2)}`);
      }
      if (sessionData.timeCost) {
        doc.text(`Time Cost: ₹${sessionData.timeCost.toFixed(2)}`);
      }
      if (sessionData.parkingCost) {
        doc.text(`Parking Cost: ₹${sessionData.parkingCost.toFixed(2)}`);
      }
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold');
      doc.text(`Total: ₹${sessionData.totalCost?.toFixed(2) || '0.00'}`);

      // Footer
      doc.font('Helvetica').fontSize(8);
      doc.text(
        'Thank you for using our EV Charging service!',
        30,
        doc.page.height - 40,
        { align: 'center' }
      );

      doc.end();

    } catch (error) {
      logger.error('Generate session receipt PDF error', { error: error.message });
      reject(error);
    }
  });
}

/**
 * Generate report PDF
 */
async function generateReportPDF(reportData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).text(reportData.title || 'Report', { align: 'center' });
      doc.fontSize(10).text(
        `Generated on: ${new Date().toLocaleString()}`,
        { align: 'center' }
      );
      doc.moveDown();

      // Summary Section
      if (reportData.summary) {
        doc.fontSize(14).text('Summary', { underline: true });
        doc.fontSize(10);
        for (const [key, value] of Object.entries(reportData.summary)) {
          doc.text(`${formatLabel(key)}: ${value}`);
        }
        doc.moveDown();
      }

      // Data Table
      if (reportData.data && reportData.data.length > 0) {
        doc.fontSize(14).text('Details', { underline: true });
        doc.moveDown(0.5);

        // Simple table rendering
        const columns = Object.keys(reportData.data[0]);
        const colWidth = (doc.page.width - 100) / columns.length;

        // Header row
        doc.font('Helvetica-Bold').fontSize(8);
        columns.forEach((col, i) => {
          doc.text(formatLabel(col), 50 + i * colWidth, doc.y, {
            width: colWidth,
            align: 'left',
            continued: i < columns.length - 1,
          });
        });
        doc.moveDown();

        // Data rows
        doc.font('Helvetica');
        for (const row of reportData.data.slice(0, 50)) { // Limit to 50 rows
          const y = doc.y;
          if (y > doc.page.height - 100) {
            doc.addPage();
          }

          columns.forEach((col, i) => {
            const value = row[col]?.toString() || '';
            doc.text(value.slice(0, 20), 50 + i * colWidth, doc.y, {
              width: colWidth,
              align: 'left',
              continued: i < columns.length - 1,
            });
          });
          doc.moveDown(0.5);
        }
      }

      // Footer
      doc.fontSize(8);
      doc.text(
        `Page 1 | ${reportData.title || 'Report'}`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );

      doc.end();

    } catch (error) {
      logger.error('Generate report PDF error', { error: error.message });
      reject(error);
    }
  });
}

/**
 * Format label from camelCase
 */
function formatLabel(str) {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

module.exports = {
  generateInvoicePDF,
  generateSessionReceiptPDF,
  generateReportPDF,
};
