// Voucher.jsx
// npm install framer-motion react-icons jspdf html2canvas-pro

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import logo from '../../../assets/images/logogo-removebg-old.png';
import stamp from '../../../assets/images/stamp.jpeg';
import { formatAmountInWords } from '../../../utils/numberToArabic';
import { MdOutlineRealEstateAgent } from 'react-icons/md';

import {
  FaPrint,
  FaTimes,
  FaFilePdf,
} from 'react-icons/fa';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// =============================================================
// PRINT STYLES
// =============================================================

const PRINT_STYLES = `
.receipt-paper {
  font-family: Arial, Helvetica, sans-serif;
  color: #111;
  background: #fff;
}

.receipt-paper * {
  box-sizing: border-box;
}

.receipt-small {
  font-size: 9px;
  line-height: 1.25;
}

.receipt-medium {
  font-size: 10px;
  line-height: 1.3;
}

.receipt-signature-image {
  display: block;
  max-width: 125px;
  max-height: 55px;
  object-fit: contain;
  margin: 0 auto;
}

.receipt-signature-text {
  display: block;
  font-size: 10px;
  font-weight: 700;
}

.receipt-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.receipt-table th,
.receipt-table td {
  border: 1px solid #9ca3af;
  vertical-align: middle;
}

.receipt-table th {
  font-weight: 800;
  text-align: center;
}

.receipt-table td {
  font-weight: 500;
}

/* =====================================================
   HEADER LOGO
   ===================================================== */

.voucher-logo-area {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  padding-left: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: visible;
}

.voucher-logo-img {
  display: block;
  height: 90px;
  width: auto;
  max-width: none;
  object-fit: contain;
  object-position: right center;
  margin-top: 0;
  margin-bottom: 0;
  margin-left: 0;
  transform: none;
}

/* =====================================================
   HEADER SEPARATOR
   ===================================================== */

.voucher-header-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.voucher-header-line {
  display: block;
  flex: 1 1 auto;
  height: 2px;
  background: linear-gradient(
    to left,
    rgba(255, 255, 255, 0.8),
    #a47d52
  );
}

@media (min-width: 768px) {
  .voucher-header-separator {
    justify-content: flex-end;
  }
}

.voucher-stamp-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.voucher-stamp-image {
  display: block;
  width: 105px;
  height: 105px;
  object-fit: contain;
  margin: 0 auto;
}

.voucher-stamp-label {
  margin-top: 4px;
  text-align: center;
  font-size: 9px;
  line-height: 1.2;
  font-weight: 800;
  color: #111;
}

.voucher-footer {
  width: 100%;
  margin-bottom: 0 !important;
  background: #f8f7f5;
  border-top: 2px solid #a47d52;
  overflow: hidden;
}

.voucher-footer-services {
  width: 100%;
  padding: 5px 4px 4px;
  text-align: center;
  color: #a47d52;
  font-size: 8px;
  line-height: 1.35;
  font-weight: 800;
  border-bottom: 1px solid #a47d52;
}

.voucher-footer-contact {
  width: 100%;
  margin-bottom: 0 !important;
  padding: 5px 4px 3px;
  text-align: center;
  color: #111;
  font-size: 7.5px;
  line-height: 1.5;
  font-weight: 600;
}

.voucher-footer-contact-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 3px 14px;
  margin-bottom: 0 !important;
}

.voucher-footer-company {
  margin-top: 1px;
  margin-bottom: 0 !important;
  color: #a47d52;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.3px;
}

/* =====================================================
   TOTALS BLOCK
   ===================================================== */

.voucher-totals-block {
  background: #f8f7f5;
  border-radius: 4px;
}

.voucher-totals-label {
  font-size: 12px;
  font-weight: 700;
  color: #111;
}

.voucher-totals-value {
  font-size: 13px;
  font-weight: 900;
  color: #111;
}

.voucher-totals-net-label {
  font-size: 14px;
  font-weight: 900;
  color: #111;
}

.voucher-totals-net-value {
  font-size: 26px;
  font-weight: 900;
  color: #111;
  border: 1.5px solid #a47d52;
  border-radius: 4px;
  padding: 2px 8px;
  background: #ffffff;
  display: inline-block;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 5mm 6mm 6mm 6mm;
  }

  html,
  body {
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

  .voucher-paper {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  .receipt-paper {
    display: block !important;
    visibility: visible !important;
  }

  .voucher-logo-area {
    display: flex !important;
    width: 100% !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    justify-content: flex-start !important;
    padding-left: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    overflow: visible !important;
    visibility: visible !important;
  }

  .voucher-logo-img {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    height: 90px !important;
    width: auto !important;
    max-width: none !important;
    object-fit: contain !important;
    object-position: right center !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    margin-left: 0 !important;
    transform: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .receipt-table {
    width: 100% !important;
    page-break-inside: auto !important;
  }

  .receipt-table tr {
    page-break-inside: avoid !important;
    page-break-after: auto !important;
  }

  .receipt-table thead { display: table-header-group !important; }
  .receipt-table tfoot { display: table-footer-group !important; }

  .voucher-header-separator {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 8px !important;
    width: 100% !important;
  }

  .voucher-header-line {
    display: block !important;
    flex: 1 1 auto !important;
    width: auto !important;
    height: 2px !important;
    background: linear-gradient(
      to left,
      rgba(255, 255, 255, 0.8),
      #a47d52
    ) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .voucher-stamp-area { page-break-inside: avoid !important; }

  .voucher-footer {
    page-break-inside: avoid !important;
    margin-bottom: 0 !important;
    background: #f8f7f5 !important;
  }

  .voucher-footer-contact,
  .voucher-footer-company,
  .voucher-footer-contact-row {
    margin-bottom: 0 !important;
  }

  .voucher-stamp-image {
    display: block !important;
    width: 105px !important;
    height: 105px !important;
    object-fit: contain !important;
  }

  img { max-width: 100% !important; }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;

// =============================================================
// SHARED VOUCHER STYLES
// Used identically in print window + PDF so all three views match.
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
  padding: 20px 16px !important;
  background: #ffffff !important;
  color: #111111 !important;
  font-family: Arial, Helvetica, sans-serif !important;
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

/* Backgrounds */
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

/* Brand color */
.receipt-paper .text-\\[\\#a47d52\\],
.voucher-paper .text-\\[\\#a47d52\\],
#voucher-print-copy .text-\\[\\#a47d52\\],
#voucher-pdf-copy .text-\\[\\#a47d52\\] {
  color: #a47d52 !important;
}

/* Table */
.receipt-table {
  width: 100% !important;
  border-collapse: collapse !important;
  table-layout: fixed !important;
  page-break-inside: auto !important;
}

.receipt-table th,
.receipt-table td {
  border: 1px solid #9ca3af !important;
  vertical-align: middle !important;
}

.receipt-table tr {
  page-break-inside: avoid !important;
  page-break-after: auto !important;
}

.receipt-table thead { display: table-header-group !important; }

/* Logo */
.voucher-logo-area {
  display: flex !important;
  width: 100% !important;
  flex-direction: column !important;
  align-items: flex-end !important;
  justify-content: flex-start !important;
  padding-left: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  overflow: visible !important;
  visibility: visible !important;
}

.voucher-logo-img {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  height: 90px !important;
  width: auto !important;
  max-width: none !important;
  object-fit: contain !important;
  object-position: right center !important;
  margin: 0 !important;
  transform: none !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Header separator */
.voucher-header-separator {
  display: flex !important;
  flex-direction: row !important;
  direction: ltr !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 8px !important;
  width: 100% !important;
}

.voucher-header-line {
  display: block !important;
  flex: 1 1 auto !important;
  width: auto !important;
  height: 2px !important;
  background: linear-gradient(
    to left,
    rgba(255, 255, 255, 0.8),
    #a47d52
  ) !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Stamp */
.voucher-stamp-area {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  page-break-inside: avoid !important;
}

.voucher-stamp-image {
  display: block !important;
  width: 105px !important;
  height: 105px !important;
  max-width: 105px !important;
  max-height: 105px !important;
  object-fit: contain !important;
  margin: 0 auto !important;
  transform: none !important;
}

.voucher-stamp-label {
  display: block !important;
  margin-top: 4px !important;
  text-align: center !important;
  font-size: 9px !important;
  font-weight: 800 !important;
  color: #111111 !important;
}

/* Footer — pinned to bottom, no extra spacing */
.voucher-footer {
  width: 100% !important;
  margin: 0 !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
  background: #f8f7f5 !important;
  border-top: 2px solid #a47d52 !important;
  page-break-inside: avoid !important;
}

.voucher-footer-services {
  color: #a47d52 !important;
  background: #f8f7f5 !important;
  border-bottom: 1px solid #a47d52 !important;
}

.voucher-footer-contact {
  color: #111111 !important;
  background: #f8f7f5 !important;
  margin: 0 !important;
  margin-bottom: 0 !important;
}

.voucher-footer-company {
  color: #a47d52 !important;
  margin: 0 !important;
  margin-bottom: 0 !important;
}

.voucher-footer-contact-row {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-wrap: wrap !important;
  margin: 0 !important;
  margin-bottom: 0 !important;
}

/* Totals block */
.voucher-totals-block {
  background: #f8f7f5 !important;
  border-radius: 4px !important;
}


.voucher-totals-label {
  font-size: 12px !important;
  font-weight: 700 !important;
  color: #111111 !important;
}


.voucher-totals-value {
  font-size: 13px !important;
  font-weight: 900 !important;
  color: #111111 !important;
}

.voucher-totals-net-label {
  font-size: 14px !important;
  font-weight: 900 !important;
  color: #111111 !important;
}

.voucher-totals-net-value {
  font-size: 26px !important;
  font-weight: 900 !important;
  color: #111111 !important;
  border: 1.5px solid #a47d52 !important;
  border-radius: 4px !important;
  padding: 2px 8px !important;
  background: #ffffff !important;
  display: inline-block !important;
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
  // FETCH BANK NAME
  // =========================================================

  useEffect(() => {
    const bankValue = transaction?.bank;

    const bankId =
      bankValue && typeof bankValue === 'object'
        ? bankValue.id
        : bankValue;

    if (!bankId) {
      setFetchedBankName('');
      return;
    }

    if (typeof bankValue === 'object') {
      const existingName =
        bankValue.name ||
        bankValue.bank_name ||
        bankValue.title;

      if (existingName) {
        setFetchedBankName(existingName);
        return;
      }
    }

    const fetchBankName = async () => {
      try {
        const token = localStorage.getItem('access_token');

        const response = await fetch(
          `${BASE}/api/banks/${bankId}/`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();

        setFetchedBankName(
          data?.name ||
            data?.bank_name ||
            data?.title ||
            ''
        );
      } catch (error) {
        console.error('Error fetching bank name:', error);
        setFetchedBankName('');
      }
    };

    fetchBankName();
  }, [transaction?.bank]);

  // =========================================================
  // BASIC HELPERS
  // =========================================================

  const safeValue = (value, fallback = '-') => {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    return value;
  };

  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

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

  // =========================================================
  // TRANSACTION NUMBER
  // =========================================================

  const getTransactionNumber = () => {
    return (
      transaction.transaction_no ||
      transaction.transaction_number ||
      transaction.voucher_no ||
      transaction.voucher_number ||
      transaction.receipt_no ||
      transaction.receipt_number ||
      transaction.number ||
      transaction.id ||
      'TRX-260914-0AAF'
    );
  };

  // =========================================================
  // TRN
  // =========================================================

  const getTRN = () => {
    return (
      transaction.trn ||
      transaction.tax_registration_number ||
      transaction.company_trn ||
      transaction.company_tax_number ||
      getTransactionNumber()
    );
  };

  // =========================================================
  // CURRENCY
  // =========================================================

  const getCurrency = () => {
    return (
      transaction.currency ||
      transaction.currency_code ||
      'AED'
    );
  };

  // =========================================================
  // PAYMENT METHOD
  // =========================================================

  const getPaymentMethodLabel = () => {
    const method = transaction.payment_method;

    if (method === 'banks' || method === 'bank') {
      return 'تحويل بنكي';
    }
    if (method === 'cash') {
      return 'Cash | نقدى';
    }
    if (method === 'cheque' || method === 'check') {
      return 'Cheque | شيك';
    }
    if (method === 'transfer' || method === 'bank_transfer') {
      return 'Bank Transfer | تحويل بنكي';
    }
    return safeValue(method);
  };

  // =========================================================
  // ACCOUNT
  // =========================================================

  const getAccountName = () => {
    return getObjectName(
      transaction.account_from ||
        transaction.account ||
        transaction.account_name
    );
  };

  // =========================================================
  // BANK
  // =========================================================

  const getBankName = () => {
    if (fetchedBankName) {
      return fetchedBankName;
    }

    if (
      transaction.bank_name &&
      typeof transaction.bank_name !== 'object'
    ) {
      return transaction.bank_name;
    }

    if (
      transaction.bank_name &&
      typeof transaction.bank_name === 'object'
    ) {
      return (
        transaction.bank_name.name ||
        transaction.bank_name.bank_name ||
        transaction.bank_name.title ||
        '-'
      );
    }

    if (
      transaction.bank &&
      typeof transaction.bank === 'object'
    ) {
      return (
        transaction.bank.name ||
        transaction.bank.bank_name ||
        transaction.bank.title ||
        '-'
      );
    }

    return '-';
  };

  // =========================================================
  // CASHBOX
  // =========================================================

  const getCashboxName = () => {
    return getObjectName(
      transaction.cashbox ||
        transaction.cash_box ||
        transaction.cashbox_name
    );
  };

  // =========================================================
  // CHECK BANK
  // =========================================================

  const getCheckBankName = () => {
    return getObjectName(
      transaction.check_bank ||
        transaction.cheque_bank ||
        transaction.bank
    );
  };

  // =========================================================
  // USER
  // =========================================================

  const getTransactionUserName = () => {
    return getObjectName(
      transaction.transaction_user_name ||
        transaction.created_by ||
        transaction.user ||
        transaction.employee
    );
  };

  // =========================================================
  // PERSON
  // =========================================================

  const getPersonName = () => {
    return (
      transaction.person_deliver ||
      transaction.person_name ||
      transaction.customer_name ||
      transaction.client_name ||
      transaction.customer?.name ||
      transaction.client?.name ||
      transaction.customer?.full_name ||
      transaction.client?.full_name ||
      '-'
    );
  };

  const getPersonPhone = () => {
    return (
      transaction.phone ||
      transaction.person_phone ||
      transaction.customer_phone ||
      transaction.client_phone ||
      transaction.customer?.phone ||
      transaction.client?.phone ||
      '-'
    );
  };

  const getPersonEmail = () => {
    return (
      transaction.email ||
      transaction.person_email ||
      transaction.customer_email ||
      transaction.client_email ||
      transaction.customer?.email ||
      transaction.client?.email ||
      ''
    );
  };

  // =========================================================
  // AMOUNT
  // =========================================================

  const getAmount = () => {
    const amount = Number(
      transaction.amount ??
        transaction.total_amount ??
        transaction.received_amount ??
        0
    );

    if (Number.isNaN(amount)) {
      return 0;
    }
    return amount;
  };

  const getSubtotal = () => {
    const value = Number(
      transaction.subtotal ??
        transaction.sub_total ??
        0
    );

    if (Number.isNaN(value)) {
      return 0;
    }
    return value;
  };

  const getVat = () => {
    const value = Number(
      transaction.vat ??
        transaction.tax ??
        0
    );

    if (Number.isNaN(value)) {
      return 0;
    }
    return value;
  };

  const formatAmount = (amount = getAmount()) => {
    return Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // =========================================================
  // DATE
  // =========================================================

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
    } catch (error) {
      return value;
    }
  };

  // =========================================================
  // DATE + TIME
  // =========================================================

  const formatDateTime = (value) => {
    if (!value) return '-';

    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;

      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch (error) {
      return value;
    }
  };

  // =========================================================
  // ENGLISH NUMBER TO WORDS
  // =========================================================

  const numberToWords = (number) => {
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
      'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
      'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen',
    ];

    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
      'Sixty', 'Seventy', 'Eighty', 'Ninety',
    ];

    const convertBelowThousand = (num) => {
      let result = '';

      if (num >= 100) {
        result += `${ones[Math.floor(num / 100)]} Hundred`;
        num %= 100;
        if (num > 0) result += ' ';
      }

      if (num >= 20) {
        result += tens[Math.floor(num / 10)];
        num %= 10;
        if (num > 0) result += ` ${ones[num]}`;
      } else if (num > 0) {
        result += ones[num];
      }

      return result;
    };

    if (number === 0) return 'Zero';

    let num = Math.floor(number);
    let result = '';

    const millions = Math.floor(num / 1000000);
    if (millions > 0) {
      result += `${convertBelowThousand(millions)} Million`;
      num %= 1000000;
      if (num > 0) result += ' ';
    }

    const thousands = Math.floor(num / 1000);
    if (thousands > 0) {
      result += `${convertBelowThousand(thousands)} Thousand`;
      num %= 1000;
      if (num > 0) result += ' ';
    }

    if (num > 0) result += convertBelowThousand(num);

    return result.trim();
  };

  // =========================================================
  // ENGLISH AMOUNT
  // =========================================================

  const getEnglishAmountWords = () => {
    const custom =
      transaction.amount_to_english ||
      transaction.amount_in_words_en ||
      transaction.amount_words_en ||
      transaction.amount_in_words;

    if (custom) return custom;

    const amount = getAmount();
    const whole = Math.floor(amount);
    const fils = Math.round((amount - whole) * 100);

    let result = numberToWords(whole);
    if (whole === 1) result += ' Thousand';
    if (fils > 0) {
      result += ` and ${numberToWords(fils)} Fils`;
    }

    return `${result} ${getCurrency()} Only`;
  };

  // =========================================================
  // ARABIC AMOUNT
  // =========================================================

  const getArabicAmountWords = () => {
    return (
      transaction.amount_to_arabic ||
      transaction.amount_in_words_ar ||
      transaction.amount_words_ar ||
      `فقط ${formatAmount()} ${
        getCurrency() === 'AED'
          ? 'درهم إماراتي'
          : getCurrency()
      }`
    );
  };

  // =========================================================
  // STATEMENT
  // =========================================================

  const getStatement = () => {
    return (
      transaction.statement ||
      transaction.description ||
      transaction.narration ||
      transaction.notes ||
      'استلام مبلغ إيداع'
    );
  };

  // =========================================================
  // CONTRACT INFORMATION
  // =========================================================

  const getPropertyName = () => {
    return (
      transaction.property_name ||
      transaction.property?.name ||
      transaction.project_name ||
      transaction.contract_property ||
      ''
    );
  };

  const getContractNumber = () => {
    return (
      transaction.contract_no ||
      transaction.contract_number ||
      transaction.contract_id ||
      transaction.reference_contract ||
      ''
    );
  };

  const getContractStartDate = () => {
    return (
      transaction.contract_start_date ||
      transaction.start_date ||
      transaction.from_date ||
      transaction.rental_start_date ||
      ''
    );
  };

  const getContractEndDate = () => {
    return (
      transaction.contract_end_date ||
      transaction.end_date ||
      transaction.to_date ||
      transaction.rental_end_date ||
      ''
    );
  };

  const getRentValue = () => {
    return (
      transaction.rent_value ||
      transaction.rental_value ||
      transaction.contract_value ||
      transaction.rent_amount ||
      ''
    );
  };

  // =========================================================
  // BEING
  // =========================================================

  const getBeingEnglish = () => {
    return (
      transaction.being_english ||
      transaction.being ||
      transaction.statement_english ||
      'Received Against Payment'
    );
  };

  const getBeingArabic = () => {
    return (
      transaction.being_arabic ||
      transaction.statement ||
      'وذلك عن استلام المبلغ'
    );
  };

  // =========================================================
  // TABLE ROWS
  // =========================================================

  const getTableRows = () => {
    const source =
      transaction.items ||
      transaction.fee_items ||
      transaction.receipt_items ||
      transaction.installments ||
      transaction.details ||
      transaction.lines;

    if (Array.isArray(source) && source.length > 0) {
      return source;
    }

    return [
      {
        description:
          transaction.statement ||
          transaction.description ||
          'Deposit | إيداع',
        subtotal: getSubtotal(),
        vat: getVat(),
        amount: getAmount(),
        due_date:
          transaction.due_date ||
          transaction.transaction_date,
        payment_method: getPaymentMethodLabel(),
        cheque_no:
          transaction.check_no ||
          transaction.cheque_no ||
          '',
        cheque_date:
          transaction.check_date ||
          transaction.cheque_date ||
          transaction.transaction_date,
        bank: getBankName(),
      },
    ];
  };

  // =========================================================
  // TABLE VALUES
  // =========================================================

  const getRowDescription = (row) => {
    return (
      row.description ||
      row.fee_item ||
      row.fee_name ||
      row.item ||
      row.name ||
      row.title ||
      row.statement ||
      'Deposit | إيداع'
    );
  };

  const getRowSubtotal = (row) => {
    return (
      row.subtotal ??
      row.sub_total ??
      0
    );
  };

  const getRowVat = (row) => {
    return (
      row.vat ??
      row.tax ??
      0
    );
  };

  const getRowAmount = (row) => {
    return (
      row.amount ?? row.total ?? row.value ?? row.price ?? 0
    );
  };

  const getRowDueDate = (row) => {
    return (
      row.due_date ||
      row.dueDate ||
      row.installment_date ||
      row.date_due ||
      transaction.transaction_date
    );
  };

  const getRowPaymentType = (row) => {
    const method =
      row.payment_method ||
      row.payment_type ||
      transaction.payment_method;

    if (
      method === 'banks' ||
      method === 'bank' ||
      method === 'cheque' ||
      method === 'check'
    ) {
      return 'Cheque | شيك';
    }
    if (method === 'cash') {
      return 'Cash | نقدى';
    }
    if (method === 'transfer' || method === 'bank_transfer') {
      return 'Bank Transfer | تحويل';
    }
    return safeValue(method, 'Cash | نقدى');
  };

  const getRowChequeNumber = (row) => {
    return (
      row.cheque_no ||
      row.check_no ||
      row.cheque_number ||
      row.check_number ||
      ''
    );
  };

  const getRowChequeDate = (row) => {
    return (
      row.cheque_date ||
      row.check_date ||
      row.date ||
      transaction.transaction_date
    );
  };

  // =========================================================
  // ROW BANK
  // =========================================================

  const getRowBank = (row) => {
    if (
      row.bank_name &&
      typeof row.bank_name !== 'object'
    ) {
      return row.bank_name;
    }

    if (
      row.bank_name &&
      typeof row.bank_name === 'object'
    ) {
      return (
        row.bank_name.name ||
        row.bank_name.bank_name ||
        row.bank_name.title ||
        getBankName()
      );
    }

    if (row.bank && typeof row.bank === 'object') {
      return (
        row.bank.name ||
        row.bank.bank_name ||
        row.bank.title ||
        getBankName()
      );
    }

    if (row.bank && typeof row.bank !== 'object') {
      return row.bank;
    }

    if (row.check_bank) {
      return getObjectName(row.check_bank);
    }

    if (row.cheque_bank) {
      return getObjectName(row.cheque_bank);
    }

    return getBankName();
  };

  // =========================================================
  // TABLE DATA
  // =========================================================

  const tableRows = getTableRows();

  const totalTableAmount = tableRows.reduce(
    (total, row) =>
      total + Number(getRowSubtotal(row) || 0),
    0
  );

  // Sum of VAT across all rows — used in the totals block.
  const totalTableVat = tableRows.reduce(
    (total, row) =>
      total + Number(getRowVat(row) || 0),
    0
  );

  // Net total = sum total + VAT
  const netTotal = totalTableAmount + totalTableVat;

  // =========================================================
  // CHEQUE DETECTION
  // =========================================================

  const hasCheque = Boolean(
    transaction.check_no ||
      transaction.cheque_no ||
      transaction.check_number ||
      transaction.cheque_number ||
      (Array.isArray(tableRows) &&
        tableRows.some((row) => {
          if (!row) return false;
          return (
            row.cheque_no ||
            row.check_no ||
            row.cheque_number ||
            row.check_number
          );
        }))
  );

  // =========================================================
  // PRINT
  // =========================================================

  const handlePrint = () => {
    if (!printRef.current) return;

    const voucherElement = printRef.current.cloneNode(true);
    if (!voucherElement) return;

    voucherElement
      .querySelectorAll('.voucher-no-print')
      .forEach((element) => element.remove());

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
      document.querySelectorAll(
        'style, link[rel="stylesheet"]'
      )
    );

    const copiedStyles = styleElements
      .map((element) => element.outerHTML)
      .join('\n');

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Receipt Voucher - ${getTransactionNumber()}</title>
          ${copiedStyles}
          <style>
            ${PRINT_STYLES}
            ${SHARED_VOUCHER_STYLES}

            @page {
              size: A4 portrait;
              margin: 5mm 6mm 6mm 6mm;
            }

            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div id="voucher-print-root">
            ${voucherElement.outerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    const startPrinting = () => {
      const images = Array.from(
        printWindow.document.images
      );

      const imagePromises = images.map((image) => {
        if (image.complete) return Promise.resolve();

        return new Promise((resolve) => {
          image.onload = resolve;
          image.onerror = resolve;
        });
      });

      Promise.all(imagePromises).then(() => {
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (error) {
            console.error('Voucher print error:', error);
          }
        }, 300);
      });
    };

    if (printWindow.document.readyState === 'complete') {
      startPrinting();
    } else {
      printWindow.addEventListener('load', startPrinting, {
        once: true,
      });
    }

    printWindow.onafterprint = () => {
      setTimeout(() => {
        try {
          printWindow.close();
        } catch (error) {
          // Ignore close errors.
        }
      }, 100);
    };
  };

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    let tempContainer = null;

    try {
      const source = printRef.current;

      const voucherElement = source.cloneNode(true);

      voucherElement
        .querySelectorAll('.voucher-no-print')
        .forEach((element) => element.remove());

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

      const styleElement = document.createElement('style');

      // Use the exact same shared styles as the print window,
      // so the PDF output mirrors what appears on screen and in print.
      styleElement.textContent = `
        ${PRINT_STYLES}
        ${SHARED_VOUCHER_STYLES}

        #voucher-pdf-copy {
          display: block !important;
          width: 794px !important;
          max-width: 794px !important;
          min-height: 1123px !important;
          margin: 0 auto !important;
          padding: 20px 16px !important;
          background: #ffffff !important;
          color: #111111 !important;
          direction: rtl !important;
          font-family: Arial, Helvetica, sans-serif !important;
          overflow: visible !important;
          transform: none !important;
          scale: 1 !important;
        }

        #voucher-pdf-copy * { box-sizing: border-box !important; }

        #voucher-pdf-copy .shadow-xl,
        #voucher-pdf-copy .shadow-2xl,
        #voucher-pdf-copy .shadow-lg,
        #voucher-pdf-copy .shadow-md { box-shadow: none !important; }

        #voucher-pdf-copy [class*="bg-gradient"] {
          background: transparent !important;
        }

        #voucher-pdf-copy img {
          visibility: visible !important;
          opacity: 1 !important;
        }

        #voucher-pdf-copy .flex { display: flex !important; }
        #voucher-pdf-copy .grid { display: grid !important; }
      `;

      tempContainer.appendChild(styleElement);
      tempContainer.appendChild(voucherElement);

      document.body.appendChild(tempContainer);

      const images = Array.from(
        tempContainer.querySelectorAll('img')
      );

      await Promise.all(
        images.map((img) => {
          return new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }

            const finish = () => resolve();

            img.onload = finish;
            img.onerror = finish;

            setTimeout(finish, 5000);
          });
        })
      );

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

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

      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      tempContainer = null;

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

      const totalPages = Math.max(
        1,
        Math.ceil(imageHeight / pageHeightPx)
      );

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

        if (!context) {
          throw new Error('Unable to create PDF canvas.');
        }

        context.fillStyle = '#ffffff';
        context.fillRect(
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

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

      pdf.save(
        `Receipt-Voucher-${getTransactionNumber()}.pdf`
      );
    } catch (error) {
      console.error('PDF download error:', error);

      alert(
        'An error occurred while generating the PDF. Please try again.'
      );

      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  };

  // =========================================================
  // KEYBOARD
  // =========================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (onClose) onClose();
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'p'
      ) {
        event.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

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
            <div className="text-righ w-full bg-[#f8f7f6]">
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
                onClick={() => {
                  if (onClose) onClose();
                }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-500"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* PREVIEW AREA */}
          <div className="flex-1 overflow-y-auto bg-slate-300 p-2 sm:p-0">
            <div
              id="deposit-voucher-print"
              ref={printRef}
              className="voucher-paper receipt-paper mx-auto w-full max-w-[794px] bg-white px-4 py-5 shadow-xl sm:px-1 sm:py-1"
            >
              {/* HEADER — logo */}
               <div className="bg-[#f8f7f5] py-0 mt-0">
  <div className="mx-2 flex items-center justify-between gap-4">

    {/* Arabic Name [#3a2410]*/}
    <div className="flex flex-col gap-0 leading-tight text-right text-[#a47d52]">
      <span style={{ fontWeight: 600, fontSize: '17px' }}>بروكر سيتي العقارية</span>
      <span style={{ fontWeight: 400, fontSize: '12px' }}>أبوظبي - الإمارات العربية المتحدة</span>
    </div>

    {/* Logo */}
    {/* <div className="voucher-logo-area"> */}
    <div className="flex-shrink-0 flex items-center justify-center">
      <img
        src={logo}
        alt="Broker City Properties"
        className="voucher-logo-img scale-[2] pl-7 object-contain"
      />
    </div>

    {/* English Name */}
    <div className="flex flex-col gap-0 leading-tight text-left text-[#a47d52]">
      <span style={{ fontWeight: 600, fontSize: '17px' }}>Broker City Properties</span>
      <span style={{ fontWeight: 400, fontSize: '12px' }}>Abu Dhabi - U.A.E</span>
    </div>

  </div>
</div>  

      
              
              {/* SEPARATOR */}
              {/* <div className="voucher-header-separator">
                <MdOutlineRealEstateAgent className="text-[#a47d52] text-base md:text-lg" />
                <div className="voucher-header-line"></div>
              </div> */}

              {/* TITLE */}
              <div className="mt-2 w-full">
                <div className="relative flex w-full items-center justify-center gap-0 px-6 mb-1 ">
                  <div className="relative bg-white px-6 py-2">
                    <span className="text-[30px] leading-none tracking-widest text-[#a47d52]"
  style={{ fontWeight: 900 }}  >
                      سند قبض
                    </span>
                    <div
                      className="
                        absolute left-[-12px] top-1/2 -translate-y-1/2
                        border-y-[22px] border-y-transparent
                        border-r-[12px] border-r-[#a47d52]
                      "
                    />
                  </div>
                   {/* #a47d52 #3a2410 */}
                  <div className="relative bg-white px-6 py-2">
                    <span
  className="text-[30px] leading-none tracking-widest text-[#a47d52]"
  style={{ fontWeight: 900 }}
>
  RECEIPT VOUCHER
</span>
                    <div
                      className="
                        absolute right-[-1px] top-1/2 -translate-y-1/2
                        border-y-[22px] border-y-transparent
                        border-l-[0.5px] border-l-[#a47d52]
                      "
                    />
                  </div>
                </div>

                <div className="mt-0 text-center text-[25px] text-[#a47d52] mb-5" dir="ltr">
                  TRN : {getTRN()}
                </div>
              </div>

              {/* SEPARATOR */}
              {/* <div className="voucher-header-separator">
                <MdOutlineRealEstateAgent className="text-[#a47d52] text-base md:text-lg" />
                <div className="voucher-header-line"></div>
              </div> */}

              {/* NUMBER / DATE / AMOUNT */}
              
                {/* <div className="flex flex-col items-stretch">
                  <div
                    className="border border-slate-300 bg-[#f8f7f5] px-4 py-2 text-right"
                    dir="ltr"
                  >
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap font-black leading-none">
                      <span className="text-[22px] font-black">
                        {getCurrency()}
                      </span>
                      <span className="!text-[37px] font-black">
                        {formatAmount()}
                      </span>
                    </div>
                  </div>
                </div> */}

              <div className="w-full flex-1">
  <div className="w-full flex flex-row items-center justify-between gap-20 py-2 px-2 bg-[#f8f7f5]">

  {/* Invoice Number */}
  <span dir="ltr" className="whitespace-nowrap text-left text-[12px] font-bold">
    : رقم الفاتوره
  </span>
  <span dir="ltr" className="flex-1 whitespace-nowrap text-center font-black">
    {getTransactionNumber()}
  </span>
  <span dir="rtl" className="whitespace-nowrap text-right font-black">
    : No
  </span>

  {/* Date */}
  <span dir="ltr" className="whitespace-nowrap text-left text-[12px] font-bold">
    : بتاريخ
  </span>
  <span dir="ltr" className="flex-1 whitespace-nowrap text-center font-black">
    {formatDate(
      transaction.transaction_date ||
        transaction.date ||
        transaction.created_at
    )}
  </span>
  <span dir="rtl" className="whitespace-nowrap text-right font-black">
    : Date
  </span>

</div>
</div>
                
              

              {/* RECEIVED FROM */}
              <div className="mt-2 text-center">
                <div className="flex items-center justify-between gap-x-50 gap-y-1 pt-4 px-1 text-[13px] font-bold  py-2">
                  <span dir="ltr">: استلمنا من</span>
                  <span dir="ltr" className="font-black">
                    {getPersonName()}
                  </span>
                  <span dir="rtl" className="font-black">
                    : Received From
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between gap-x-8 text-[10px] font-semibold">
                  {getPersonPhone() !== '-' && (
                    <span dir="ltr">
                      Phone :
                      <strong className="ml-1">{getPersonPhone()}</strong>
                    </span>
                  )}
                  {getPersonEmail() && (
                    <span dir="ltr">
                      Email :
                      <strong className="ml-1">{getPersonEmail()}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* AMOUNT IN WORDS */}
              <div className="mt-2 text-center mx-auto">
                <div className="flex items-center justify-between gap-x-50 gap-y-1 pt-4 px-1 text-[13px] font-bold bg-[#f8f7f5]">
                  <span dir="ltr">: مبلغ وقدره</span>
                  <span dir="ltr" className="font-black">
                    {formatAmountInWords(transaction.amount)}{' '}
                    درهم فقط لاغير
                  </span>
                  <span dir="rtl" className="font-black">
                    : The Sum of
                  </span>
                </div>
              </div>

              {/* BEING */}
              <div className="mt-2 text-center">
                <div className="flex flex-col gap-0  py-1">
                  <div className="flex items-center justify-between gap-x-50 gap-y-1 pt-4 px-1 text-[13px] font-bold py-2">
                    <span dir="rtl">وذلك عن :</span>
                    <span dir="ltr" className="font-black">
                      {getBeingArabic()}
                    </span>
                    <span dir="rtl" className="font-black">
                      Being
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-center gap-x-8 text-[10px] font-semibold">
                  {getPersonPhone() !== '-' && (
                    <span dir="ltr">
                      Phone :
                      <strong className="ml-1">{getPersonPhone()}</strong>
                    </span>
                  )}
                  {getPersonEmail() && (
                    <span dir="ltr">
                      Email :
                      <strong className="ml-1">{getPersonEmail()}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* CONTRACT / PROPERTY */}
              {(getPropertyName() ||
                getContractNumber() ||
                getContractStartDate() ||
                getContractEndDate() ||
                getRentValue()) && (
                <div className="mt-1 text-[10px] font-bold">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <span>{getPropertyName()}</span>

                    {getContractNumber() && (
                      <span dir="ltr">
                        Contract No:
                        <strong className="ml-1">
                          {getContractNumber()}
                        </strong>
                      </span>
                    )}

                    {getContractStartDate() && (
                      <span dir="ltr">
                        From:
                        <strong className="ml-1">
                          {formatDate(getContractStartDate())}
                        </strong>
                      </span>
                    )}

                    {getContractEndDate() && (
                      <span dir="ltr">
                        To:
                        <strong className="ml-1">
                          {formatDate(getContractEndDate())}
                        </strong>
                      </span>
                    )}
                  </div>

                  {getRentValue() && (
                    <div className="mt-0.5" dir="ltr">
                      Rent Value:
                      <strong className="ml-1">
                        {getCurrency()} {formatAmount(getRentValue())}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* ARABIC CONTRACT */}
              {(getPropertyName() || getContractNumber()) && (
                <div dir="rtl" className="mt-0.5 text-right text-[10px] font-bold">
                  {getPropertyName() && <span>{getPropertyName()}</span>}

                  {getContractNumber() && (
                    <span className="mr-5">
                      رقم العقد:
                      <strong className="mr-1">
                        {getContractNumber()}
                      </strong>
                    </span>
                  )}

                  {getRentValue() && (
                    <span className="mr-5">
                      القيمة الإيجارية:
                      <strong className="mr-1">
                        {formatAmount(getRentValue())} درهم
                      </strong>
                    </span>
                  )}
                </div>
              )}

              {/* MAIN TABLE */}
              {/* <hr className="text-gray-300 mt-2" /> */}

              {/* Parent wrapper — full width */}
              <div className="mt-10 w-full">
  <table
    className="receipt-table w-full text-[8px] sm:text-[9px]"
    style={{
      width: '100%',
      minWidth: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'fixed',
    }}
  >
    {/* COLGROUP */}
    <colgroup>
      {hasCheque ? (
        <>
          <col style={{ width: '4%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '12%' }} />
        </>
      ) : (
        <>
          <col style={{ width: '5%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '15%' }} />
        </>
      )}
    </colgroup>

    <thead>
      <tr className="bg-[#f8f7f5]">
        <th className="py-1.5" style={{ fontSize: '12px' }}>
          #
          <br />
          <span dir="rtl"></span>
        </th>

        <th className="py-1.5" style={{ fontSize: '12px' }}>
          Subtotal
          <br />
          <span dir="rtl">قبل الضريبة</span>
        </th>

        <th className="py-1.5" style={{ fontSize: '12px' }}>
          VAT
          <br />
          <span dir="rtl">الضريبة</span>
        </th>

        <th className="py-1.5" style={{ fontSize: '12px' }}>
          Amount
          <br />
          <span dir="rtl">المبلغ</span>
        </th>
        <th className="py-1.5" style={{ fontSize: '12px' }}>
          Due Date
          <br />
          <span dir="rtl">تاريخ الاجراء</span>
        </th>
        <th className="py-1.5" style={{ fontSize: '12px' }}>
          Payment Type
          <br />
          <span dir="rtl">طريقة الدفع</span>
        </th>

        {hasCheque && (
          <>
            <th className="py-1.5" style={{ fontSize: '12px' }}>
              Cheque
              <br />
              <span dir="rtl">رقم الشيك</span>
            </th>
            <th className="py-1.5" style={{ fontSize: '12px' }}>
              Date
              <br />
              <span dir="rtl">تاريخ الشيك</span>
            </th>
          </>
        )}

        <th className="py-1.5" style={{ fontSize: '12px' }}>
          Bank
          <br />
          <span dir="rtl">البنك</span>
        </th>
      </tr>
    </thead>

    <tbody>
      {tableRows.map((row, index) => (
        <tr
          key={row.id || row.pk || index}
          className="text-center"
        >
          <td
            className="px-1 py-1.5 font-bold"
            style={{ fontSize: '15px' }}
          >
            {index + 1}
          </td>

          <td
            className="px-1 py-1.5 font-semibold text-center"
            dir="ltr"
            style={{ fontSize: '13px' }}
          >
            {formatAmount(getRowSubtotal(row))}
          </td>

          <td
            className="px-1 py-1.5 font-semibold text-center"
            dir="ltr"
            style={{ fontSize: '13px' }}
          >
            {formatAmount(getRowVat(row))}
          </td>

          <td
            className="px-1 py-1.5 font-semibold text-center"
            dir="ltr"
            style={{ fontSize: '15px' }}
          >
            {formatAmount(getRowAmount(row))}
          </td>
          <td
            className="px-1 py-1.5 font-semibold"
            style={{ fontSize: '13px' }}
            dir="ltr"
          >
            {formatDate(getRowDueDate(row))}
          </td>
          <td
            className="px-1 py-1.5 font-semibold"
            style={{ fontSize: '15px' }}
          >
            {getRowPaymentType(row)}
          </td>

          {hasCheque && (
            <>
              <td
                className="px-1 py-1.5 font-semibold"
                dir="ltr"
                style={{ fontSize: '13px' }}
              >
                {getRowChequeNumber(row) || ''}
              </td>
              <td
                className="px-1 py-1.5 font-semibold"
                dir="ltr"
                style={{ fontSize: '13px' }}
              >
                {getRowChequeNumber(row)
                  ? formatDate(getRowChequeDate(row))
                  : ''}
              </td>
            </>
          )}

          <td
            dir="auto"
            className="px-1 py-1.5 text-center font-semibold"
            style={{ fontSize: '15px' }}
          >
            {getRowBank(row)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* ================================================
      TOTALS — Arabic labels + bordered Net Total number.
      ================================================ */}
  <div className="mt-3 flex w-full justify-end">
    <div className="voucher-totals-block flex flex-col gap-1 min-w-[280px] px-3 py-2">

      {/* Sum Total — Arabic */}
      <div className="flex items-center justify-between gap-4">
        <span className="voucher-totals-label" dir="rtl">الإجمالي الفرعي</span>
        <span className="voucher-totals-label">:</span>
        <span className="voucher-totals-value" dir="ltr">
          {formatAmount(totalTableAmount)}
        </span>
      </div>

      {/* VAT Total — Arabic */}
      <div className="flex items-center justify-between gap-4">
        <span className="voucher-totals-label" dir="rtl">الضريبة</span>
        <span className="voucher-totals-label">:</span>
        <span className="voucher-totals-value" dir="ltr">
          {formatAmount(totalTableVat)}
        </span>
      </div>

      {/* Net Total — Arabic + bigger font + bordered number */}
      <div className="flex items-center justify-between gap-4 border-t border-[#a47d52] pt-2 mt-1">
        <span className="voucher-totals-net-label" dir="rtl">الصافي</span>
        <span className="voucher-totals-net-label">:</span>
        <span className="voucher-totals-net-value " dir="ltr">
          {formatAmount(netTotal  )} AED
        </span>
      </div>

    </div>
  </div>
</div>
              {/* COMPANY STAMP */}
              <div className="voucher-stamp-area mt-5">
                <img
                  src={stamp}
                  alt="Company Stamp"
                  className="voucher-stamp-image scale-[2]"
                />
                <div className="voucher-stamp-label" dir="rtl">
                  اعتماد الاداره | Company Stamp
                </div>
              </div>

              {/* FOOTER — pinned to bottom (mb-0) */}
              <div className="voucher-footer mb-0 bg-[#f8f7f5]">
                <div className="voucher-footer-services" dir="auto">
                  Buy - Sell - Rent - Property Management -
                  Valuation &amp; Appraisal - General Maintenance
                  <span className="mx-2">|</span>
                  بيع - شراء - تأجير - إدارة الأملاك -
                  التقييم والتثمين - صيانة عامة
                </div>

                <div className="voucher-footer-contact">
                  <div className="voucher-footer-contact-row">
                    <span dir="ltr">
                      P.O.BOX : 7833 Abu Dhabi - U.A.E
                    </span>
                    <span>|</span>
                    <span dir="rtl">
                      ص.ب 7833 أبوظبي - الإمارات العربية المتحدة
                    </span>
                  </div>

                  <div className="voucher-footer-contact-row">
                    <span dir="ltr">+971 50 2000 195</span>
                    <span>|</span>
                    <span dir="ltr">☎ +971 2 6666 101</span>
                    <span>|</span>
                    {/* <span dir="ltr">info@brokercity.ae</span> */}
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
// // Voucher.jsx
// // npm install framer-motion react-icons jspdf html2canvas-pro

// import React, { useEffect, useRef, useState } from 'react';
// import { motion } from 'framer-motion';
// import logo from '../../../assets/images/logogo-removebg-old.png';
// import stamp from '../../../assets/images/stamp.jpeg';
// import { formatAmountInWords } from '../../../utils/numberToArabic';
// import { MdOutlineRealEstateAgent } from 'react-icons/md';

// import {
//   FaPrint,
//   FaTimes,
//   FaFilePdf,
// } from 'react-icons/fa';

// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas-pro';

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// // =============================================================
// // PRINT STYLES
// // =============================================================

// const PRINT_STYLES = `
// .receipt-paper {
//   font-family: Arial, Helvetica, sans-serif;
//   color: #111;
//   background: #fff;
// }

