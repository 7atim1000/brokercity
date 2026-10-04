import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import logo from '../../../assets/images/logogo-removebg-old.png';
import stamp from '../../../assets/images/stamp.jpeg';
import { formatAmountInWords } from '../../../utils/numberToArabic';

import { FaPrint, FaTimes, FaFilePdf } from 'react-icons/fa';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// =============================================================
// FONT LINK
// =============================================================

const ARABIC_FONT_LINK = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
`;

// =============================================================
// PRINT / VOUCHER STYLES
// =============================================================

const PRINT_STYLES = `
.receipt-paper {
  font-family: 'Cairo', Arial, Helvetica, sans-serif;
  color: #111;
  background: #fff;
}

.receipt-paper * { box-sizing: border-box; }

/* =====================================================
   ARABIC TEXT — force Cairo + proper shaping
   ===================================================== */

.voucher-company-ar,
.voucher-title-ar,
.label-ar,
.voucher-payment-labels .ar,
.voucher-footer-services-ar,
.voucher-footer-contact-ar {
  font-family: 'Cairo', Arial, sans-serif !important;
  font-feature-settings: "liga" 1, "calt" 1, "init" 1, "medi" 1, "fina" 1, "isol" 1;
  -webkit-font-feature-settings: "liga" 1, "calt" 1;
  text-rendering: optimizeLegibility;
}

/* =====================================================
   FORM FIELDS
   ===================================================== */

.voucher-field {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.voucher-field-label {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  white-space: nowrap;
  font-size: 10px;
  font-weight: 800;
  color: #111;
  padding-left: 4px;
  text-align: right;
}

.voucher-field-label .label-ar { font-weight: 900; color: #111; }
.voucher-field-label .label-en { font-weight: 700; color: #111; }
.voucher-field-label .label-sep { color: #a47d52; font-weight: 900; }

.voucher-field-box {
  flex: 1 1 auto;
  min-height: 22px;
  border: 1px solid #f8f7f5;
  background: #f8f7f5;
  padding: 2px 8px;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #111;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.voucher-field-box.is-rtl {
  justify-content: flex-start;
  direction: rtl;
  text-align: right;
}

.voucher-field-box.is-ltr {
  justify-content: flex-start;
  direction: ltr;
  text-align: left;
}

.voucher-amount-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
  width: 100%;
}

.voucher-amount-value {
  flex: 1 1 auto;
  min-height: 22px;
  border: 1px solid #f8f7f5;
  background: #f8f7f5;
  padding: 2px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  color: #111;
  letter-spacing: 0.3px;
}

.voucher-amount-unit {
  flex: 0 0 auto;
  min-width: 70px;
  min-height: 22px;
  border: 1px solid #f8f7f5;
  background: #f8f7f5;
  padding: 2px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 900;
  color: #111;
}

/* =====================================================
   PAYMENT METHOD
   ===================================================== */

.voucher-payment-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  flex: 1 1 auto;
  min-height: 22px;
  border: 1px solid #f8f7f5;
  background: #f8f7f5;
  padding: 2px 10px;
}

.voucher-payment-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 800;
  color: #111;
}

.voucher-payment-box {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 1.5px solid #111;
  background: #ffffff;
  position: relative;
}

.voucher-payment-box.is-checked::after {
  content: "";
  position: absolute;
  left: 1px;
  top: 1px;
  width: 6px;
  height: 6px;
  background: #111;
}

.voucher-payment-labels {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.voucher-payment-labels .ar { font-size: 10px; font-weight: 900; }
.voucher-payment-labels .en { font-size: 9px; font-weight: 700; }

/* =====================================================
   SIGNATURES
   ===================================================== */

.voucher-signatures {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
}

.voucher-signature-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.voucher-signature-label {
  font-size: 10px;
  font-weight: 800;
  color: #111;
  text-align: center;
}

.voucher-signature-box {
  min-height: 60px;
  border: 1px solid #f8f7f5;
  background: #ffffff;
}

.voucher-signature-box.with-stamp {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  overflow: hidden;
}

.voucher-signature-stamp {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 110px;
  max-height: 90px;
  object-fit: contain;
  margin: 0 auto;
}

/* =====================================================
   TITLE
   ===================================================== */

.voucher-title-ar {
  font-size: 38px;
  font-weight: 900;
  color: #1e3a5f;
  line-height: 1.05;
  letter-spacing: 0;
}

.voucher-title-en {
  font-size: 26px;
  font-weight: 900;
  color: #a47d52;
  line-height: 1;
  letter-spacing: 1.5px;
}

/* =====================================================
   HEADER — wordmark LEFT, logo RIGHT (RTL flow)
   Logo is intentionally LARGER than the wordmark.
   ===================================================== */

.voucher-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px;
  width: 100%;
}

.voucher-logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: visible;
}

