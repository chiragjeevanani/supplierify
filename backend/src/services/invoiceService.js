import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import settingsService from './settingsService.js';
import { resolvePublicPhone } from '../utils/phone.js';
import { splitGst } from '../utils/gst.js';
import { hsnFor } from '../utils/hsn.js';
import { stateCodeOf, SELLER_STATE_CODE } from '../constants/indiaStates.js';

/** Seller (legal entity) details come from Admin > Settings; these are the fallbacks. */
const sellerFrom = (settings = {}) => ({
  name: settings.companyName || 'Bhavana Enterprises LLP',
  gstin: settings.companyGstin || '27ABGFB3485P1ZT',
  address: settings.companyAddress || 'Navin Sheva, Uran, Navi Mumbai',
  dispatchAddress: settings.dispatchAddress || '',
  fssai: String(settings.fssaiNumber || '').trim()
});

class InvoiceService {
  /**
   * Format Date to standard DD MMM YYYY string (e.g. 16 Sep 2026)
   */
  _formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Format Currency amount cleanly (Rs. XXX.XX)
   */
  _formatCurrency(amount) {
    const num = Number(amount) || 0;
    return `Rs. ${num.toFixed(2)}`;
  }

  /**
   * Generate Invoice PDF stream for an order
   * @param {object} order - Stored Mongoose Order document or POJO
   * @param {object} [customSettings] - Optional store settings override
   * @returns {Promise<PDFDocument>} - PDFDocument readable stream
   */
  async generateInvoicePdf(order, customSettings = null) {
    const settings = customSettings || (await settingsService.getSettings());

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      info: {
        Title: `Invoice - ${order.orderNumber}`,
        Author: settings.storeName || 'Supplierfy',
        Subject: `Commercial Tax Invoice for Order #${order.orderNumber}`,
        Keywords: 'invoice, wholesale, receipt, tax'
      }
    });

    const primaryColor = '#0E2A1B'; // Dry Fruit Wholesale Forest Green
    const goldColor = '#D4AF37';    // Dry Fruit Wholesale Royal Gold
    const textDark = '#1E293B';      // Slate 800
    const textMuted = '#64748B';     // Slate 500
    const borderColor = '#E2E8F0';   // Slate 200
    const bgLight = '#F8FAFC';       // Slate 50

    const invoiceNumber = `INV-${order.orderNumber}`;
    const orderDate = this._formatDate(order.createdAt);
    const invoiceDate = this._formatDate(order.payment?.paidAt || order.createdAt);
    const rawMethod = order.payment?.method || 'COD';
    const isPartialCod = rawMethod === 'PARTIAL_COD';
    const paymentMethod = isPartialCod ? 'Part online + COD' : rawMethod;
    const advancePaid = Number(order.payment?.advancePaid) || 0;
    const balanceDue = Number(order.payment?.balanceDue) || 0;
    const isCancelled = String(order.status || '').toUpperCase() === 'CANCELLED';
    // A cancelled order must read CANCELLED on the invoice, whatever its payment status was
    const paymentStatus = isCancelled ? 'CANCELLED' : (order.payment?.status || 'PENDING').toUpperCase();
    const transactionId = order.payment?.transactionId || '';

    // Locate brand logo
    const logoCandidates = [
      path.resolve(process.cwd(), 'src/assets/Dry Fruit WholesaleLogo.png'),
      path.resolve(process.cwd(), 'assets/Dry Fruit WholesaleLogo.png'),
      path.resolve(process.cwd(), '../frontend/public/Dry Fruit WholesaleLogo.png'),
      path.resolve(process.cwd(), 'frontend/public/Dry Fruit WholesaleLogo.png'),
      path.resolve(process.cwd(), 'public/Dry Fruit WholesaleLogo.png')
    ];
    const logoPath = logoCandidates.find(p => fs.existsSync(p));

    // =========================================================================
    // 1. TOP HEADER BANNER (WHITE BACKGROUND WITH OFFICIAL LOGO)
    // =========================================================================
    const headerY = 36;
    const headerHeight = 70;

    // White Header Card with subtle border
    doc
      .rect(40, headerY, 515, headerHeight)
      .fillAndStroke('#FFFFFF', borderColor);

    // Brand Logo on Left (Replaces static text)
    if (logoPath) {
      try {
        doc.image(logoPath, 48, headerY + 4, {
          height: headerHeight - 8,
          width: headerHeight - 8,
          fit: [headerHeight - 8, headerHeight - 8]
        });
      } catch (imgErr) {
        console.warn('[InvoiceService] Could not render logo image, using text fallback:', imgErr.message);
        doc
          .fillColor(primaryColor)
          .fontSize(22)
          .font('Helvetica-Bold')
          .text((settings.storeName || 'Supplierfy').toUpperCase(), 55, headerY + 14);

        doc
          .fillColor(goldColor)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text(sellerFrom(settings).name.toUpperCase(), 55, headerY + 40, { characterSpacing: 1 });
      }
    } else {
      doc
        .fillColor(primaryColor)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text((settings.storeName || 'Supplierfy').toUpperCase(), 55, headerY + 14);

      doc
        .fillColor(goldColor)
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text(sellerFrom(settings).name.toUpperCase(), 55, headerY + 40, { characterSpacing: 1 });
    }

    // Document Header Right (Tax Invoice, Invoice No, Date on White)
    doc
      .fillColor(primaryColor)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('TAX INVOICE', 350, headerY + 10, { align: 'right', width: 190 });

    doc
      .fillColor(primaryColor)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(`Invoice No: ${invoiceNumber}`, 350, headerY + 31, { align: 'right', width: 190 });

    doc
      .fillColor(textMuted)
      .fontSize(8.5)
      .font('Helvetica')
      .text(`Date: ${invoiceDate}`, 350, headerY + 46, { align: 'right', width: 190 });

    doc.moveDown();

    // =========================================================================
    // 2. META DATA HIGHLIGHT BAR
    // =========================================================================
    const metaY = 115;
    doc
      .rect(40, metaY, 515, 26)
      .fill(bgLight)
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(textDark)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(`Order No: `, 50, metaY + 8, { continued: true })
      .font('Helvetica')
      .text(`#${order.orderNumber}    |    `, { continued: true })
      .font('Helvetica-Bold')
      .text(`Order Date: `, { continued: true })
      .font('Helvetica')
      .text(`${orderDate}    |    `, { continued: true })
      .font('Helvetica-Bold')
      .text(`Payment Method: `, { continued: true })
      .font('Helvetica')
      .text(`${paymentMethod}    |    `, { continued: true })
      .font('Helvetica-Bold')
      .text(`Status: `, { continued: true })
      .font('Helvetica-Bold')
      .fillColor(isCancelled ? '#DC2626' : paymentStatus === 'PAID' ? '#059669' : '#D97706')
      .text(paymentStatus.replace(/_/g, ' '));

    // =========================================================================
    // 3. SELLER & BUYER DETAILS (TWO COLUMNS)
    // =========================================================================
    const addressY = 152;
    const colWidth = 248;
    const boxH = 142;
    const seller = sellerFrom(settings);

    // ---- Seller box (left)
    doc.rect(40, addressY, colWidth, boxH).strokeColor(borderColor).lineWidth(0.5).stroke();
    doc.rect(40, addressY, colWidth, 18).fill(primaryColor);
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('SOLD BY', 48, addressY + 5);

    const storeName = settings.storeName || 'Supplierfy';
    const storeEmail = settings.storeEmail || settings.supportEmail || '';
    // Phone: the number the admin saved in Settings; until then the store's WhatsApp number
    const storePhone = resolvePublicPhone([settings.storePhone, settings.supportPhone], settings.whatsappNumber);

    let sy = addressY + 24;
    const put = (x, width, str, { bold = false, color = textMuted } = {}) => {
      if (!str) return;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor(color).text(str, x, sy, { width });
      sy = doc.y + 2.5;
    };
    put(48, colWidth - 16, storeName, { bold: true, color: textDark });
    put(48, colWidth - 16, seller.name, { bold: true, color: textDark });
    put(48, colWidth - 16, seller.gstin ? `GSTIN: ${seller.gstin}` : '', { color: textDark });
    put(48, colWidth - 16, seller.address ? `Registered address: ${seller.address}` : '');
    put(48, colWidth - 16, seller.dispatchAddress ? `Dispatch from: ${seller.dispatchAddress}` : '');
    put(48, colWidth - 16, seller.fssai ? `FSSAI Lic. No.: ${seller.fssai}` : '');
    put(48, colWidth - 16, storeEmail ? `Email: ${storeEmail}` : '');
    put(48, colWidth - 16, storePhone ? `Phone: ${storePhone}` : '');

    // ---- Buyer box (right)
    const rightColX = 307;
    doc.rect(rightColX, addressY, colWidth, boxH).strokeColor(borderColor).lineWidth(0.5).stroke();
    doc.rect(rightColX, addressY, colWidth, 18).fill(primaryColor);
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('BILLED TO & DELIVER TO', rightColX + 8, addressY + 5);

    const shipAddr = order.shippingAddress || {};
    const custName = shipAddr.fullName || 'Valued Customer';
    const custPhone = shipAddr.phoneNumber || shipAddr.phone || 'N/A';
    const street = [shipAddr.addressLine1, shipAddr.addressLine2, shipAddr.landmark].filter(Boolean).join(', ') || 'Address not provided';
    const cityStatePin = [shipAddr.city, shipAddr.state].filter(Boolean).join(', ') + ` - ${shipAddr.postalCode || shipAddr.pincode || ''}`;
    const buyerGstin = order.buyer?.gstin || '';
    const buyerCompany = order.buyer?.companyName || '';
    // Place of supply: the buyer's GSTIN state when given, otherwise the delivery state
    const buyerStateCode = (buyerGstin && buyerGstin.slice(0, 2)) || stateCodeOf(shipAddr.state);
    const intraState = !buyerStateCode || buyerStateCode === SELLER_STATE_CODE;

    sy = addressY + 24;
    put(rightColX + 8, colWidth - 16, buyerCompany || custName, { bold: true, color: textDark });
    put(rightColX + 8, colWidth - 16, buyerCompany ? `Attn: ${custName}` : '');
    put(rightColX + 8, colWidth - 16, buyerGstin ? `GSTIN: ${buyerGstin}` : '', { color: textDark });
    put(rightColX + 8, colWidth - 16, street);
    put(rightColX + 8, colWidth - 16, cityStatePin);
    put(rightColX + 8, colWidth - 16, `Contact: ${custPhone}`);
    put(rightColX + 8, colWidth - 16, shipAddr.state ? `Place of supply: ${shipAddr.state}${buyerStateCode ? ` (${buyerStateCode})` : ''}` : '', { color: textDark });

    // =========================================================================
    // 4. ITEMS TABLE
    // =========================================================================
    const tableTop = addressY + boxH + 14;

    // Table Header
    doc
      .rect(40, tableTop, 515, 20)
      .fill(primaryColor);

    doc
      .fillColor('#FFFFFF')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('#', 46, tableTop + 6, { width: 16 })
      .text('ITEM DESCRIPTION', 64, tableTop + 6, { width: 176 })
      .text('HSN', 244, tableTop + 6, { width: 44, align: 'center' })
      .text('UNIT', 290, tableTop + 6, { width: 50, align: 'center' })
      .text('RATE', 344, tableTop + 6, { width: 62, align: 'right' })
      .text('QTY', 410, tableTop + 6, { width: 36, align: 'center' })
      .text('TOTAL', 470, tableTop + 6, { width: 77, align: 'right' });

    let currentY = tableTop + 20;
    const items = order.items || [];

    items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const rowHeight = 22;

      // Alternating row background
      if (isEven) {
        doc.rect(40, currentY, 515, rowHeight).fill(bgLight);
      }

      // Border bottom
      doc
        .rect(40, currentY + rowHeight - 0.5, 515, 0.5)
        .fill(borderColor);

      const itemQty = item.qty || 1;
      const unitPrice = item.price || 0;
      const itemSubtotal = item.subtotal || unitPrice * itemQty;
      const weightLabel = item.weight || '1 kg';
      const hsn = String(item.hsnCode || '').trim() || hsnFor(item) || '-';

      doc
        .fillColor(textDark)
        .fontSize(8)
        .font('Helvetica')
        .text(String(index + 1), 46, currentY + 6, { width: 16 })
        .font('Helvetica-Bold')
        .text(item.name || 'Product', 64, currentY + 6, { width: 176, ellipsis: true })
        .font('Helvetica')
        .text(hsn, 244, currentY + 6, { width: 44, align: 'center' })
        .text(weightLabel, 290, currentY + 6, { width: 50, align: 'center' })
        .text(this._formatCurrency(unitPrice), 344, currentY + 6, { width: 62, align: 'right' })
        .text(String(itemQty), 410, currentY + 6, { width: 36, align: 'center' })
        .font('Helvetica-Bold')
        .text(this._formatCurrency(itemSubtotal), 470, currentY + 6, { width: 77, align: 'right' });

      currentY += rowHeight;
    });

    // =========================================================================
    // 5. SUMMARY & FINANCIAL BREAKDOWN
    // =========================================================================
    const pricing = order.pricing || {};
    const subtotal = pricing.subtotal || 0;
    const discount = pricing.discount || 0;
    const couponCode = pricing.couponCode || pricing.couponDetails?.code || null;
    const deliveryFee = pricing.deliveryFee || 0;
    const tax = pricing.tax || 0;
    const total = pricing.total || 0;

    const summaryY = Math.max(currentY + 15, 410);

    // Left info box: Notes & Dispatch
    const leftBoxWidth = 270;
    doc
      .rect(40, summaryY, leftBoxWidth, 120)
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(primaryColor)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('LOGISTICS & DISPATCH INFORMATION', 50, summaryY + 8);

    doc
      .fillColor(textMuted)
      .fontSize(7.5)
      .font('Helvetica')
      .text(
        isPartialCod
          ? `Paid online: ${this._formatCurrency(advancePaid)}  |  ${balanceDue > 0 ? 'Balance on delivery' : 'Balance paid'}: ${this._formatCurrency(balanceDue > 0 ? balanceDue : Math.max(0, (order.pricing?.total || 0) - advancePaid))}`
          : `Fulfillment Channel: Standard Express Courier`,
        50,
        summaryY + 22
      )
      .text(`Courier Partner: ${order.courierName || 'Delhivery Express Network'}`, 50, summaryY + 34)
      .text(`AWB Tracking Number: ${order.awbNumber || 'Generating / Local Dispatch'}`, 50, summaryY + 46)
      .text(`Transaction Ref: ${transactionId || 'Internal Order Gateway Ref'}`, 50, summaryY + 58)
      .text(`Order Status: ${order.status}`, 50, summaryY + 70);

    doc
      .fillColor('#059669')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('100% Quality Guaranteed • Hygienically Packed • Authentic Product', 50, summaryY + 88);

    // Right Summary Calculations Box
    const sumBoxX = 325;
    const sumBoxWidth = 230;

    doc
      .rect(sumBoxX, summaryY, sumBoxWidth, 120)
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .stroke();

    const addSummaryRow = (label, value, yPos, isNegative = false, isBold = false) => {
      doc
        .fontSize(8)
        .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(isNegative ? '#059669' : textDark)
        .text(label, sumBoxX + 12, yPos, { width: 120 })
        .text(value, sumBoxX + 130, yPos, { width: 88, align: 'right' });
    };

    let calcY = summaryY + 8;
    addSummaryRow('Items Subtotal:', this._formatCurrency(subtotal), calcY);
    calcY += 15;

    if (discount > 0) {
      const discLabel = couponCode ? `Coupon (${couponCode}):` : 'Promotional Discount:';
      addSummaryRow(discLabel, `-${this._formatCurrency(discount)}`, calcY, true, true);
      calcY += 15;
    }

    const deliveryText = deliveryFee === 0 ? 'FREE' : this._formatCurrency(deliveryFee);
    addSummaryRow('Delivery & Shipping:', deliveryText, calcY, deliveryFee === 0);
    calcY += 15;

    const gstRate = settings.gstRate || 5;
    const gst = splitGst(tax, intraState);
    if (intraState) {
      addSummaryRow(`CGST (${gstRate / 2}%):`, this._formatCurrency(gst.cgst), calcY);
      calcY += 15;
      addSummaryRow(`SGST (${gstRate / 2}%):`, this._formatCurrency(gst.sgst), calcY);
      calcY += 15;
    } else {
      addSummaryRow(`IGST (${gstRate}%):`, this._formatCurrency(gst.igst), calcY);
      calcY += 15;
    }

    // Grand Total Row
    doc
      .rect(sumBoxX, summaryY + 90, sumBoxWidth, 30)
      .fill(primaryColor);

    doc
      .fillColor('#FFFFFF')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('FINAL AMOUNT:', sumBoxX + 12, summaryY + 99)
      .fillColor(goldColor)
      .fontSize(11)
      .text(this._formatCurrency(total), sumBoxX + 120, summaryY + 98, { width: 98, align: 'right' });

    // =========================================================================
    // 6. FOOTER & DECLARATIONS
    // =========================================================================
    const footerY = Math.max(560, summaryY + 120 + 24);

    doc
      .rect(40, footerY, 515, 0.5)
      .fill(borderColor);

    doc
      .fillColor(textMuted)
      .fontSize(7)
      .font('Helvetica')
      .text('DECLARATION & TERMS:', 40, footerY + 8)
      .text(
        '1. This is a computer-generated tax invoice and does not require a physical signature.\n' +
        '2. All disputes are subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.\n' +
        '3. For returns, refund status, or corporate gifting inquiries, please write to ' + (storeEmail || 'our support team') + '.',
        40,
        footerY + 18,
        { width: 360, lineGap: 2 }
      );

    // Authorized Seal Stamp Placeholder
    doc
      .rect(420, footerY + 8, 135, 48)
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(primaryColor)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text(`FOR ${seller.name.toUpperCase()}`, 425, footerY + 12, { width: 125, align: 'center' });

    doc
      .fillColor(goldColor)
      .fontSize(6.5)
      .font('Helvetica-Oblique')
      .text('Authorised Signatory', 425, footerY + 44, { width: 125, align: 'center' });

    // CANCELLED watermark across the page
    if (isCancelled) {
      doc.save();
      doc.rotate(-35, { origin: [297, 420] });
      doc.fillColor('#DC2626').opacity(0.14).font('Helvetica-Bold').fontSize(70);
      doc.text('CANCELLED', 40, 395, { width: 520, align: 'center', lineBreak: false });
      doc.restore();
    }

    // Finalize PDF Document
    doc.end();
    return doc;
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