// .receipt-paper * {
//   box-sizing: border-box;
// }

// .receipt-small {
//   font-size: 9px;
//   line-height: 1.25;
// }

// .receipt-medium {
//   font-size: 10px;
//   line-height: 1.3;
// }

// .receipt-signature-image {
//   display: block;
//   max-width: 125px;
//   max-height: 55px;
//   object-fit: contain;
//   margin: 0 auto;
// }

// .receipt-signature-text {
//   display: block;
//   font-size: 10px;
//   font-weight: 700;
// }

// .receipt-table {
//   width: 100%;
//   border-collapse: collapse;
//   table-layout: fixed;
// }

// .receipt-table th,
// .receipt-table td {
//   border: 1px solid #9ca3af;
//   vertical-align: middle;
// }

// .receipt-table th {
//   font-weight: 800;
//   text-align: center;
// }

// .receipt-table td {
//   font-weight: 500;
// }

// .receipt-table .col-s { width: 5%; }
// .receipt-table .col-fees { width: 21%; }
// .receipt-table .col-amount { width: 13%; }
// .receipt-table .col-due { width: 12%; }
// .receipt-table .col-payment { width: 14%; }
// .receipt-table .col-cheque { width: 10%; }
// .receipt-table .col-date { width: 11%; }
// .receipt-table .col-bank { width: 14%; }