/* Base logo box — 115px layout height, scaled visually to 1.9× */
.voucher-logo-img {
  display: block;
  height: 115px;
  width: auto;
  max-width: none;
  object-fit: contain;
  object-position: center;
  margin: 0;
  transform: scale(1.9);
  transform-origin: center center;
}

.voucher-company-wordmark {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
  text-align: left;
  max-width: 340px;
}

/* Arabic — navy (matches logo Arabic) — smaller than the logo */
.voucher-company-ar {
  font-size: 23px;
  font-weight: 900;
  color: #1e3a5f;
  line-height: 1;
  letter-spacing: 0;
  direction: rtl;
  text-align: right;
  width: 100%;
}

/* English — tan/gold (matches logo "BROKER CITY") */
.voucher-company-en {
  font-size: 12px;
  font-weight: 900;
  color: #a47d52;
  line-height: 1;
  letter-spacing: 1.2px;
  direction: ltr;
  text-align: left;
  width: 100%;
}

/* =====================================================
   FOOTER
   ===================================================== */

.voucher-footer {
  width: 100%;
  margin: 0 !important;
  margin-bottom: 0 !important;
  background: #f8f7f5;
  border-top: 2px solid #a47d52;
  overflow: hidden;
}

.voucher-footer-services {
  width: 100%;
  padding: 10px 12px;
  text-align: center;
  color: #a47d52;
  font-size: 10px;
  line-height: 1.6;
  font-weight: 800;
  letter-spacing: 0.2px;
  border-bottom: 1px solid #a47d52;
  direction: rtl;
}

/* Arabic footer services span — uses Cairo + Arabic shaping */
.voucher-footer-services-ar {
  display: inline-block;
  direction: rtl;
  text-align: right;
  font-weight: 900;
  color: #a47d52;
  font-size: 10px;
  line-height: 1.6;
  letter-spacing: 0;
  unicode-bidi: embed;
}

/* English footer services span */
.voucher-footer-services-en {
  display: inline-block;
  direction: ltr;
  text-align: left;
  font-weight: 800;
  color: #a47d52;
  font-size: 10px;
  line-height: 1.6;
}

.voucher-footer-contact {
  width: 100%;
  margin: 0 !important;
  margin-bottom: 0 !important;
  padding: 10px 12px 8px;
  text-align: center;
  color: #111;
  font-size: 9.5px;
  line-height: 1.7;
  font-weight: 600;
}

.voucher-footer-contact-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px 18px;
  margin: 0 !important;
  margin-bottom: 0 !important;
}

/* Arabic footer contact span */
.voucher-footer-contact-ar {
  direction: rtl;
  text-align: right;
  unicode-bidi: embed;
}