// /* =====================================================
//    HEADER LOGO
//    ===================================================== */

// .voucher-logo-area {
//   display: flex;
//   width: 100%;
//   flex-direction: column;
//   align-items: flex-end;
//   justify-content: flex-start;
//   padding-left: 0;
//   padding-top: 0;
//   padding-bottom: 0;
//   overflow: visible;
// }

// .voucher-logo-img {
//   display: block;
//   height: 90px;
//   width: auto;
//   max-width: none;
//   object-fit: contain;
//   object-position: right center;
//   margin-top: 0;
//   margin-bottom: 0;
//   margin-left: 0;
//   transform: none;
// }

// /* =====================================================
//    HEADER SEPARATOR (gold gradient line + icon)
//    ===================================================== */

// .voucher-header-separator {
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   gap: 8px;
//   width: 100%;
// }

// .voucher-header-line {
//   display: block;
//   flex: 1 1 auto;
//   height: 2px;
//   background: linear-gradient(
//     to left,
//     rgba(255, 255, 255, 0.8),
//     #a47d52
//   );
// }

// @media (min-width: 768px) {
//   .voucher-header-separator {
//     justify-content: flex-end;
//   }
// }

// .voucher-stamp-area {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   width: 100%;
// }

// .voucher-stamp-image {
//   display: block;
//   width: 105px;
//   height: 105px;
//   object-fit: contain;
//   margin: 0 auto;
// }

// .voucher-stamp-label {
//   margin-top: 4px;
//   text-align: center;
//   font-size: 9px;
//   line-height: 1.2;
//   font-weight: 800;
//   color: #111;
// }

// .voucher-footer {
//   width: 100%;
//   background: #f8f7f5;
//   border-top: 2px solid #a47d52;
//   overflow: hidden;
// }

// .voucher-footer-services {
//   width: 100%;
//   padding: 5px 4px 4px;
//   text-align: center;
//   color: #a47d52;
//   font-size: 8px;
//   line-height: 1.35;
//   font-weight: 800;
//   border-bottom: 1px solid #a47d52;
// }

// .voucher-footer-contact {
//   width: 100%;
//   padding: 5px 4px 3px;
//   text-align: center;
//   color: #111;
//   font-size: 7.5px;
//   line-height: 1.5;
//   font-weight: 600;
// }

// .voucher-footer-contact-row {
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   flex-wrap: wrap;
//   gap: 3px 14px;
// }

// .voucher-footer-company {
//   margin-top: 1px;
//   color: #a47d52;
//   font-size: 8px;
//   font-weight: 900;
//   letter-spacing: 0.3px;
// }

// @media print {
//   @page {
//     size: A4 portrait;
//     margin: 5mm 6mm 6mm 6mm;
//   }

//   html,
//   body {
//     margin: 0 !important;
//     padding: 0 !important;
//     width: 100% !important;
//     min-height: 100% !important;
//     background: #fff !important;
//   }

//   body { overflow: visible !important; }

//   #deposit-voucher-print {
//     display: block !important;
//     position: static !important;
//     width: 100% !important;
//     max-width: none !important;
//     margin: 0 !important;
//     padding: 0 !important;
//     background: #fff !important;
//     color: #111 !important;
//     border: none !important;
//     box-shadow: none !important;
//     overflow: visible !important;
//   }

//   .voucher-no-print { display: none !important; }

//   .voucher-paper {
//     display: block !important;
//     position: static !important;
//     width: 100% !important;
//     max-width: none !important;
//     margin: 0 !important;
//     padding: 0 !important;
//     background: #fff !important;
//     border: none !important;
//     box-shadow: none !important;
//     overflow: visible !important;
//   }

//   .receipt-paper {
//     display: block !important;
//     visibility: visible !important;
//   }

//   .voucher-logo-area {
//     display: flex !important;
//     width: 100% !important;
//     flex-direction: column !important;
//     align-items: flex-end !important;
//     justify-content: flex-start !important;
//     padding-left: 0 !important;
//     padding-top: 0 !important;
//     padding-bottom: 0 !important;
//     overflow: visible !important;
//     visibility: visible !important;
//   }

//   .voucher-logo-img {
//     display: block !important;
//     visibility: visible !important;
//     opacity: 1 !important;
//     height: 90px !important;
//     width: auto !important;
//     max-width: none !important;
//     object-fit: contain !important;
//     object-position: right center !important;
//     margin-top: 0 !important;
//     margin-bottom: 0 !important;
//     margin-left: 0 !important;
//     transform: none !important;
//     -webkit-print-color-adjust: exact !important;
//     print-color-adjust: exact !important;
//   }

//   .receipt-table {
//     width: 100% !important;
//     page-break-inside: auto !important;
//   }

//   .receipt-table tr {
//     page-break-inside: avoid !important;
//     page-break-after: auto !important;
//   }

//   .receipt-table thead { display: table-header-group !important; }
//   .receipt-table tfoot { display: table-footer-group !important; }

//   .voucher-header-separator {
//     display: flex !important;
//     align-items: center !important;
//     justify-content: flex-end !important;
//     gap: 8px !important;
//     width: 100% !important;
//   }

//   .voucher-header-line {
//     display: block !important;
//     flex: 1 1 auto !important;
//     width: auto !important;
//     height: 2px !important;
//     background: linear-gradient(
//       to left,
//       rgba(255, 255, 255, 0.8),
//       #a47d52
//     ) !important;
//     -webkit-print-color-adjust: exact !important;
//     print-color-adjust: exact !important;
//   }

//   .voucher-stamp-area { page-break-inside: avoid !important; }

//   .voucher-footer {
//     page-break-inside: avoid !important;
//     background: #f8f7f5 !important;
//   }

//   .voucher-stamp-image {
//     display: block !important;
//     width: 105px !important;
//     height: 105px !important;
//     object-fit: contain !important;
//   }

//   img { max-width: 100% !important; }

//   * {
//     -webkit-print-color-adjust: exact !important;
//     print-color-adjust: exact !important;
//   }
// }
// `;

// // =============================================================
// // COMPONENT
// // =============================================================

// const Voucher = ({ transaction = {}, onClose }) => {
//   const printRef = useRef(null);
//   const [fetchedBankName, setFetchedBankName] = useState('');

//   // =========================================================
//   // FETCH BANK NAME
//   // =========================================================

//   useEffect(() => {
//     const bankValue = transaction?.bank;

//     const bankId =
//       bankValue && typeof bankValue === 'object'
//         ? bankValue.id
//         : bankValue;

//     if (!bankId) {
//       setFetchedBankName('');
//       return;
//     }

//     if (typeof bankValue === 'object') {
//       const existingName =
//         bankValue.name ||
//         bankValue.bank_name ||
//         bankValue.title;

//       if (existingName) {
//         setFetchedBankName(existingName);
//         return;
//       }
//     }

//     const fetchBankName = async () => {
//       try {
//         const token = localStorage.getItem('access_token');

//         const response = await fetch(
//           `${BASE}/api/banks/${bankId}/`,
//           {
//             headers: {
//               'Content-Type': 'application/json',
//               ...(token
//                 ? { Authorization: `Bearer ${token}` }
//                 : {}),
//             },
//           }
//         );