.voucher-footer-company {
  margin-top: 4px;
  margin-bottom: 0 !important;
  color: #a47d52;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 6mm 8mm 6mm 8mm;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    min-height: 100% !important;
    background: #fff !important;
  }

  body { overflow: visible !important; }

  #deposit-voucher-print {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #111 !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  .voucher-no-print { display: none !important; }

  .voucher-footer {
    margin-bottom: 0 !important;
    background: #f8f7f5 !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;

// =============================================================
// SHARED STYLES (used identically in print + pdf)
// =============================================================

const SHARED_VOUCHER_STYLES = `
* { box-sizing: border-box; }

html, body {
  margin: 0 !important;
  padding: 0 !important;
  background: #ffffff !important;
}

.receipt-paper,
.voucher-paper,
#voucher-print-copy,
#voucher-pdf-copy {
  display: block !important;
  position: static !important;
  width: 100% !important;
  max-width: 794px !important;
  margin: 0 auto !important;
  padding: 20px 20px 0 20px !important;
  background: #ffffff !important;
  color: #111111 !important;
  font-family: 'Cairo', Arial, Helvetica, sans-serif !important;
  direction: rtl !important;
  overflow: visible !important;
  transform: none !important;
  scale: 1 !important;
  visibility: visible !important;
  opacity: 1 !important;
  border: none !important;
  box-shadow: none !important;
}

.receipt-paper *,
.voucher-paper *,
#voucher-print-copy *,
#voucher-pdf-copy * {
  visibility: visible !important;
  box-sizing: border-box !important;
}

/* Force Cairo on Arabic + footer spans */
.voucher-company-ar,
.voucher-title-ar,
.label-ar,
.voucher-payment-labels .ar,
.voucher-footer-services-ar,
.voucher-footer-contact-ar,
#voucher-print-copy .voucher-company-ar,
#voucher-print-copy .voucher-title-ar,
#voucher-print-copy .label-ar,
#voucher-print-copy .voucher-footer-services-ar,
#voucher-print-copy .voucher-footer-contact-ar,
#voucher-pdf-copy .voucher-company-ar,
#voucher-pdf-copy .voucher-title-ar,
#voucher-pdf-copy .label-ar,
#voucher-pdf-copy .voucher-footer-services-ar,
#voucher-pdf-copy .voucher-footer-contact-ar {
  font-family: 'Cairo', Arial, sans-serif !important;
  font-feature-settings: "liga" 1, "calt" 1, "init" 1, "medi" 1, "fina" 1, "isol" 1;
  -webkit-font-feature-settings: "liga" 1, "calt" 1;
  text-rendering: optimizeLegibility;
}

.receipt-paper .bg-\\[\\#f8f7f5\\],
.voucher-paper .bg-\\[\\#f8f7f5\\],
#voucher-print-copy .bg-\\[\\#f8f7f5\\],
#voucher-pdf-copy .bg-\\[\\#f8f7f5\\] {
  background: #f8f7f5 !important;
}

.receipt-paper .bg-white,
.voucher-paper .bg-white,
#voucher-print-copy .bg-white,
#voucher-pdf-copy .bg-white {
  background: #ffffff !important;
}

img { max-width: 100% !important; }

.mx-auto {
  margin-left: auto !important;
  margin-right: auto !important;
}
`;

// =============================================================
// COMPONENT
// =============================================================

const Voucher = ({ transaction = {}, onClose }) => {
  const printRef = useRef(null);
  const [fetchedBankName, setFetchedBankName] = useState('');

  // =========================================================
  // HELPERS  (declared BEFORE any useEffect that uses them)
  // =========================================================

  const safeValue = (value, fallback = '-') =>
    value === null || value === undefined || value === ''
      ? fallback
      : value;

  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') {
      return (
        value.name ||
        value.bank_name ||
        value.cashbox_name ||
        value.account_name ||
        value.title ||
        value.username ||
        value.full_name ||
        value.fullName ||
        value.description ||
        value.id ||
        '-'
      );
    }
    return value;
  };

  const getObjectName = (value) => renderValue(value);

  const getTransactionNumber = () =>
    transaction.transaction_no ||
    transaction.transaction_number ||
    transaction.voucher_no ||
    transaction.voucher_number ||
    transaction.receipt_no ||
    transaction.receipt_number ||
    transaction.number ||
    transaction.id ||
    'TRX-260914-0AAF';

  const getTRN = () =>
    transaction.trn ||
    transaction.tax_registration_number ||
    transaction.company_trn ||
    transaction.company_tax_number ||
    getTransactionNumber();

  const getCurrency = () =>
    transaction.currency || transaction.currency_code || 'AED';

  const getPaymentMethod = () => {
    const method = transaction.payment_method;
    if (method === 'banks' || method === 'bank') return 'transfer';
    if (method === 'cash') return 'cash';
    if (method === 'cheque' || method === 'check') return 'cheque';
    if (method === 'transfer' || method === 'bank_transfer') return 'transfer';
    return '';
  };

  const getBankName = () => {
    if (fetchedBankName) return fetchedBankName;
    if (transaction.bank_name && typeof transaction.bank_name !== 'object')
      return transaction.bank_name;
    if (transaction.bank_name && typeof transaction.bank_name === 'object')
      return (
        transaction.bank_name.name ||
        transaction.bank_name.bank_name ||
        transaction.bank_name.title ||
        '-'
      );
    if (transaction.bank && typeof transaction.bank === 'object')
      return (
        transaction.bank.name ||
        transaction.bank.bank_name ||
        transaction.bank.title ||
        '-'
      );
    return '-';
  };

  const getPersonName = () =>
    transaction.person_deliver ||
    transaction.person_name ||
    transaction.customer_name ||
    transaction.client_name ||
    transaction.customer?.name ||
    transaction.client?.name ||
    transaction.customer?.full_name ||
    transaction.client?.full_name ||
    '-';

  const getAmount = () => {
    const amount = Number(
      transaction.amount ??
        transaction.total_amount ??
        transaction.received_amount ??
        0
    );
    return Number.isNaN(amount) ? 0 : amount;
  };

  const formatAmount = (amount = getAmount()) =>
    Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (value) => {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  };

  const getStatement = () =>
    transaction.statement ||
    transaction.description ||
    transaction.narration ||
    transaction.notes ||
    '';

  const getPropertyName = () =>
    transaction.property_name ||
    transaction.property?.name ||
    transaction.project_name ||
    transaction.contract_property ||
    '';

  const getUnitNumber = () =>
    transaction.unit_no ||
    transaction.unit_number ||
    transaction.unit?.number ||
    transaction.property?.unit_no ||
    '';

  const getContractNumber = () =>
    transaction.contract_no ||
    transaction.contract_number ||
    transaction.contract_id ||
    transaction.reference_contract ||
    '';

  const getReferenceNumber = () =>
    transaction.reference_no ||
    transaction.reference_number ||
    transaction.ref_no ||
    '';

  // =========================================================
  // FETCH BANK NAME
  // =========================================================
  useEffect(() => {
    const bankValue = transaction?.bank;
    const bankId =
      bankValue && typeof bankValue === 'object' ? bankValue.id : bankValue;

    if (!bankId) {
      setFetchedBankName('');
      return;
    }

    if (typeof bankValue === 'object') {
      const existingName =
        bankValue.name || bankValue.bank_name || bankValue.title;
      if (existingName) {
        setFetchedBankName(existingName);
        return;
      }
    }

    let cancelled = false;

    const fetchBankName = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${BASE}/api/banks/${bankId}/`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!cancelled) {
          setFetchedBankName(
            data?.name || data?.bank_name || data?.title || ''
          );
        }
      } catch (error) {
        console.error('Error fetching bank name:', error);
        if (!cancelled) setFetchedBankName('');
      }
    };

    fetchBankName();

    return () => {
      cancelled = true;
    };
  }, [transaction?.bank]);

  const paymentMethod = getPaymentMethod();

  // =========================================================
  // PRINT
  // =========================================================
  const handlePrint = () => {
    if (!printRef.current) return;
    const voucherElement = printRef.current.cloneNode(true);
    if (!voucherElement) return;

    voucherElement
      .querySelectorAll('.voucher-no-print')
      .forEach((el) => el.remove());

    voucherElement.id = 'voucher-print-copy';

    const printWindow = window.open(
      '',
      '_blank',
      'width=900,height=1200,scrollbars=yes,resizable=yes'
    );

    if (!printWindow) {
      window.alert(
        'Please allow pop-ups for this website to print the voucher.'
      );
      return;
    }

    const styleElements = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    );
    const copiedStyles = styleElements.map((el) => el.outerHTML).join('\n');

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Receipt Voucher - ${getTransactionNumber()}</title>
          ${ARABIC_FONT_LINK}
          ${copiedStyles}
          <style>
            ${PRINT_STYLES}
            ${SHARED_VOUCHER_STYLES}
            @page { size: A4 portrait; margin: 6mm 8mm 6mm 8mm; }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div id="voucher-print-root">${voucherElement.outerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();

    const startPrinting = () => {
      const images = Array.from(printWindow.document.images);
      const imagePromises = images.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          image.onload = resolve;
          image.onerror = resolve;
        });
      });

      const fontsReady =
        printWindow.document.fonts && printWindow.document.fonts.ready
          ? printWindow.document.fonts.ready
          : Promise.resolve();

      Promise.all([...imagePromises, fontsReady]).then(() => {
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (error) {
            console.error('Voucher print error:', error);
          }
        }, 500);
      });
    };

    if (printWindow.document.readyState === 'complete') {
      startPrinting();
    } else {
      printWindow.addEventListener('load', startPrinting, { once: true });
    }

    printWindow.onafterprint = () => {
      setTimeout(() => {
        try {
          printWindow.close();
        } catch {
          /* ignore */
        }
      }, 100);
    };
  };

  // =========================================================
  // PDF
  // =========================================================
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    let tempContainer = null;

    try {
      const voucherElement = printRef.current.cloneNode(true);
      voucherElement
        .querySelectorAll('.voucher-no-print')
        .forEach((el) => el.remove());
      voucherElement.id = 'voucher-pdf-copy';

      tempContainer = document.createElement('div');
      Object.assign(tempContainer.style, {
        position: 'fixed',
        left: '-10000px',
        top: '0',
        width: '794px',
        minHeight: '1123px',
        margin: '0',
        padding: '0',
        background: '#ffffff',
        overflow: 'visible',
        visibility: 'visible',
        opacity: '1',
        pointerEvents: 'none',
        zIndex: '-1',
        direction: 'rtl',
      });

      const fontLinkEl = document.createElement('link');
      fontLinkEl.rel = 'stylesheet';
      fontLinkEl.href =
        'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap';
      document.head.appendChild(fontLinkEl);

      const styleElement = document.createElement('style');
      styleElement.textContent = `
        ${PRINT_STYLES}
        ${SHARED_VOUCHER_STYLES}
        #voucher-pdf-copy {
          display: block !important;
          width: 794px !important;
          max-width: 794px !important;
          min-height: 1123px !important;
          margin: 0 auto !important;
          padding: 20px 20px 0 20px !important;
          background: #ffffff !important;
          color: #111111 !important;
          direction: rtl !important;
          font-family: 'Cairo', Arial, Helvetica, sans-serif !important;
          overflow: visible !important;
          transform: none !important;
          scale: 1 !important;
        }
        #voucher-pdf-copy * { box-sizing: border-box !important; }
        #voucher-pdf-copy .shadow-xl,
        #voucher-pdf-copy .shadow-2xl,
        #voucher-pdf-copy .shadow-lg,
        #voucher-pdf-copy .shadow-md { box-shadow: none !important; }
        #voucher-pdf-copy img { visibility: visible !important; opacity: 1 !important; }
        #voucher-pdf-copy .flex { display: flex !important; }
        #voucher-pdf-copy .grid { display: grid !important; }
      `;

      tempContainer.appendChild(styleElement);
      tempContainer.appendChild(voucherElement);
      document.body.appendChild(tempContainer);

      const images = Array.from(tempContainer.querySelectorAll('img'));
      await Promise.all(
        images.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete && img.naturalWidth > 0) return resolve();
              const finish = () => resolve();
              img.onload = finish;
              img.onerror = finish;
              setTimeout(finish, 5000);
            })
        )
      );

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      await new Promise((resolve) => setTimeout(resolve, 400));

      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      const canvas = await html2canvas(voucherElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 15000,
        foreignObjectRendering: false,
      });

      if (tempContainer?.parentNode)
        tempContainer.parentNode.removeChild(tempContainer);
      tempContainer = null;

      if (fontLinkEl.parentNode) {
        fontLinkEl.parentNode.removeChild(fontLinkEl);
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = canvas.width;
      const imageHeight = canvas.height;
      const ratio = pdfWidth / imageWidth;
      const pageHeightPx = pdfHeight / ratio;
      const totalPages = Math.max(1, Math.ceil(imageHeight / pageHeightPx));

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        const sourceY = page * pageHeightPx;
        const sourceHeight = Math.min(
          pageHeightPx,
          imageHeight - sourceY
        );
        if (sourceHeight <= 0) continue;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imageWidth;
        pageCanvas.height = Math.ceil(sourceHeight);
        const context = pageCanvas.getContext('2d');
        if (!context) throw new Error('Unable to create PDF canvas.');

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        context.drawImage(
          canvas,
          0,
          sourceY,
          imageWidth,
          sourceHeight,
          0,
          0,
          imageWidth,
          sourceHeight
        );

        const imageData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const pageHeight = sourceHeight * ratio;
        pdf.addImage(
          imageData,
          'JPEG',
          0,
          0,
          pdfWidth,
          pageHeight,
          undefined,
          'FAST'
        );
      }

      pdf.save(`Receipt-Voucher-${getTransactionNumber()}.pdf`);
    } catch (error) {
      console.error('PDF download error:', error);
      alert(
        'An error occurred while generating the PDF. Please try again.'
      );
      if (tempContainer?.parentNode)
        tempContainer.parentNode.removeChild(tempContainer);
    }
  };

  // =========================================================
  // KEYBOARD
  // =========================================================
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onClose) onClose();
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'p'
      ) {
        event.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // =========================================================
  // FIELD ROW
  // =========================================================
  const FieldRow = ({
    labelAr,
    labelEn,
    value,
    dir = 'rtl',
    labelWidth = 200,
  }) => (
    <div className="voucher-field" style={{ marginBottom: '6px' }}>
      <div
        className="voucher-field-label"
        style={{ minWidth: labelWidth, maxWidth: labelWidth }}
      >
        <span className="label-ar" dir="rtl" lang="ar">
          {labelAr}
        </span>
        {labelEn && (
          <>
            <span className="label-sep">/</span>
            <span className="label-en" dir="ltr">
              {labelEn}
            </span>
          </>
        )}
        <span className="label-sep">:</span>
      </div>
      <div
        className={`voucher-field-box ${
          dir === 'rtl' ? 'is-rtl' : 'is-ltr'
        }`}
        dir={dir}
      >
        {value || ''}
      </div>
    </div>
  );

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="contents">
      <style>{PRINT_STYLES}</style>

      <motion.div
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-full max-h-[97vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-200 shadow-2xl"
        >
          {/* ACTION BAR */}
          <div className="voucher-no-print flex shrink-0 items-center justify-between border-b border-slate-300 bg-white px-4 py-3">
            <div className="w-full bg-[#f8f7f6] text-right">
              <h2 className="text-base font-black text-slate-800 sm:text-lg">
                سند قبض
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Receipt Voucher
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex cursor-pointer items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <FaFilePdf />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex cursor-pointer items-center gap-2 rounded-md bg-[#a47d52] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#8d6843]"
              >
                <FaPrint />
                <span>طباعة</span>
              </button>

              <button
                type="button"
                onClick={() => onClose && onClose()}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-500"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="flex-1 overflow-y-auto bg-slate-300 p-2 sm:p-0">
            <div
              id="deposit-voucher-print"
              ref={printRef}
              className="voucher-paper receipt-paper mx-auto w-full max-w-[794px] bg-white shadow-xl"
              style={{ padding: '20px 20px 0 20px' }}
            >
              {/* =====================================================
                  HEADER
                  ===================================================== */}
              <div
                className="voucher-header"
                style={{ marginBottom: '14px' }}
              >
                {/* Wordmark on the LEFT */}
                <div className="voucher-company-wordmark">
                  <div
                    className="voucher-company-ar"
                    dir="rtl"
                    lang="ar"
                  >
                    بروكر سيتي العقارية
                  </div>
                  <div className="voucher-company-en" dir="ltr">
                    BROKER CITY PROPERTIES L.L.C – S.P.C
                  </div>
                </div>

                {/* Logo on the RIGHT */}
                <div className="voucher-logo-wrap">
                  <img
                    src={logo}
                    alt="Broker City Properties"
                    className="voucher-logo-img"
                  />
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  marginTop: '4px',
                  marginBottom: '10px',
                  height: '2px',
                  width: '100%',
                  background:
                    'linear-gradient(to left, rgba(255,255,255,0.8), #a47d52)',
                }}
              />

              {/* =====================================================
                  TITLE + VOUCHER NO + DATE
                  ===================================================== */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                  <div
                    className="voucher-title-ar"
                    dir="rtl"
                    lang="ar"
                  >
                    سند قبض
                  </div>
                  <div
                    className="voucher-title-en"
                    style={{ marginTop: '4px' }}
                  >
                    RECEIPT VOUCHER
                  </div>
                </div>

                <div style={{ flex: '1 1 auto', maxWidth: '380px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        minWidth: '150px',
                        textAlign: 'right',
                      }}
                    >
                      رقم السند / Voucher No. :
                    </span>
                    <div
                      className="voucher-field-box is-ltr"
                      dir="ltr"
                    >
                      {getTransactionNumber()}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        minWidth: '150px',
                        textAlign: 'right',
                      }}
                    >
                      التاريخ / Date :
                    </span>
                    <div
                      className="voucher-field-box is-ltr"
                      dir="ltr"
                    >
                      {formatDate(
                        transaction.transaction_date ||
                          transaction.date ||
                          transaction.created_at
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* =====================================================
                  MAIN FIELDS
                  ===================================================== */}

              <FieldRow
                labelAr="استلمنا من"
                labelEn="Received From"
                value={getPersonName()}
                dir="rtl"
              />

              <div
                className="voucher-field"
                style={{ marginBottom: '6px' }}
              >
                <div
                  className="voucher-field-label"
                  style={{ minWidth: 200, maxWidth: 200 }}
                >
                  <span className="label-ar" dir="rtl" lang="ar">
                    مبلغ وقدره
                  </span>
                  <span className="label-sep">/</span>
                  <span className="label-en" dir="ltr">
                    Amount Received
                  </span>
                  <span className="label-sep">:</span>
                </div>
                <div className="voucher-amount-row">
                  <div className="voucher-amount-value" dir="ltr">
                    {formatAmount(getAmount())}
                  </div>
                  <div className="voucher-amount-unit" dir="rtl">
                    <span>درهم</span>
                    <span>/</span>
                    <span dir="ltr">{getCurrency()}</span>
                  </div>
                </div>
              </div>

              <FieldRow
                labelAr="المبلغ كتابة"
                labelEn="Amount in Words"
                value={`${formatAmountInWords(
                  transaction.amount
                )} درهم فقط لاغير`}
                dir="rtl"
              />

              <FieldRow
                labelAr="وذلك عن"
                labelEn="Payment For"
                value={getStatement()}
                dir="rtl"
              />

              <FieldRow
                labelAr="العقار"
                labelEn="Property"
                value={getPropertyName()}
                dir="rtl"
              />

              <div
                className="voucher-field"
                style={{ marginBottom: '6px' }}
              >
                <div
                  className="voucher-field-label"
                  style={{ minWidth: 200, maxWidth: 200 }}
                >
                  <span className="label-ar" dir="rtl" lang="ar">
                    رقم الوحدة
                  </span>
                  <span className="label-sep">/</span>
                  <span className="label-en" dir="ltr">
                    Unit No.
                  </span>
                  <span className="label-sep">:</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: '1 1 auto',
                  }}
                >
                  <div
                    className="voucher-field-box is-ltr"
                    dir="ltr"
                    style={{ minWidth: '80px', maxWidth: '110px' }}
                  >
                    {getUnitNumber()}
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      paddingRight: '4px',
                    }}
                  >
                    رقم الفاتورة أو العقد / Invoice / Contract :
                  </span>

                  <div
                    className="voucher-field-box is-ltr"
                    dir="ltr"
                    style={{ flex: '1 1 auto' }}
                  >
                    {getContractNumber()}
                  </div>
                </div>
              </div>

              <div
                className="voucher-field"
                style={{ marginBottom: '6px' }}
              >
                <div
                  className="voucher-field-label"
                  style={{ minWidth: 200, maxWidth: 200 }}
                >
                  <span className="label-ar" dir="rtl" lang="ar">
                    طريقة الدفع
                  </span>
                  <span className="label-sep">/</span>
                  <span className="label-en" dir="ltr">
                    Payment Method
                  </span>
                  <span className="label-sep">:</span>
                </div>
                <div className="voucher-payment-group">
                  <div className="voucher-payment-item">
                    <span
                      className={`voucher-payment-box ${
                        paymentMethod === 'cash' ? 'is-checked' : ''
                      }`}
                    />
                    <span className="voucher-payment-labels">
                      <span className="ar" dir="rtl" lang="ar">
                        نقداً
                      </span>
                      <span className="en">Cash</span>
                    </span>
                  </div>

                  <div className="voucher-payment-item">
                    <span
                      className={`voucher-payment-box ${
                        paymentMethod === 'transfer' ? 'is-checked' : ''
                      }`}
                    />
                    <span className="voucher-payment-labels">
                      <span className="ar" dir="rtl" lang="ar">
                        تحويل
                      </span>
                      <span className="en">Transfer</span>
                    </span>
                  </div>

                  <div className="voucher-payment-item">
                    <span
                      className={`voucher-payment-box ${
                        paymentMethod === 'cheque' ? 'is-checked' : ''
                      }`}
                    />
                    <span className="voucher-payment-labels">
                      <span className="ar" dir="rtl" lang="ar">
                        شيك
                      </span>
                      <span className="en">Cheque</span>
                    </span>
                  </div>
                </div>
              </div>

              <FieldRow
                labelAr="رقم المرجع"
                labelEn="Reference No."
                value={getReferenceNumber()}
                dir="ltr"
              />

              <FieldRow
                labelAr="البنك"
                labelEn="Bank"
                value={getBankName()}
                dir="rtl"
              />

              {/* =====================================================
                  SIGNATURES
                  ===================================================== */}
              <div className="voucher-signatures">
                <div className="voucher-signature-col">
                  <div className="voucher-signature-label">
                    اسم المستلم / Received By
                  </div>
                  <div className="voucher-signature-box" />
                </div>

                <div className="voucher-signature-col">
                  <div className="voucher-signature-label">
                    توقيع المستلم / Receiver Signature
                  </div>
                  <div className="voucher-signature-box" />
                </div>

                <div className="voucher-signature-col">
                  <div className="voucher-signature-label">
                    ختم الشركة / Company Stamp
                  </div>
                  <div className="voucher-signature-box with-stamp">
                    <img
                      src={stamp}
                      alt="Company Stamp"
                      className="voucher-signature-stamp"
                    />
                  </div>
                </div>
              </div>

              {/* =====================================================
                  FOOTER
                  ===================================================== */}
              <div
                className="voucher-footer mb-0 bg-[#f8f7f5]"
                style={{ marginTop: '14px', marginBottom: 0 }}
              >
                <div className="voucher-footer-services">
                  <span
                    className="voucher-footer-services-en"
                    dir="ltr"
                  >
                    Buy - Sell - Rent - Property Management - Valuation
                    &amp; Appraisal - General Maintenance
                  </span>

                  <span className="mx-2">|</span>

                  <span
                    className="voucher-footer-services-ar"
                    dir="rtl"
                    lang="ar"
                  >
                    بيع - شراء - تأجير - إدارة الأملاك - التقييم والتثمين
                    - صيانة عامة
                  </span>
                </div>

                <div className="voucher-footer-contact">
                  <div className="voucher-footer-contact-row">
                    <span dir="ltr">
                      P.O.BOX : 7833 Abu Dhabi - U.A.E
                    </span>
                    <span>|</span>
                    <span
                      className="voucher-footer-contact-ar"
                      dir="rtl"
                      lang="ar"
                    >
                      ص.ب 7833 أبوظبي - الإمارات العربية المتحدة
                    </span>
                  </div>

                  <div className="voucher-footer-contact-row">
                    <span dir="ltr">+971 50 2000 195</span>
                    <span>|</span>
                    <span dir="ltr">☎ +971 2 6666 101</span>
                  </div>

                  <div className="voucher-footer-company" dir="ltr">
                    BROKER CITY PROPERTIES
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Voucher;