//         if (!response.ok) {
//           throw new Error(
//             `HTTP error! status: ${response.status}`
//           );
//         }

//         const data = await response.json();

//         setFetchedBankName(
//           data?.name ||
//             data?.bank_name ||
//             data?.title ||
//             ''
//         );
//       } catch (error) {
//         console.error('Error fetching bank name:', error);
//         setFetchedBankName('');
//       }
//     };

//     fetchBankName();
//   }, [transaction?.bank]);

//   // =========================================================
//   // BASIC HELPERS
//   // =========================================================

//   const safeValue = (value, fallback = '-') => {
//     if (value === null || value === undefined || value === '') {
//       return fallback;
//     }
//     return value;
//   };

//   const renderValue = (value) => {
//     if (value === null || value === undefined || value === '') {
//       return '-';
//     }

//     if (typeof value === 'object') {
//       return (
//         value.name ||
//         value.bank_name ||
//         value.cashbox_name ||
//         value.account_name ||
//         value.title ||
//         value.username ||
//         value.full_name ||
//         value.fullName ||
//         value.description ||
//         value.id ||
//         '-'
//       );
//     }

//     return value;
//   };

//   const getObjectName = (value) => renderValue(value);

//   // =========================================================
//   // TRANSACTION NUMBER
//   // =========================================================

//   const getTransactionNumber = () => {
//     return (
//       transaction.transaction_no ||
//       transaction.transaction_number ||
//       transaction.voucher_no ||
//       transaction.voucher_number ||
//       transaction.receipt_no ||
//       transaction.receipt_number ||
//       transaction.number ||
//       transaction.id ||
//       'TRX-260914-0AAF'
//     );
//   };

//   // =========================================================
//   // TRN
//   // =========================================================

//   const getTRN = () => {
//     return (
//       transaction.trn ||
//       transaction.tax_registration_number ||
//       transaction.company_trn ||
//       transaction.company_tax_number ||
//       getTransactionNumber()
//     );
//   };

//   // =========================================================
//   // CURRENCY
//   // =========================================================

//   const getCurrency = () => {
//     return (
//       transaction.currency ||
//       transaction.currency_code ||
//       'AED'
//     );
//   };

//   // =========================================================
//   // PAYMENT METHOD
//   // =========================================================

//   const getPaymentMethodLabel = () => {
//     const method = transaction.payment_method;

//     if (method === 'banks' || method === 'bank') {
//       return 'تحويل بنكي';
//     }
//     if (method === 'cash') {
//       return 'Cash | نقدى';
//     }
//     if (method === 'cheque' || method === 'check') {
//       return 'Cheque | شيك';
//     }
//     if (method === 'transfer' || method === 'bank_transfer') {
//       return 'Bank Transfer | تحويل بنكي';
//     }
//     return safeValue(method);
//   };

//   // =========================================================
//   // ACCOUNT
//   // =========================================================

//   const getAccountName = () => {
//     return getObjectName(
//       transaction.account_from ||
//         transaction.account ||
//         transaction.account_name
//     );
//   };

//   // =========================================================
//   // BANK
//   // =========================================================

//   const getBankName = () => {
//     if (fetchedBankName) {
//       return fetchedBankName;
//     }

//     if (
//       transaction.bank_name &&
//       typeof transaction.bank_name !== 'object'
//     ) {
//       return transaction.bank_name;
//     }

//     if (
//       transaction.bank_name &&
//       typeof transaction.bank_name === 'object'
//     ) {
//       return (
//         transaction.bank_name.name ||
//         transaction.bank_name.bank_name ||
//         transaction.bank_name.title ||
//         '-'
//       );
//     }

//     if (
//       transaction.bank &&
//       typeof transaction.bank === 'object'
//     ) {
//       return (
//         transaction.bank.name ||
//         transaction.bank.bank_name ||
//         transaction.bank.title ||
//         '-'
//       );
//     }

//     return '-';
//   };

//   // =========================================================
//   // CASHBOX
//   // =========================================================

//   const getCashboxName = () => {
//     return getObjectName(
//       transaction.cashbox ||
//         transaction.cash_box ||
//         transaction.cashbox_name
//     );
//   };

//   // =========================================================
//   // CHECK BANK
//   // =========================================================

//   const getCheckBankName = () => {
//     return getObjectName(
//       transaction.check_bank ||
//         transaction.cheque_bank ||
//         transaction.bank
//     );
//   };

//   // =========================================================
//   // USER
//   // =========================================================

//   const getTransactionUserName = () => {
//     return getObjectName(
//       transaction.transaction_user_name ||
//         transaction.created_by ||
//         transaction.user ||
//         transaction.employee
//     );
//   };

//   // =========================================================
//   // PERSON
//   // =========================================================

//   const getPersonName = () => {
//     return (
//       transaction.person_deliver ||
//       transaction.person_name ||
//       transaction.customer_name ||
//       transaction.client_name ||
//       transaction.customer?.name ||
//       transaction.client?.name ||
//       transaction.customer?.full_name ||
//       transaction.client?.full_name ||
//       '-'
//     );
//   };

//   const getPersonPhone = () => {
//     return (
//       transaction.phone ||
//       transaction.person_phone ||
//       transaction.customer_phone ||
//       transaction.client_phone ||
//       transaction.customer?.phone ||
//       transaction.client?.phone ||
//       '-'
//     );
//   };

//   const getPersonEmail = () => {
//     return (
//       transaction.email ||
//       transaction.person_email ||
//       transaction.customer_email ||
//       transaction.client_email ||
//       transaction.customer?.email ||
//       transaction.client?.email ||
//       ''
//     );
//   };

//   // =========================================================
//   // AMOUNT
//   // =========================================================

//   const getAmount = () => {
//     const amount = Number(
//       transaction.amount ??
//         transaction.total_amount ??
//         transaction.received_amount ??
//         0
//     );

//     if (Number.isNaN(amount)) {
//       return 0;
//     }
//     return amount;
//   };

//   const formatAmount = (amount = getAmount()) => {
//     return Number(amount || 0).toLocaleString('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   };

//   // =========================================================
//   // DATE
//   // =========================================================

//   const formatDate = (value) => {
//     if (!value) return '-';

//     try {
//       const date = new Date(value);
//       if (Number.isNaN(date.getTime())) return value;

//       return date.toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//       });
//     } catch (error) {
//       return value;
//     }
//   };

//   // =========================================================
//   // DATE + TIME
//   // =========================================================

//   const formatDateTime = (value) => {
//     if (!value) return '-';

//     try {
//       const date = new Date(value);
//       if (Number.isNaN(date.getTime())) return value;

//       return date.toLocaleString('en-GB', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit',
//         hour12: false,
//       });
//     } catch (error) {
//       return value;
//     }
//   };

//   // =========================================================
//   // ENGLISH NUMBER TO WORDS
//   // =========================================================

//   const numberToWords = (number) => {
//     const ones = [
//       '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
//       'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
//       'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
//       'Seventeen', 'Eighteen', 'Nineteen',
//     ];

//     const tens = [
//       '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
//       'Sixty', 'Seventy', 'Eighty', 'Ninety',
//     ];

//     const convertBelowThousand = (num) => {
//       let result = '';

//       if (num >= 100) {
//         result += `${ones[Math.floor(num / 100)]} Hundred`;
//         num %= 100;
//         if (num > 0) result += ' ';
//       }

//       if (num >= 20) {
//         result += tens[Math.floor(num / 10)];
//         num %= 10;
//         if (num > 0) result += ` ${ones[num]}`;
//       } else if (num > 0) {
//         result += ones[num];
//       }

//       return result;
//     };

//     if (number === 0) return 'Zero';

//     let num = Math.floor(number);
//     let result = '';

//     const millions = Math.floor(num / 1000000);
//     if (millions > 0) {
//       result += `${convertBelowThousand(millions)} Million`;
//       num %= 1000000;
//       if (num > 0) result += ' ';
//     }

//     const thousands = Math.floor(num / 1000);
//     if (thousands > 0) {
//       result += `${convertBelowThousand(thousands)} Thousand`;
//       num %= 1000;
//       if (num > 0) result += ' ';
//     }

//     if (num > 0) result += convertBelowThousand(num);

//     return result.trim();
//   };

//   // =========================================================
//   // ENGLISH AMOUNT
//   // =========================================================

//   const getEnglishAmountWords = () => {
//     const custom =
//       transaction.amount_to_english ||
//       transaction.amount_in_words_en ||
//       transaction.amount_words_en ||
//       transaction.amount_in_words;

//     if (custom) return custom;

//     const amount = getAmount();
//     const whole = Math.floor(amount);
//     const fils = Math.round((amount - whole) * 100);

//     let result = numberToWords(whole);
//     if (whole === 1) result += ' Thousand';
//     if (fils > 0) {
//       result += ` and ${numberToWords(fils)} Fils`;
//     }

//     return `${result} ${getCurrency()} Only`;
//   };

//   // =========================================================
//   // ARABIC AMOUNT
//   // =========================================================

//   const getArabicAmountWords = () => {
//     return (
//       transaction.amount_to_arabic ||
//       transaction.amount_in_words_ar ||
//       transaction.amount_words_ar ||
//       `فقط ${formatAmount()} ${
//         getCurrency() === 'AED'
//           ? 'درهم إماراتي'
//           : getCurrency()
//       }`
//     );
//   };

//   // =========================================================
//   // STATEMENT
//   // =========================================================

//   const getStatement = () => {
//     return (
//       transaction.statement ||
//       transaction.description ||
//       transaction.narration ||
//       transaction.notes ||
//       'استلام مبلغ إيداع'
//     );
//   };

//   // =========================================================
//   // CONTRACT INFORMATION
//   // =========================================================

//   const getPropertyName = () => {
//     return (
//       transaction.property_name ||
//       transaction.property?.name ||
//       transaction.project_name ||
//       transaction.contract_property ||
//       ''
//     );
//   };

//   const getContractNumber = () => {
//     return (
//       transaction.contract_no ||
//       transaction.contract_number ||
//       transaction.contract_id ||
//       transaction.reference_contract ||
//       ''
//     );
//   };

//   const getContractStartDate = () => {
//     return (
//       transaction.contract_start_date ||
//       transaction.start_date ||
//       transaction.from_date ||
//       transaction.rental_start_date ||
//       ''
//     );
//   };

//   const getContractEndDate = () => {
//     return (
//       transaction.contract_end_date ||
//       transaction.end_date ||
//       transaction.to_date ||
//       transaction.rental_end_date ||
//       ''
//     );
//   };

//   const getRentValue = () => {
//     return (
//       transaction.rent_value ||
//       transaction.rental_value ||
//       transaction.contract_value ||
//       transaction.rent_amount ||
//       ''
//     );
//   };

//   // =========================================================
//   // BEING
//   // =========================================================

//   const getBeingEnglish = () => {
//     return (
//       transaction.being_english ||
//       transaction.being ||
//       transaction.statement_english ||
//       'Received Against Payment'
//     );
//   };

//   const getBeingArabic = () => {
//     return (
//       transaction.being_arabic ||
//       transaction.statement ||
//       'وذلك عن استلام المبلغ'
//     );
//   };

//   // =========================================================
//   // TABLE ROWS
//   // =========================================================

//   const getTableRows = () => {
//     const source =
//       transaction.items ||
//       transaction.fee_items ||
//       transaction.receipt_items ||
//       transaction.installments ||
//       transaction.details ||
//       transaction.lines;

//     if (Array.isArray(source) && source.length > 0) {
//       return source;
//     }

//     return [
//       {
//         description:
//           transaction.statement ||
//           transaction.description ||
//           'Deposit | إيداع',
//         amount: getAmount(),
//         due_date:
//           transaction.due_date ||
//           transaction.transaction_date,
//         payment_method: getPaymentMethodLabel(),
//         cheque_no:
//           transaction.check_no ||
//           transaction.cheque_no ||
//           '',
//         cheque_date:
//           transaction.check_date ||
//           transaction.cheque_date ||
//           transaction.transaction_date,
//         bank: getBankName(),
//       },
//     ];
//   };

//   // =========================================================
//   // TABLE VALUES
//   // =========================================================

//   const getRowDescription = (row) => {
//     return (
//       row.description ||
//       row.fee_item ||
//       row.fee_name ||
//       row.item ||
//       row.name ||
//       row.title ||
//       row.statement ||
//       'Deposit | إيداع'
//     );
//   };

//   const getRowAmount = (row) => {
//     return (
//       row.amount ?? row.total ?? row.value ?? row.price ?? 0
//     );
//   };

//   const getRowDueDate = (row) => {
//     return (
//       row.due_date ||
//       row.dueDate ||
//       row.installment_date ||
//       row.date_due ||
//       transaction.transaction_date
//     );
//   };

//   const getRowPaymentType = (row) => {
//     const method =
//       row.payment_method ||
//       row.payment_type ||
//       transaction.payment_method;

//     if (
//       method === 'banks' ||
//       method === 'bank' ||
//       method === 'cheque' ||
//       method === 'check'
//     ) {
//       return 'Cheque | شيك';
//     }
//     if (method === 'cash') {
//       return 'Cash | نقدى';
//     }
//     if (method === 'transfer' || method === 'bank_transfer') {
//       return 'Bank Transfer | تحويل';
//     }
//     return safeValue(method, 'Cash | نقدى');
//   };

//   const getRowChequeNumber = (row) => {
//     return (
//       row.cheque_no ||
//       row.check_no ||
//       row.cheque_number ||
//       row.check_number ||
//       ''
//     );
//   };

//   const getRowChequeDate = (row) => {
//     return (
//       row.cheque_date ||
//       row.check_date ||
//       row.date ||
//       transaction.transaction_date
//     );
//   };

//   // =========================================================
//   // ROW BANK
//   // =========================================================

//   const getRowBank = (row) => {
//     if (
//       row.bank_name &&
//       typeof row.bank_name !== 'object'
//     ) {
//       return row.bank_name;
//     }

//     if (
//       row.bank_name &&
//       typeof row.bank_name === 'object'
//     ) {
//       return (
//         row.bank_name.name ||
//         row.bank_name.bank_name ||
//         row.bank_name.title ||
//         getBankName()
//       );
//     }

//     if (row.bank && typeof row.bank === 'object') {
//       return (
//         row.bank.name ||
//         row.bank.bank_name ||
//         row.bank.title ||
//         getBankName()
//       );
//     }

//     if (row.bank && typeof row.bank !== 'object') {
//       return row.bank;
//     }

//     if (row.check_bank) {
//       return getObjectName(row.check_bank);
//     }

//     if (row.cheque_bank) {
//       return getObjectName(row.cheque_bank);
//     }

//     return getBankName();
//   };

//   // =========================================================
//   // TABLE DATA
//   // =========================================================

//   const tableRows = getTableRows();

//   const totalTableAmount = tableRows.reduce(
//     (total, row) =>
//       total + Number(getRowAmount(row) || 0),
//     0
//   );

//   // =========================================================
//   // CHEQUE DETECTION
//   // ---------------------------------------------------------
//   // This is the ONLY new logic.
//   //
//   // `hasCheque` is true if:
//   //   - the transaction itself carries a cheque number, OR
//   //   - at least one row in the table has a cheque number.
//   //
//   // When it is false, the table hides:
//   //   1. the two <col> entries for the cheque columns,
//   //   2. the two <th> headers ("Cheque" / "Date"),
//   //   3. the two <td> cells inside each row,
//   //   4. and the footer colSpan shrinks to keep the row
//   //      spanning the correct number of remaining columns.
//   //
//   // Everything else in the component is unchanged.
//   // =========================================================

//   const hasCheque = Boolean(
//     transaction.check_no ||
//       transaction.cheque_no ||
//       transaction.check_number ||
//       transaction.cheque_number ||
//       (Array.isArray(tableRows) &&
//         tableRows.some((row) => {
//           if (!row) return false;
//           return (
//             row.cheque_no ||
//             row.check_no ||
//             row.cheque_number ||
//             row.check_number
//           );
//         }))
//   );

//   // =========================================================
//   // PRINT
//   // =========================================================

//   const handlePrint = () => {
//     if (!printRef.current) return;

//     const voucherElement = printRef.current.cloneNode(true);
//     if (!voucherElement) return;

//     voucherElement
//       .querySelectorAll('.voucher-no-print')
//       .forEach((element) => element.remove());

//     voucherElement.id = 'voucher-print-copy';

//     const printWindow = window.open(
//       '',
//       '_blank',
//       'width=900,height=1200,scrollbars=yes,resizable=yes'
//     );

//     if (!printWindow) {
//       window.alert(
//         'Please allow pop-ups for this website to print the voucher.'
//       );
//       return;
//     }

//     const styleElements = Array.from(
//       document.querySelectorAll(
//         'style, link[rel="stylesheet"]'
//       )
//     );

//     const copiedStyles = styleElements
//       .map((element) => element.outerHTML)
//       .join('\n');

//     const printWindowStyles = `
//       html, body {
//         margin: 0 !important;
//         padding: 0 !important;
//         width: 100% !important;
//         min-height: 100% !important;
//         background: #ffffff !important;
//       }

//       body {
//         overflow: visible !important;
//         font-family: Arial, Helvetica, sans-serif;
//         color: #111111;
//       }

//       #voucher-print-root {
//         width: 100%;
//         margin: 0;
//         padding: 0;
//         background: #ffffff;
//       }

//       #voucher-print-copy {
//         display: block !important;
//         position: static !important;
//         width: 100% !important;
//         max-width: none !important;
//         margin: 0 !important;
//         padding: 0 !important;
//         background: #ffffff !important;
//         color: #111111 !important;
//         border: none !important;
//         box-shadow: none !important;
//         overflow: visible !important;
//         visibility: visible !important;
//       }

//       #voucher-print-copy * {
//         visibility: visible !important;
//       }

//       .voucher-no-print { display: none !important; }

//       .voucher-paper {
//         display: block !important;
//         position: static !important;
//         width: 100% !important;
//         max-width: none !important;
//         margin: 0 !important;
//         padding: 0 !important;
//         background: #ffffff !important;
//         border: none !important;
//         box-shadow: none !important;
//         overflow: visible !important;
//       }

//       .receipt-paper {
//         display: block !important;
//         width: 100% !important;
//         font-family: Arial, Helvetica, sans-serif !important;
//         color: #111111 !important;
//         background: #ffffff !important;
//         visibility: visible !important;
//       }

//       .receipt-paper * {
//         visibility: visible !important;
//         box-sizing: border-box;
//       }

//       /* ---- LOGO: smaller, zero margins in print window ---- */
//       .voucher-logo-area {
//         display: flex !important;
//         width: 100% !important;
//         flex-direction: column !important;
//         align-items: flex-end !important;
//         justify-content: flex-start !important;
//         padding-left: 0 !important;
//         padding-top: 0 !important;
//         padding-bottom: 0 !important;
//         overflow: visible !important;
//         visibility: visible !important;
//       }

//       .voucher-logo-img {
//         display: block !important;
//         visibility: visible !important;
//         opacity: 1 !important;
//         height: 90px !important;
//         width: auto !important;
//         max-width: none !important;
//         object-fit: contain !important;
//         object-position: right center !important;
//         margin-top: 0 !important;
//         margin-bottom: 0 !important;
//         margin-left: 0 !important;
//         transform: none !important;
//         -webkit-print-color-adjust: exact !important;
//         print-color-adjust: exact !important;
//       }

//       .receipt-table {
//         width: 100% !important;
//         border-collapse: collapse !important;
//         table-layout: fixed !important;
//         page-break-inside: auto !important;
//       }

//       .receipt-table th,
//       .receipt-table td {
//         border: 1px solid #9ca3af !important;
//         vertical-align: middle !important;
//       }

//       .receipt-table tr {
//         page-break-inside: avoid !important;
//         page-break-after: auto !important;
//       }

//       .receipt-table thead { display: table-header-group !important; }
//       .receipt-table tfoot { display: table-footer-group !important; }

//       .voucher-header-separator {
//         display: flex !important;
//         align-items: center !important;
//         justify-content: flex-end !important;
//         gap: 8px !important;
//         width: 100% !important;
//       }

//       .voucher-header-line {
//         display: block !important;
//         flex: 1 1 auto !important;
//         width: auto !important;
//         height: 2px !important;
//         background: linear-gradient(
//           to left,
//           rgba(255, 255, 255, 0.8),
//           #a47d52
//         ) !important;
//         -webkit-print-color-adjust: exact !important;
//         print-color-adjust: exact !important;
//       }

//       .voucher-stamp-area {
//         display: flex !important;
//         flex-direction: column !important;
//         align-items: center !important;
//         justify-content: center !important;
//         page-break-inside: avoid !important;
//       }

//       .voucher-stamp-image {
//         display: block !important;
//         width: 105px !important;
//         height: 105px !important;
//         max-width: 105px !important;
//         max-height: 105px !important;
//         object-fit: contain !important;
//         margin: 0 auto !important;
//       }

//       .voucher-stamp-label {
//         display: block !important;
//         margin-top: 4px !important;
//         text-align: center !important;
//         font-size: 9px !important;
//         font-weight: 800 !important;
//       }

//       .voucher-footer {
//         width: 100% !important;
//         background: #f8f7f5 !important;
//         border-top: 2px solid #a47d52 !important;
//         page-break-inside: avoid !important;
//       }

//       .voucher-footer-services {
//         color: #a47d52 !important;
//         background: #f8f7f5 !important;
//         border-bottom: 1px solid #a47d52 !important;
//       }

//       .voucher-footer-contact {
//         color: #111111 !important;
//         background: #f8f7f5 !important;
//       }

//       .voucher-footer-company { color: #a47d52 !important; }

//       .voucher-footer-contact-row {
//         display: flex !important;
//         align-items: center !important;
//         justify-content: center !important;
//         flex-wrap: wrap !important;
//       }

//       img { max-width: 100% !important; }

//       .mx-auto {
//         margin-left: auto !important;
//         margin-right: auto !important;
//       }

//       @page {
//         size: A4 portrait;
//         margin: 5mm 6mm 6mm 6mm;
//       }

//       @media print {
//         html {
//           direction: rtl !important;
//         }

//         body {
//           direction: rtl !important;
//           text-align: right !important;
//         }

//         #deposit-voucher-print {
//           direction: rtl !important;
//           text-align: right !important;
//         }

//         * {
//           -webkit-print-color-adjust: exact !important;
//           print-color-adjust: exact !important;
//         }
//       }
//     `;

//     printWindow.document.open();

//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html lang="en">
//         <head>
//           <meta charset="UTF-8" />
//           <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//           <title>Receipt Voucher - ${getTransactionNumber()}</title>
//           ${copiedStyles}
//           <style>
//             ${PRINT_STYLES}
//             ${printWindowStyles}
//           </style>
//         </head>
//         <body>
//           <div id="voucher-print-root">
//             ${voucherElement.outerHTML}
//           </div>
//         </body>
//       </html>
//     `);

//     printWindow.document.close();

//     const startPrinting = () => {
//       const images = Array.from(
//         printWindow.document.images
//       );

//       const imagePromises = images.map((image) => {
//         if (image.complete) return Promise.resolve();

//         return new Promise((resolve) => {
//           image.onload = resolve;
//           image.onerror = resolve;
//         });
//       });

//       Promise.all(imagePromises).then(() => {
//         setTimeout(() => {
//           try {
//             printWindow.focus();
//             printWindow.print();
//           } catch (error) {
//             console.error('Voucher print error:', error);
//           }
//         }, 300);
//       });
//     };

//     if (printWindow.document.readyState === 'complete') {
//       startPrinting();
//     } else {
//       printWindow.addEventListener('load', startPrinting, {
//         once: true,
//       });
//     }

//     printWindow.onafterprint = () => {
//       setTimeout(() => {
//         try {
//           printWindow.close();
//         } catch (error) {
//           // Ignore close errors.
//         }
//       }, 100);
//     };
//   };

//   // =========================================================
//   // DOWNLOAD PDF
//   // =========================================================

//   const handleDownloadPDF = async () => {
//     if (!printRef.current) return;

//     let tempContainer = null;

//     try {
//       const source = printRef.current;

//       // ---------------------------------------------------------
//       // CREATE CLEAN PDF CLONE
//       // ---------------------------------------------------------

//       const voucherElement = source.cloneNode(true);

//       voucherElement
//         .querySelectorAll('.voucher-no-print')
//         .forEach((element) => element.remove());

//       voucherElement.id = 'voucher-pdf-copy';

//       // ---------------------------------------------------------
//       // PDF TEMP CONTAINER (A4 CSS size: 794 x 1123 px)
//       // ---------------------------------------------------------

//       tempContainer = document.createElement('div');

//       Object.assign(tempContainer.style, {
//         position: 'fixed',
//         left: '-10000px',
//         top: '0',
//         width: '794px',
//         minHeight: '1123px',
//         margin: '0',
//         padding: '0',
//         background: '#ffffff',
//         overflow: 'visible',
//         visibility: 'visible',
//         opacity: '1',
//         pointerEvents: 'none',
//         zIndex: '-1',
//         direction: 'rtl',
//       });

//       // ---------------------------------------------------------
//       // PDF-SAFE STYLES
//       // ---------------------------------------------------------

//       const styleElement = document.createElement('style');

//       styleElement.textContent = `
//         * { box-sizing: border-box; }

//         html, body {
//           margin: 0 !important;
//           padding: 0 !important;
//           background: #ffffff !important;
//         }

//         #voucher-pdf-copy {
//           display: block !important;
//           width: 794px !important;
//           max-width: 794px !important;
//           min-height: 1123px !important;
//           margin: 0 !important;
//           padding: 24px !important;
//           background: #ffffff !important;
//           color: #111111 !important;
//           direction: rtl !important;
//           font-family: Arial, Helvetica, sans-serif !important;
//           overflow: visible !important;
//           transform: none !important;
//           scale: 1 !important;
//         }

//         #voucher-pdf-copy * { box-sizing: border-box !important; }

//         #voucher-pdf-copy .shadow-xl,
//         #voucher-pdf-copy .shadow-2xl,
//         #voucher-pdf-copy .shadow-lg,
//         #voucher-pdf-copy .shadow-md { box-shadow: none !important; }

//         #voucher-pdf-copy .bg-white { background: #ffffff !important; }
//         #voucher-pdf-copy .bg-\\[\\#f8f7f5\\] { background: #f8f7f5 !important; }
//         #voucher-pdf-copy .bg-slate-50 { background: #f8fafc !important; }
//         #voucher-pdf-copy .bg-slate-100 { background: #f1f5f9 !important; }
//         #voucher-pdf-copy .bg-slate-200 { background: #e2e8f0 !important; }
//         #voucher-pdf-copy .bg-slate-300 { background: #cbd5e1 !important; }

//         #voucher-pdf-copy .text-white { color: #ffffff !important; }
//         #voucher-pdf-copy .text-black { color: #000000 !important; }
//         #voucher-pdf-copy .text-slate-800 { color: #1e293b !important; }
//         #voucher-pdf-copy .text-slate-700 { color: #334155 !important; }
//         #voucher-pdf-copy .text-slate-600 { color: #475569 !important; }
//         #voucher-pdf-copy .text-slate-500 { color: #64748b !important; }
//         #voucher-pdf-copy .text-\\[\\#a47d52\\] { color: #a47d52 !important; }

//         #voucher-pdf-copy img { max-width: 100% !important; }

//         #voucher-pdf-copy .voucher-logo-area {
//           display: flex !important;
//           width: 100% !important;
//           flex-direction: column !important;
//           align-items: flex-end !important;
//           justify-content: flex-start !important;
//           padding-left: 0 !important;
//           padding-top: 0 !important;
//           padding-bottom: 0 !important;
//           overflow: visible !important;
//           visibility: visible !important;
//         }

//         #voucher-pdf-copy .voucher-logo-img {
//           display: block !important;
//           visibility: visible !important;
//           opacity: 1 !important;
//           height: 90px !important;
//           width: auto !important;
//           max-width: none !important;
//           object-fit: contain !important;
//           object-position: right center !important;
//           margin-top: 0 !important;
//           margin-bottom: 0 !important;
//           margin-left: 0 !important;
//           transform: none !important;
//         }

//         #voucher-pdf-copy .voucher-header-separator {
//           display: flex !important;
//           align-items: center !important;
//           justify-content: center !important;
//           gap: 8px !important;
//           width: 100% !important;
//         }

//         #voucher-pdf-copy .voucher-header-line {
//           display: block !important;
//           flex: 1 1 auto !important;
//           width: auto !important;
//           height: 2px !important;
//           background: linear-gradient(
//             to left,
//             rgba(255, 255, 255, 0.8),
//             #a47d52
//           ) !important;
//         }

//         #voucher-pdf-copy .receipt-table {
//           width: 100% !important;
//           border-collapse: collapse !important;
//           table-layout: fixed !important;
//         }

//         #voucher-pdf-copy .receipt-table th,
//         #voucher-pdf-copy .receipt-table td {
//           border: 1px solid #9ca3af !important;
//           vertical-align: middle !important;
//         }

//         #voucher-pdf-copy .receipt-table tr {
//           page-break-inside: avoid !important;
//         }

//         #voucher-pdf-copy .voucher-stamp-area {
//           display: flex !important;
//           flex-direction: column !important;
//           align-items: center !important;
//           justify-content: center !important;
//           width: 100% !important;
//           page-break-inside: avoid !important;
//         }

//         #voucher-pdf-copy .voucher-stamp-image {
//           display: block !important;
//           width: 105px !important;
//           height: 105px !important;
//           max-width: 105px !important;
//           max-height: 105px !important;
//           object-fit: contain !important;
//           margin: 0 auto !important;
//         }

//         #voucher-pdf-copy .voucher-stamp-label {
//           display: block !important;
//           margin-top: 4px !important;
//           text-align: center !important;
//           font-size: 9px !important;
//           font-weight: 800 !important;
//           color: #111111 !important;
//         }

//         #voucher-pdf-copy .voucher-footer {
//           width: 100% !important;
//           background: #f8f7f5 !important;
//           border-top: 2px solid #a47d52 !important;
//           page-break-inside: avoid !important;
//         }

//         #voucher-pdf-copy .voucher-footer-services {
//           background: #f8f7f5 !important;
//           color: #a47d52 !important;
//           border-bottom: 1px solid #a47d52 !important;
//         }

//         #voucher-pdf-copy .voucher-footer-contact {
//           background: #f8f7f5 !important;
//           color: #111111 !important;
//         }

//         #voucher-pdf-copy .voucher-footer-company {
//           color: #a47d52 !important;
//         }

//         #voucher-pdf-copy .flex { display: flex !important; }
//         #voucher-pdf-copy .grid { display: grid !important; }

//         #voucher-pdf-copy [class*="bg-gradient"] {
//           background: transparent !important;
//         }

//         #voucher-pdf-copy {
//           position: static !important;
//           inset: auto !important;
//         }

//         #voucher-pdf-copy img {
//           visibility: visible !important;
//           opacity: 1 !important;
//         }
//       `;

//       tempContainer.appendChild(styleElement);
//       tempContainer.appendChild(voucherElement);

//       document.body.appendChild(tempContainer);

//       // ---------------------------------------------------------
//       // WAIT FOR IMAGES
//       // ---------------------------------------------------------

//       const images = Array.from(
//         tempContainer.querySelectorAll('img')
//       );

//       await Promise.all(
//         images.map((img) => {
//           return new Promise((resolve) => {
//             if (img.complete && img.naturalWidth > 0) {
//               resolve();
//               return;
//             }

//             const finish = () => resolve();

//             img.onload = finish;
//             img.onerror = finish;

//             setTimeout(finish, 5000);
//           });
//         })
//       );

//       // ---------------------------------------------------------
//       // WAIT FOR BROWSER PAINT
//       // ---------------------------------------------------------

//       await new Promise((resolve) => {
//         requestAnimationFrame(() => {
//           requestAnimationFrame(resolve);
//         });
//       });

//       // ---------------------------------------------------------
//       // HTML2CANVAS (html2canvas-pro handles oklch natively)
//       // ---------------------------------------------------------

//       const canvas = await html2canvas(voucherElement, {
//         scale: 2,
//         useCORS: true,
//         allowTaint: true,
//         backgroundColor: '#ffffff',
//         logging: false,
//         width: 794,
//         windowWidth: 794,
//         scrollX: 0,
//         scrollY: 0,
//         imageTimeout: 15000,
//         foreignObjectRendering: false,
//       });

//       // ---------------------------------------------------------
//       // REMOVE TEMP DOM
//       // ---------------------------------------------------------

//       if (tempContainer && tempContainer.parentNode) {
//         tempContainer.parentNode.removeChild(tempContainer);
//       }
//       tempContainer = null;

//       // ---------------------------------------------------------
//       // CREATE A4 PDF
//       // ---------------------------------------------------------

//       const pdf = new jsPDF({
//         orientation: 'portrait',
//         unit: 'mm',
//         format: 'a4',
//         compress: true,
//       });

//       const pdfWidth = pdf.internal.pageSize.getWidth();
//       const pdfHeight = pdf.internal.pageSize.getHeight();

//       const imageWidth = canvas.width;
//       const imageHeight = canvas.height;

//       const ratio = pdfWidth / imageWidth;

//       const pageHeightPx = pdfHeight / ratio;

//       const totalPages = Math.max(
//         1,
//         Math.ceil(imageHeight / pageHeightPx)
//       );

//       // ---------------------------------------------------------
//       // ADD EACH A4 PAGE
//       // ---------------------------------------------------------

//       for (let page = 0; page < totalPages; page++) {
//         if (page > 0) pdf.addPage();

//         const sourceY = page * pageHeightPx;

//         const sourceHeight = Math.min(
//           pageHeightPx,
//           imageHeight - sourceY
//         );

//         if (sourceHeight <= 0) continue;

//         const pageCanvas = document.createElement('canvas');
//         pageCanvas.width = imageWidth;
//         pageCanvas.height = Math.ceil(sourceHeight);

//         const context = pageCanvas.getContext('2d');

//         if (!context) {
//           throw new Error('Unable to create PDF canvas.');
//         }

//         context.fillStyle = '#ffffff';
//         context.fillRect(
//           0,
//           0,
//           pageCanvas.width,
//           pageCanvas.height
//         );

//         context.drawImage(
//           canvas,
//           0,
//           sourceY,
//           imageWidth,
//           sourceHeight,
//           0,
//           0,
//           imageWidth,
//           sourceHeight
//         );

//         const imageData = pageCanvas.toDataURL('image/jpeg', 0.95);

//         const pageHeight = sourceHeight * ratio;

//         pdf.addImage(
//           imageData,
//           'JPEG',
//           0,
//           0,
//           pdfWidth,
//           pageHeight,
//           undefined,
//           'FAST'
//         );
//       }

//       // ---------------------------------------------------------
//       // SAVE
//       // ---------------------------------------------------------

//       pdf.save(
//         `Receipt-Voucher-${getTransactionNumber()}.pdf`
//       );
//     } catch (error) {
//       console.error('PDF download error:', error);

//       alert(
//         'An error occurred while generating the PDF. Please try again.'
//       );

//       if (tempContainer && tempContainer.parentNode) {
//         tempContainer.parentNode.removeChild(tempContainer);
//       }
//     }
//   };

//   // =========================================================
//   // KEYBOARD
//   // =========================================================

//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       if (event.key === 'Escape') {
//         if (onClose) onClose();
//       }

//       if (
//         (event.ctrlKey || event.metaKey) &&
//         event.key.toLowerCase() === 'p'
//       ) {
//         event.preventDefault();
//         handlePrint();
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);

//     return () => {
//       window.removeEventListener('keydown', handleKeyDown);
//     };
//   }, [onClose]);

//   // =========================================================
//   // RENDER
//   // =========================================================

//   return (
//     <div className="contents">
//       <style>{PRINT_STYLES}</style>

//       <motion.div
//         dir="rtl"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4"
//       >
//         <motion.div
//           initial={{ opacity: 0, scale: 0.97, y: 15 }}
//           animate={{ opacity: 1, scale: 1, y: 0 }}
//           transition={{ duration: 0.2 }}
//           className="flex h-full max-h-[97vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-200 shadow-2xl"
//         >
//           {/* ACTION BAR */}
//           <div className="voucher-no-print flex shrink-0 items-center justify-between border-b border-slate-300 bg-white px-4 py-3">
//             <div className="text-righ w-full bg-[#f8f7f6]">
//               <h2 className="text-base font-black text-slate-800 sm:text-lg">
//                 سند قبض
//               </h2>
//               <p className="mt-0.5 text-xs text-slate-500">
//                 Receipt Voucher
//               </p>
//             </div>

//             <div className="flex items-center gap-2">
//               <button
//                 type="button"
//                 onClick={handleDownloadPDF}
//                 className="flex cursor-pointer items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
//               >
//                 <FaFilePdf />
//                 <span>PDF</span>
//               </button>

//               <button
//                 type="button"
//                 onClick={handlePrint}
//                 className="flex cursor-pointer items-center gap-2 rounded-md bg-[#a47d52] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#8d6843]"
//               >
//                 <FaPrint />
//                 <span>طباعة</span>
//               </button>

//               <button
//                 type="button"
//                 onClick={() => {
//                   if (onClose) onClose();
//                 }}
//                 className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-500"
//               >
//                 <FaTimes />
//               </button>
//             </div>
//           </div>

//           {/* PREVIEW AREA */}
//           <div className="flex-1 overflow-y-auto bg-slate-300 p-2 sm:p-6">
//             <div
//               id="deposit-voucher-print"
//               ref={printRef}
//               className="voucher-paper receipt-paper mx-auto w-full max-w-[794px] bg-white px-4 py-5 shadow-xl sm:px-1 sm:py-1"
//             >
//               {/* HEADER — logo exactly like the original component */}
//               <div className="voucher-logo-area">
//                 <img
//                   src={logo}
//                   alt="Broker City Properties"
//                   className="voucher-logo-img scale-[2] pl-7"
//                 />
//               </div>

//               {/* SEPARATOR — gold gradient line + icon */}
//               <div className="voucher-header-separator">
//                 <MdOutlineRealEstateAgent className="text-[#a47d52] text-base md:text-lg" />
//                 <div className="voucher-header-line"></div>
//               </div>

//               {/* TITLE */}
//               <div className="mt-2 w-full">
                
//                 <div className="relative flex w-full items-center justify-center gap-0 px-6 mb-5">

//   {/* ---------- LEFT BLOCK — Arabic ---------- */}
//   <div className="relative bg-[#a47d52] px-6 py-2">
//     <span className="text-[30px] font-black leading-none text-white">
//       سند قبض
//     </span>

//     {/* Left-pointing tail: colored RIGHT border */}
//     <div
//       className="
//         absolute left-[-12px] top-1/2 -translate-y-1/2
//         border-y-[22px] border-y-transparent
//         border-r-[12px] border-r-[#a47d52]
//       "
//     />
//   </div>

//   {/* ---------- RIGHT BLOCK — English ---------- */}
//   <div className="relative bg-[#3a2410] px-6 py-2">
//     <span className="text-[22px] font-black leading-none tracking-widest text-white">
//       RECEIPT VOUCHER
//     </span>

//     {/* Right-pointing tail: colored LEFT border */}
//     <div
//       className="
//         absolute right-[-12px] top-1/2 -translate-y-1/2
//         border-y-[22px] border-y-transparent
//         border-l-[12px] border-l-[#3a2410]
//       "
//     />
//   </div>

// </div>

//                 <div className="mt-2 text-center text-[13px] font-black" dir="ltr">
//                   TRN : {getTRN()}
//                 </div>
//               </div>

//               {/* SEPARATOR — gold gradient line + icon */}
//               <div className="voucher-header-separator">
//                 <MdOutlineRealEstateAgent className="text-[#a47d52] text-base md:text-lg" />
//                 <div className="voucher-header-line"></div>
//               </div>

//               {/* NUMBER / DATE / AMOUNT */}
//               <div className="mt-4 grid grid-cols-1 gap-40 sm:grid-cols-[1fr_420px]">
//                 <div className="flex flex-col items-stretch">
                  
                  
//                   <div
//   className="border border-slate-300 bg-[#f8f7f5] px-4 py-2 text-right"
//   dir="ltr"
// >
//   <div className="flex items-center justify-center gap-2 whitespace-nowrap font-black leading-none">
//     <span className="text-[22px] font-black">
//       {getCurrency()}
//     </span>
//     <span className="!text-[37px] font-black">
//       {formatAmount()}
//     </span>
//   </div>
// </div>

//                 </div>

//                 <div className="flex flex-col justify-center gap-3">
//                   <div className="flex w-full items-center justify-between gap-2 px-1 pb-1 text-[12px] font-bold">
//                     <span dir="ltr" className="w-[28%] text-left whitespace-nowrap">
//                       : الرقم
//                     </span>
//                     <span dir="ltr" className="flex-1 text-center font-black whitespace-nowrap">
//                       {getTransactionNumber()}
//                     </span>
//                     <span dir="rtl" className="w-[28%] text-right font-black whitespace-nowrap">
//                       : No
//                     </span>
//                   </div>

//                   <div className="flex w-full items-center justify-between gap-2  px-1 pb-1 text-[12px] font-bold">
//                     <span dir="ltr" className="w-[28%] text-left whitespace-nowrap">
//                       : التاريخ
//                     </span>
//                     <span dir="ltr" className="flex-1 text-center font-black whitespace-nowrap">
//                       {formatDate(
//                         transaction.transaction_date ||
//                           transaction.date ||
//                           transaction.created_at
//                       )}
//                     </span>
//                     <span dir="rtl" className="w-[28%] text-right font-black whitespace-nowrap">
//                       : Date
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* RECEIVED FROM */}
//               <div className="mt-2 text-center">
//                 <div className="flex items-center justify-between gap-x-50 gap-y-1 pt-4 px-1 text-[13px] font-bold bg-[#f8f7f5] py-2">
//                   <span dir="ltr">: استلمنا من</span>
//                   <span dir="ltr" className="font-black">
//                     {getPersonName()}
//                   </span>
//                   <span dir="rtl" className="font-black">
//                     : Received From
//                   </span>
//                 </div>

//                 <div className="mt-1 flex items-center justify-between gap-x-8 text-[10px] font-semibold">
//                   {getPersonPhone() !== '-' && (
//                     <span dir="ltr">
//                       Phone :
//                       <strong className="ml-1">{getPersonPhone()}</strong>
//                     </span>
//                   )}
//                   {getPersonEmail() && (
//                     <span dir="ltr">
//                       Email :
//                       <strong className="ml-1">{getPersonEmail()}</strong>
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {/* AMOUNT IN WORDS */}
//               <div className="mt-2 text-center mx-auto">
//                 <div className="flex items-center justify-between gap-x-50 gap-y-1 pt-4 px-1 text-[13px] font-bold">
//                   <span dir="ltr">: مبلغ وقدره</span>
//                   <span dir="ltr" className="font-black">
//                     {formatAmountInWords(transaction.amount)}{' '}
//                     درهم فقط لاغير
//                   </span>
//                   <span dir="rtl" className="font-black">
//                     : The Sum of
//                   </span>
//                 </div>
//               </div>

//               {/* BEING */}
//               <div className="mt-2 text-center">
//                 <div className="flex flex-col gap-0 bg-[#f8f7f5] py-1">
//                   <div className="flex items-center justify-between gap-x-50 gap-y-1 pt-4 px-1 text-[13px] font-bold py-2">
//                     <span dir="rtl">وذلك عن :</span>
//                     <span dir="ltr" className="font-black">
//                       {getBeingArabic()}
//                     </span>
//                     <span dir="rtl" className="font-black">
//                       Being
//                     </span>
//                   </div>
//                 </div>

//                 <div className="mt-1 flex flex-wrap items-center justify-center gap-x-8 text-[10px] font-semibold">
//                   {getPersonPhone() !== '-' && (
//                     <span dir="ltr">
//                       Phone :
//                       <strong className="ml-1">{getPersonPhone()}</strong>
//                     </span>
//                   )}
//                   {getPersonEmail() && (
//                     <span dir="ltr">
//                       Email :
//                       <strong className="ml-1">{getPersonEmail()}</strong>
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {/* CONTRACT / PROPERTY */}
//               {(getPropertyName() ||
//                 getContractNumber() ||
//                 getContractStartDate() ||
//                 getContractEndDate() ||
//                 getRentValue()) && (
//                 <div className="mt-1 text-[10px] font-bold">
//                   <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
//                     <span>{getPropertyName()}</span>

//                     {getContractNumber() && (
//                       <span dir="ltr">
//                         Contract No:
//                         <strong className="ml-1">
//                           {getContractNumber()}
//                         </strong>
//                       </span>
//                     )}

//                     {getContractStartDate() && (
//                       <span dir="ltr">
//                         From:
//                         <strong className="ml-1">
//                           {formatDate(getContractStartDate())}
//                         </strong>
//                       </span>
//                     )}

//                     {getContractEndDate() && (
//                       <span dir="ltr">
//                         To:
//                         <strong className="ml-1">
//                           {formatDate(getContractEndDate())}
//                         </strong>
//                       </span>
//                     )}
//                   </div>

//                   {getRentValue() && (
//                     <div className="mt-0.5" dir="ltr">
//                       Rent Value:
//                       <strong className="ml-1">
//                         {getCurrency()} {formatAmount(getRentValue())}
//                       </strong>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* ARABIC CONTRACT */}
//               {(getPropertyName() || getContractNumber()) && (
//                 <div dir="rtl" className="mt-0.5 text-right text-[10px] font-bold">
//                   {getPropertyName() && <span>{getPropertyName()}</span>}

//                   {getContractNumber() && (
//                     <span className="mr-5">
//                       رقم العقد:
//                       <strong className="mr-1">
//                         {getContractNumber()}
//                       </strong>
//                     </span>
//                   )}

//                   {getRentValue() && (
//                     <span className="mr-5">
//                       القيمة الإيجارية:
//                       <strong className="mr-1">
//                         {formatAmount(getRentValue())} درهم
//                       </strong>
//                     </span>
//                   )}
//                 </div>
//               )}

//               {/* MAIN TABLE */}
//               <hr className="text-gray-300 mt-2" />

//             {/* Parent wrapper — full width */}
// <div className="mt-5 w-full">

//   <table
//     className="receipt-table w-full text-[8px] sm:text-[9px]"
//     style={{
//       width: '100%',
//       minWidth: '100%',
//       borderCollapse: 'collapse',
//       tableLayout: 'fixed',
//     }}
//   >
//     {/* ================================================
//         COLGROUP
//         Fees column removed because its header and cells
//         are commented out. Percentages now always sum to
//         exactly 100% with or without the cheque columns.
//         ================================================ */}
//     <colgroup>
//       {hasCheque ? (
//         <>
//           <col style={{ width: '5%' }} />   {/* S */}
//           <col style={{ width: '20%' }} />  {/* Amount */}
//           <col style={{ width: '15%' }} />  {/* Due Date */}
//           <col style={{ width: '15%' }} />  {/* Payment Type */}
//           <col style={{ width: '13%' }} />  {/* Cheque */}
//           <col style={{ width: '14%' }} />  {/* Cheque Date */}
//           <col style={{ width: '18%' }} />  {/* Bank */}
//         </>
//       ) : (
//         <>
//           <col style={{ width: '6%' }} />   {/* S */}
//           <col style={{ width: '26%' }} />  {/* Amount */}
//           <col style={{ width: '20%' }} />  {/* Due Date */}
//           <col style={{ width: '20%' }} />  {/* Payment Type */}
//           <col style={{ width: '28%' }} />  {/* Bank */}
//         </>
//       )}
//     </colgroup>

//     <thead>
//       <tr className="bg-[#f8f7f5]">
//         <th className="py-1.5" style={{ fontSize: '12px' }}>
//           S
//           <br />
//           <span dir="rtl">س</span>
//         </th>

//         <th className="py-1.5" style={{ fontSize: '12px' }}>
//           Amount
//           <br />
//           <span dir="rtl">المبلغ</span>
//         </th>
//         <th className="py-1.5" style={{ fontSize: '12px' }}>
//           Due Date
//           <br />
//           <span dir="rtl">تاريخ الاجراء</span>
//         </th>
//         <th className="py-1.5" style={{ fontSize: '12px' }}>
//           Payment Type
//           <br />
//           <span dir="rtl">طريقة الدفع</span>
//         </th>

//         {hasCheque && (
//           <>
//             <th className="py-1.5" style={{ fontSize: '12px' }}>
//               Cheque
//               <br />
//               <span dir="rtl">رقم الشيك</span>
//             </th>
//             <th className="py-1.5" style={{ fontSize: '12px' }}>
//               Date
//               <br />
//               <span dir="rtl">تاريخ الشيك</span>
//             </th>
//           </>
//         )}

//         <th className="py-1.5" style={{ fontSize: '12px' }}>
//           Bank
//           <br />
//           <span dir="rtl">البنك</span>
//         </th>
//       </tr>
//     </thead>

//     <tbody>
//       {tableRows.map((row, index) => (
//         <tr
//           key={row.id || row.pk || index}
//           className="text-center"
//         >
//           <td
//             className="px-1 py-1.5 font-bold"
//             style={{ fontSize: '15px' }}
//           >
//             {index + 1}
//           </td>

//           <td
//             className="px-1 py-1.5 font-semibold text-center"
//             dir="ltr"
//             style={{ fontSize: '15px' }}
//           >
//             {formatAmount(getRowAmount(row))}
//           </td>
//           <td
//             className="px-1 py-1.5 font-semibold"
//             style={{ fontSize: '13px' }}
//             dir="ltr"
//           >
//             {formatDate(getRowDueDate(row))}
//           </td>
//           <td
//             className="px-1 py-1.5 font-semibold"
//             style={{ fontSize: '15px' }}
//           >
//             {getRowPaymentType(row)}
//           </td>

//           {hasCheque && (
//             <>
//               <td
//                 className="px-1 py-1.5 font-semibold"
//                 dir="ltr"
//                 style={{ fontSize: '13px' }}
//               >
//                 {getRowChequeNumber(row) || ''}
//               </td>
//               <td
//                 className="px-1 py-1.5 font-semibold"
//                 dir="ltr"
//                 style={{ fontSize: '13px' }}
//               >
//                 {getRowChequeNumber(row)
//                   ? formatDate(getRowChequeDate(row))
//                   : ''}
//               </td>
//             </>
//           )}

//           <td
//             dir="auto"
//             className="px-1 py-1.5 text-center font-semibold"
//             style={{ fontSize: '15px' }}
//           >
//             {getRowBank(row)}
//           </td>
//         </tr>
//       ))}
//     </tbody>

//     <tfoot className ='bg-[#f8f7f5]'>
//       <tr>
//         <td
//           colSpan={1}
//           dir="rtl"
//           className="px-1 py-1.5 text-right font-black"
//         >
         
//         </td>

//         <td
//           className="px-1 py-1.5 text-center font-black"
//           dir="ltr"
//           style={{ fontSize: '13px' }}
//         >
//           {formatAmount(totalTableAmount)}
//         </td>

//         {/* Footer span fills the remaining columns */}
//         <td
//           colSpan={hasCheque ? 5 : 3}
//           className="px-1 py-1.5 text-center font-bold"
//         >
//           {getCurrency()}
//         </td>
//       </tr>
//     </tfoot>
//   </table>
// </div>

//               {/* COMPANY STAMP */}
//               <div className="voucher-stamp-area mt-5">
//                 <img
//                   src={stamp}
//                   alt="Company Stamp"
//                   className="voucher-stamp-image scale-[2]"
//                 />
//                 <div className="voucher-stamp-label" dir="rtl">
//                   اعتماد الاداره | Company Stamp
//                 </div>
//               </div>

//               {/* FOOTER */}
//               <div className="voucher-footer mt-5 bg-[#f8f7f5]">
//                 <div className="voucher-footer-services" dir="auto">
//                   Buy - Sell - Rent - Property Management -
//                   Valuation &amp; Appraisal - General Maintenance
//                   <span className="mx-2">|</span>
//                   بيع - شراء - تأجير - إدارة الأملاك -
//                   التقييم والتثمين - صيانة عامة
//                 </div>

//                 <div className="voucher-footer-contact">
//                   <div className="voucher-footer-contact-row">
//                     <span dir="ltr">
//                       P.O.BOX : 7833 Abu Dhabi - U.A.E
//                     </span>
//                     <span>|</span>
//                     <span dir="rtl">
//                       ص.ب 7833 أبوظبي - الإمارات العربية المتحدة
//                     </span>
//                   </div>

//                   <div className="voucher-footer-contact-row">
//                     <span dir="ltr">+971 50 2000 195</span>
//                     <span>|</span>
//                     <span dir="ltr">☎ +971 2 6666 101</span>
//                     <span>|</span>
//                     <span dir="ltr">info@brokercity.ae</span>
//                   </div>

//                   <div className="voucher-footer-company" dir="ltr">
//                     BROKER CITY PROPERTIES
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </motion.div>
//     </div>
//   );
// };

// export default Voucher;


