// Fix ISO Currency
import React, { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SignatureCanvas from 'react-signature-canvas';
import logo from '../../../assets/images/logo.png'
import {
  FaFileInvoice,
  FaUser,
  FaStickyNote,
  FaFilePdf,
  FaCheckCircle,
  FaSignature,
  FaExchangeAlt,
  FaFileAlt,
  FaClock,
  FaPrint,
  FaDownload,
  FaSpinner,
  FaPen
} from 'react-icons/fa';
import { PiSignatureThin } from 'react-icons/pi';
import AddDeposit from './AddDeposit';
import AddWithdraw from './AddWithdraw';
import { CiEdit } from "react-icons/ci";
import UpdateTransaction from './UpdateTransaction';
import { formatAmountInWords } from '../../../utils/numberToArabic';
// ✅ NEW: Voucher components rendered inline instead of routing
import VoucherWithdraw from './VoucherWithdraw';
import Voucher from './Voucher';

// Base URL from environment variables
const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// Transaction type mapping to Arabic
const transactionTypeMap = {
  'deposit': 'إيداع',
  'withdraw': 'سحب',
};

// Transaction type display mapping
const transactionTypeDisplayMap = {
  'Deposit': 'إيداع',
  'Withdraw': 'سحب',
  'Deposit / Income': 'إيداع',
  'Withdraw / Expense': 'سحب',
};

// Payment method mapping to Arabic
const paymentMethodMap = {
  'cash': 'نقدي',
  'bank': 'بنكي',
  'bank_transfer': 'تحويل بنكي',
  'check': 'شيك',
  'credit_card': 'بطاقة ائتمان',
  'debit_card': 'بطاقة خصم',
  'online': 'إلكتروني',
  'mobile': 'جوال',
};

// Currency mapping to Arabic
const currencyMap = {
  'USD': 'دولار أمريكي',
  'EUR': 'يورو',
  'GBP': 'جنيه إسترليني',
  'AED': 'درهم إماراتي',
  'SAR': 'ريال سعودي',
  'JOD': 'دينار أردني',
  'KWD': 'دينار كويتي',
  'QAR': 'ريال قطري',
  'BHD': 'دينار بحريني',
  'OMR': 'ريال عماني',
};

// Currency symbols for display
const currencySymbols = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JOD': 'د.أ',
  'SAR': 'ر.س',
  'AED': 'د.إ',
  'KWD': 'د.ك',
  'QAR': 'ر.ق',
  'BHD': 'د.ب',
  'OMR': 'ر.ع',
  'دولار أمريكي': '$',
  'دينار أردني': 'د.أ',
  'ريال سعودي': 'ر.س',
  'درهم إماراتي': 'د.إ',
};

// Map Arabic currency names to ISO codes
const currencyCodeMap = {
  'دولار أمريكي': 'USD',
  'دينار أردني': 'JOD',
  'ريال سعودي': 'SAR',
  'درهم إماراتي': 'AED',
  'دينار كويتي': 'KWD',
  'ريال قطري': 'QAR',
  'دينار بحريني': 'BHD',
  'ريال عماني': 'OMR',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get Arabic transaction type
const getArabicTransactionType = (type) => {
  if (!type) return type;
  const lowerType = type.toLowerCase();
  return transactionTypeMap[lowerType] || type;
};

// Get Arabic transaction type display
const getArabicTransactionTypeDisplay = (typeDisplay) => {
  if (!typeDisplay) return typeDisplay;
  return transactionTypeDisplayMap[typeDisplay] || typeDisplay;
};

// Get Arabic payment method
const getArabicPaymentMethod = (method) => {
  if (!method) return method;
  const lowerMethod = method.toLowerCase();
  return paymentMethodMap[lowerMethod] || method;
};

// Get Arabic currency name
const getArabicCurrency = (currency) => {
  if (!currency) return currency;
  return currencyMap[currency] || currency;
};

// Get currency symbol
const getCurrencySymbol = (currency) => {
  if (!currency) return '';
  return currencySymbols[currency] || currency;
};

// Check if transaction is Withdraw/Expense
const isWithdrawOrExpense = (type) => {
  if (!type) return false;
  const lowerType = type.toLowerCase();
  return lowerType === 'withdraw' || lowerType === 'expense' || lowerType === 'withdrawal';
};

const TransactionDetails = ({ transactionId, onClose, onTransactionUpdate }) => {

    const [transactionData, setTransactionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [printing, setPrinting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const contentRef = useRef(null);

  // State for update modals
    // Signature Deposit update 
    const [showUpdateDepositModal, setShowUpdateDepositModal] = useState(false);
    // Signature withdrow update
    const [showUpdateWithdrawModal, setShowUpdateWithdrawModal] = useState(false);
    // Full update
    const [showUpdateTransactionModal, setShowUpdateTransactionModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // ✅ NEW: State to control voucher rendering instead of routing
    const [showVoucher, setShowVoucher] = useState(false);
    const [voucherInfo, setVoucherInfo] = useState(null);

    // Amount from numbers To languages
    const getAmountInWords = () => {
        if (!transactionData?.amount || parseFloat(transactionData.amount) <= 0) {
            return '';
        }
        return formatAmountInWords(transactionData.amount);
    };

  // Fetch transaction data when component mounts or transactionId changes
  useEffect(() => {
    const fetchTransactionData = async () => {
      if (!transactionId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          toast.error('يرجى تسجيل الدخول لعرض تفاصيل المعاملة');
          setLoading(false);
          return;
        }

        const url = `${BASE}/api/transactions/${transactionId}/`;
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
          } else if (response.status === 404) {
            toast.error('المعاملة غير موجودة');
          } else {
            toast.error('فشل تحميل تفاصيل المعاملة');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched transaction details:', data);
        
        setTransactionData(data);
        setLoading(false);
        
      } catch (err) {
        setError('فشل تحميل تفاصيل المعاملة');
        setLoading(false);
        console.error('Error fetching transaction details:', err);
        toast.error('❌ حدث خطأ أثناء جلب تفاصيل المعاملة');
      }
    };

    fetchTransactionData();
  }, [transactionId]);

  
  // Handle opening the Signature form based on transaction type
  const handleOpenUpdateForm = () => {
    if (!transactionData) return;

    setSelectedTransaction(transactionData);

    if (transactionData.type === 'deposit' || transactionData.type === 'income') {
      setShowUpdateDepositModal(true);
    } else if (transactionData.type === 'withdraw' || transactionData.type === 'expense') {
      setShowUpdateWithdrawModal(true);
    } else {
      toast.error('نوع المعاملة غير معروف للتحديث');
    }
  };


// Handle opening the full update form
  const handleOpenFullUpdate = () => {
    if (!transactionData) return;
    setSelectedTransaction(transactionData);
    setShowUpdateTransactionModal(true);
  };

  // Handle modal close and refresh
  const handleUpdateModalClose = () => {
    // signature update form
    setShowUpdateDepositModal(false);
    // signature update form
    setShowUpdateWithdrawModal(false);
    // Full update form
    setShowUpdateTransactionModal(false);
    setSelectedTransaction(null);
    
    if (transactionId) {
      const fetchUpdatedData = async () => {
        try {
          const token = localStorage.getItem('access_token');
          if (!token) return;

          const response = await fetch(`${BASE}/api/transactions/${transactionId}/`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setTransactionData(data);
            // toast.success('✅ تم تحديث المعاملة بنجاح');
            
            if (onTransactionUpdate) {
              onTransactionUpdate(data);
            }
          }
        } catch (error) {
          console.error('Error refreshing transaction data:', error);
        }
      };
      
      fetchUpdatedData();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Format currency with Arabic support
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    
    try {
      const currency = transactionData?.currency || 'USD';
      const symbol = getCurrencySymbol(currency);
      const formattedNumber = new Intl.NumberFormat('ar-EG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
      
      return `${formattedNumber} ${symbol}`;
    } catch (error) {
      console.warn('Currency formatting error:', error);
      return `${parseFloat(amount).toFixed(2)} ${transactionData?.currency || ''}`;
    }
  };

  // ============================================
  // ✅ UPDATED: Handle Print → show Voucher inline
  // ============================================
  const handlePrint = () => {
    if (!transactionData) return;

    setPrinting(true);

    try {
      const lowerType = (transactionData.type || '').toLowerCase();

      const isDeposit = lowerType === 'deposit' || lowerType === 'income';
      const isWithdraw = lowerType === 'withdraw' || lowerType === 'expense' || lowerType === 'withdrawal';

      if (!isDeposit && !isWithdraw) {
        toast.error('نوع المعاملة غير معروف للطباعة');
        setPrinting(false);
        return;
      }

      setVoucherInfo(transactionData);
      setShowVoucher(true);
    } catch (err) {
      console.error('Print error:', err);
      toast.error('❌ حدث خطأ أثناء فتح صفحة الطباعة');
    } finally {
      setPrinting(false);
    }
  };

  // ✅ NEW: Close the voucher overlay
  const handleVoucherClose = () => {
    setShowVoucher(false);
    setVoucherInfo(null);
  };

  // Handle Download as PDF/HTML
  const handleDownload = () => {
    setDownloading(true);
    try {
      const content = contentRef.current;
      if (!content) {
        setDownloading(false);
        return;
      }

      const clone = content.cloneNode(true);
      
      const styles = document.querySelectorAll('style');
      let styleText = '';
      styles.forEach(style => {
        styleText += style.innerHTML;
      });

      
    const htmlContent = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${transactionData?.type} - ${transactionData?.transaction_no || 'غير معروف'}</title>
    <style>
      ${styleText}
      
      body { 
        padding: 20px; 
        background: white;
        font-family: 'Arial', sans-serif;
        margin: 0;
      }
      .no-print {
        display: none !important;
      }
      
      /* STRICT HEADER STYLES */
      .report-header-wrapper {
        width: 100% !important;
        display: block !important;
        position: relative !important;
        z-index: 9999 !important;
        margin-bottom: 25px !important;
        padding-bottom: 10px !important;
        border-bottom: 2px solid #b08d57 !important; /* The HR line */
      }
      .report-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 100% !important;
      }
      .header-logo {
        max-height: 80px !important;
        max-width: 150px !important;
        object-fit: contain !important;
      }
      .header-title {
        font-size: 24px !important;
        font-weight: bold !important;
        color: #333 !important;
        text-align: right !important;
        margin: 0 !important;
        line-height: 1.2 !important;
      }
      .header-subtitle {
        font-size: 14px !important;
        color: #777 !important;
        text-align: right !important;
        margin: 0 !important;
        margin-top: 5px !important;
      }

      /* Ensure the cloned content doesn't overlap */
      #report-body {
        width: 100%;
        display: block;
      }

      @media print {
        .no-print { display: none !important; }
        body { padding: 0; }
        .report-header-wrapper {
          border-bottom: 2px solid #b08d57 !important; 
        }
      }
    </style>
  </head>
  <body>
    
    <!-- NEW HEADER WITH LOGO AND TITLE -->
    <div class="report-header-wrapper">
      <div class="report-header">
        <div style="text-align: right;">
          <h1 class="header-title">Broker City Properties</h1>
          <p class="header-subtitle">Real Estate & Brokerage Services</p>
        </div>
        <!-- REPLACE src WITH YOUR LOGO URL OR BASE64 -->
        <img src="YOUR_LOGO_URL_HERE" alt="Logo" class="header-logo">
      </div>
    </div>
    <!-- END HEADER -->

    <!-- ORIGINAL CLONED CONTENT CONTAINER -->
    <div id="report-body">
      ${clone.innerHTML}
    </div>

  </body>
  </html>
`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transaction_${transactionData?.transaction_no || 'unknown'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('✅ تم تحميل الملف بنجاح');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('❌ حدث خطأ أثناء التحميل');
    } finally {
      setDownloading(false);
    }
  };
     
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل تفاصيل المعاملة...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">خطأ</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5B45] transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!transactionData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">لا توجد بيانات للمعاملة</p>
      </div>
    );
  }

  const InfoCard = ({ icon: Icon, title, children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="text-[#8B7355] text-lg" />
        <h3 className="font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );


const InfoRow = ({ label, value, highlight = false, className = '', labelClassName = '', valueClassName = '' }) => (
  <div className={`flex justify-between items-center py-2 border-b border-gray-50 last:border-0 ${className}`}>
    <span className={`text-sm text-gray-600 ${labelClassName}`}>{label}</span>
    <span className={`text-sm font-medium ${highlight ? 'text-[#8B7355]' : 'text-gray-800'} ${valueClassName}`}>
      {value || '-'}
    </span>
  </div>
);


  // =========================================================
  // SignatureDisplay — Visual signature renderer
  // =========================================================
  const SignatureDisplay = ({ label, signatureData }) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check if signature exists
    const hasSignature =
      signatureData &&
      signatureData !== '' &&
      signatureData !== 'null' &&
      signatureData !== 'undefined';

    // Get image source - if it's not already a data URL, add the prefix
    const getImageSrc = (data) => {
      if (!data) return null;

      // If it's already a data URL
      if (data.startsWith('data:image/')) {
        return data;
      }

      // If it contains base64 but not the full data URL
      if (data.includes('base64,')) {
        return data;
      }

      // Assume it's just the base64 string
      return `data:image/png;base64,${data}`;
    };

    const imageSrc = getImageSrc(signatureData);

    if (!hasSignature) {
      return (
        <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500">{label}</span>
          <div className="h-16 w-full max-w-[160px] border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
            <FaSignature className="text-gray-400 text-xl" />
          </div>
          <span className="text-xs text-gray-400">لا يوجد توقيع</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <span className="text-xs text-gray-500">{label}</span>

        {isLoading && !imageError && (
          <div className="h-16 w-full max-w-[160px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B7355]"></div>
          </div>
        )}

        <img
          src={imageSrc}
          alt={label}
          className="h-16 w-full max-w-[160px] object-contain"
          style={{ display: isLoading ? 'none' : 'block' }}
          onLoad={() => {
            setIsLoading(false);
            console.log(`✅ ${label} loaded`);
          }}
          onError={(e) => {
            setImageError(true);
            setIsLoading(false);
            console.error(`❌ Failed to load ${label}`);
            e.target.style.display = 'none';
          }}
        />

        {imageError && (
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-full max-w-[160px] border-2 border-dashed border-red-300 rounded flex items-center justify-center bg-red-50">
              <FaSignature className="text-red-400 text-xl" />
            </div>
            <span className="text-xs text-red-400">خطأ في عرض التوقيع</span>
          </div>
        )}
      </div>
    );
  };


  // Get Arabic type display
  const arabicTypeDisplay = getArabicTransactionTypeDisplay(transactionData.type_display) || 
                            getArabicTransactionType(transactionData.type);

  const isWithdraw = isWithdrawOrExpense(transactionData.type);

  return (
    <div className="min-h-screen bg-[#f8f7f5]" dir="rtl">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />


          {/* Print-Only Header - Hidden on screen, visible when printing */}
          <div className="print-only-header hidden print:block print:mb-6 print:border-b print:border-gray-300 print:pb-4">
              <div className="no-print">
                  <div>
                      <h1 className="print:text-2xl print:font-bold print:text-gray-800">
                          تفاصيل المعاملة
                      </h1>
                      <p className="print:text-sm print:text-gray-500">
                          #{transactionData.transaction_no}
                      </p>
                  </div>
                  <div className="print:text-left">
                      <p className="print:text-sm print:text-gray-600">
                          التاريخ: {formatDate(transactionData.transaction_date)}
                      </p>
                      <p className="print:text-sm print:text-gray-600">
                          النوع: {arabicTypeDisplay}
                      </p>
                  </div>
              </div>
          </div>
      {/* Regular Header with Print and Download Buttons */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 flex items-center justify-between flex-wrap gap-3 sm:gap-4">
            
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-extrabold text-gray-800">تفاصيل المعاملة</h1>
              <p className="text-xs sm:text-sm text-gray-500">#{transactionData.transaction_no}</p>
              {/* FIXED: Type badge with Arabic */}
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${
                isWithdraw
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-green-100 text-green-800 border-green-200'
              }`}>
                {arabicTypeDisplay}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              
              
              {/* Signature/Update Button */}
              <button
                onClick={handleOpenFullUpdate}
                className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print text-sm"
                title="تعديل"
              >
                <CiEdit size="20" className='text-orange-800 sm:text-[25px]'/>
                <span>تعديل</span>
              </button>
              
              {/* Print Button */}
              <button
                onClick={handlePrint}
                disabled={printing}
                className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print text-sm"
                title="طباعة"
              >     
                {printing ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaPrint className='text-[#a47d52]'/>
                )}
                <span>طباعة</span>
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print text-sm"
                title="تحميل"
              >
                {downloading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaDownload className ='text-blue-600'/>
                )}
                <span>تحميل</span>
              </button>

              {/* FIXED: Close Button */}
              <button
                onClick={onClose}
                className="p-2 cursor-pointer text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl font-light hover:rotate-90 transition-transform duration-300 sm:mr-2"
                title="إغلاق"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>

      
      {/* Main Content - Wrapped for Print/Download */}
      <div ref={contentRef} className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 bg-[#f8f7f5]">
        
     
        
        {/* NEW PRINT-ONLY HEADER */}
        <div className="print-broker-header hidden print:block">
            <div className="print:flex print:justify-between print:items-center print:pb-4 ">
                <div className="print:text-right">
                    <h1 className="print:text-3xl print:font-extrabold print:text-gray-800 print:m-0">
                        Broker City Properties
                    </h1>
                    <p className="print:text-sm print:text-gray-600 print:m-0 print:mt-1">
                        Real Estate & Brokerage Services
                    </p>
                </div>
                <div className="print:text-left">
                    <img 
                        src={logo} 
                        alt="Broker City Logo" 
                        className="print:h-20 print:w-auto print:object-contain"
                    />
                </div>
            </div>
        </div>
        {/* END NEW PRINT-ONLY HEADER */}
        
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Transaction Overview */}
            <InfoCard icon={FaFileInvoice} title={`سند: ${arabicTypeDisplay}`}>

              {/* FLEX ROW FOR THE 3 ITEMS */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 py-2 border-b border-gray-50 mb-6 sm:mb-10">

                <div className="flex flex-col items-center text-center">
                  <span className="text-xs sm:text-sm text-gray-600">رقم المعاملة</span>
                  <span className="text-sm font-medium text-gray-800 mt-1">{transactionData.transaction_no || '-'}</span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <span className="text-xs sm:text-sm text-gray-600">التاريخ</span>
                  <span className="text-sm font-medium text-gray-800 mt-1">{formatDate(transactionData.transaction_date)}</span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <span className="text-xs sm:text-sm text-gray-600">النوع</span>
                  <span className="text-sm font-medium text-gray-800 mt-1">{arabicTypeDisplay}</span>
                </div>

              </div>
              {/* END FLEX ROW */}
              
              {/* FLEX ROW FOR AMOUNT, WORDS, AND CURRENCY */}
              <div className='flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 py-2 border-b border-gray-50 '>
                
                {/* Amount */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-xs sm:text-sm text-gray-600">المبلغ</span>
                  <span className="text-sm font-medium text-[#8B7355] mt-1">
                    {formatCurrency(transactionData.amount)}
                  </span>
                </div>

                {/* Amount in Words */}
                {getAmountInWords() && (
                  <div className="flex flex-col items-center text-center">
                    <span className="text-xs sm:text-sm text-gray-600">المبلغ كتابةً</span>
                    <div className="flex flex-wrap gap-1 justify-center items-center text-sm mt-1">
                      <span className="font-medium text-[#a47d52]">
                        {getAmountInWords()}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">فقط لا غير</span>
                    </div>
                  </div>
                )}

                {/* Currency */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-xs sm:text-sm text-gray-600">العملة</span>
                  <span className="text-sm font-medium text-gray-800 mt-1">
                    {getArabicCurrency(transactionData.currency)}
                  </span>
                </div>

              </div>
              {/* END FLEX ROW */}


              <InfoRow 
                label="طريقة الدفع" 
                value={getArabicPaymentMethod(transactionData.payment_method_display || transactionData.payment_method)} 
              />

            </InfoCard>

            {/* Account Details */}
            <InfoCard icon={FaExchangeAlt} title="تفاصيل الحساب" className="no-print">
                <div className ='grid grid-cols-1 sm:grid-cols-2 gap-2 items-center'>
                    <InfoRow label="من حساب" value={transactionData.account_from}  />
                    <InfoRow label="إلى حساب" value={transactionData.account_to} />
                    <InfoRow label="البنك" value={transactionData.bank_name || transactionData.bank} />
                    <InfoRow label="الصندوق" value={transactionData.cashbox_name || transactionData.cashbox} className="no-print" />
                </div>
              
            </InfoCard>

            {/* Check Information */}
            {transactionData.has_check && (
              <InfoCard icon={FaCheckCircle} title="معلومات الشيك">
                <InfoRow label="رقم الشيك" value={transactionData.check_no} />
                <InfoRow label="بنك الشيك" value={transactionData.check_bank} />
                <InfoRow label="تاريخ الشيك" value={transactionData.check_date ? formatDate(transactionData.check_date) : '-'} />
              </InfoCard>
            )}

            {/* Document Information */}
            {transactionData.has_document && (
              <InfoCard icon={FaFilePdf} title="معلومات المستند" className="no-print">
                <InfoRow label="المستند" value={transactionData.document} />
                <InfoRow label="رقم المستند" value={transactionData.document_no} />
                {transactionData.document && (
                  <div className="mt-3">
                    <a 
                      href={`${BASE}${transactionData.document}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#8B7355] hover:text-[#6B5B45] text-sm font-medium flex items-center gap-2"
                    >
                      <FaFilePdf />
                      عرض المستند
                    </a>
                  </div>
                )}
              </InfoCard>
            )}

          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* People Involved - Conditional based on transaction type */}
            <InfoCard icon={FaUser} title="الأشخاص المعنيون">
              {isWithdraw ? (
                <InfoRow label="الشخص المستلم" value={transactionData.person_receipt} />
              ) : (
                <InfoRow label="الشخص المسلم" value={transactionData.person_deliver} />
              )}
            </InfoCard>

            {/* Statement & Notes */}
            <InfoCard icon={FaStickyNote} title="البيان والملاحظات" className="no-print">
              <div className="text-sm text-gray-700 bg-[#f8f7f5] p-3 rounded-lg">
                {transactionData.statement || 'لا يوجد بيان'}
              </div>
              {transactionData.notes && (
                <div className="mt-3 text-sm text-gray-700 bg-[#f8f7f5] p-3 rounded-lg">
                  <span className="font-medium">ملاحظات:</span> {transactionData.notes}
                </div>
              )}
            </InfoCard>

            
            {/* =========================================================
                SIGNATURES — Visual, responsive grid
                1 col mobile | 2 col tablet | 3 col laptop+
            ========================================================= */}
            <InfoCard icon={FaSignature} title="بيانات التوقيع">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <SignatureDisplay
                  label="توقيع المحاسب"
                  signatureData={transactionData.user_signature}
                />
                <SignatureDisplay
                  label="توقيع المدير"
                  signatureData={transactionData.manager_signature}
                />
                <SignatureDisplay
                  label="توقيع الطرف الثاني"
                  signatureData={transactionData.second_person_signature}
                />
              </div>
            </InfoCard>



      {/* Print Styles */}
      <style>{`
        @media print {
          .sticky {
            position: static !important;
          }
          .shadow-sm {
            box-shadow: none !important;
          }
          .border-b {
            border-bottom: 1px solid #e5e7eb !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          .bg-[#f8f7f5] {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
          }

          /* FORCE BROKER HEADER TO SHOW IN PRINT */
          .print-broker-header {
            display: block !important;
            width: 100% !important;
            margin-bottom: 20px !important;
            padding-bottom: 10px !important;
            border-bottom: 2px solid #b08d57 !important;
          }
          
          /* HIDE THE OLD STICKY HEADER */
          .sticky.top-0 {
            display: none !important;
          }
          
          /* REMOVE PADDING FROM MAIN CONTAINER SO HEADER SITS AT THE TOP */
          div[ref] {
            padding-top: 0 !important;
          }

          /* Signature grid: always 3 columns when printing */
          .signature-print-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px !important;
          }
        }
      `}</style>


            {/* Audit Information */}
            <InfoCard icon={FaClock} title="معلومات التدقيق" className="no-print" >
              <InfoRow label="تم الإنشاء بواسطة" value={transactionData.transaction_user_name} />
              <InfoRow label="تاريخ الإنشاء" value={formatDate(transactionData.created_at)} />
              <InfoRow label="آخر تحديث" value={formatDate(transactionData.updated_at)} />
            </InfoCard>
          </div>
        </div>
      </div>

      {/* Update Modals */}
       {/* Update Transaction Modal - Full Update */}
      {showUpdateTransactionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleUpdateModalClose}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-[#f8f7f5] rounded-lg">
              <UpdateTransaction
                transactionId={transactionId}
                onClose={handleUpdateModalClose}
                onSuccess={(updatedData) => {
                  handleUpdateModalClose();
                }}
              />
            </div>
          </div>
        </div>
      )}



      {/* Update Deposit  Signature Modal */}
      {showUpdateDepositModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleUpdateModalClose}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl">
              <AddDeposit
                onClose={handleUpdateModalClose}
                initialData={selectedTransaction}
                isEditMode={true}
                onSuccess={(updatedData) => {
                  handleUpdateModalClose();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Update Withdraw Signature Modal */}
      {showUpdateWithdrawModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleUpdateModalClose}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl">
              <AddWithdraw
                onClose={handleUpdateModalClose}
                initialData={selectedTransaction}
                isEditMode={true}
                onSuccess={(updatedData) => {
                  handleUpdateModalClose();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Voucher Modal - rendered conditionally based on transaction type */}
      {showVoucher && voucherInfo && (
        isWithdrawOrExpense(voucherInfo.type) ? (
          <VoucherWithdraw
            transaction={voucherInfo}
            onClose={handleVoucherClose}
          />
        ) : (
          <Voucher
            transaction={voucherInfo}
            onClose={handleVoucherClose}
          />
        )
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          .sticky {
            position: static !important;
          }
          .shadow-sm {
            box-shadow: none !important;
          }
          .border-b {
            border-bottom: 1px solid #e5e7eb !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          .bg-[#f8f7f5] {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionDetails;


// // Fix ISO Currency
// // Fix ISO Currency
// import React, { useState, useEffect, useRef } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import logo from '../../../assets/images/logo.png'
// import { 
//   FaFileInvoice, 
//   FaUser, 
//   FaStickyNote, 
//   FaFilePdf, 
//   FaCheckCircle, 
//   FaSignature, 
//   FaExchangeAlt, 
//   FaFileAlt, 
//   FaClock,
//   FaPrint,
//   FaDownload,
//   FaSpinner,
//   FaPen
// } from 'react-icons/fa';
// import { PiSignatureThin } from 'react-icons/pi';
// import AddDeposit from './AddDeposit';
// import AddWithdraw from './AddWithdraw';
// import { CiEdit } from "react-icons/ci";
// import UpdateTransaction from './UpdateTransaction';
// import { formatAmountInWords } from '../../../utils/numberToArabic';
// // ✅ NEW: Voucher components rendered inline instead of routing
// import VoucherWithdraw from './VoucherWithdraw';
// import Voucher from './Voucher';

// // Base URL from environment variables
// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// // Transaction type mapping to Arabic
// const transactionTypeMap = {
//   'deposit': 'إيداع',
//   'withdraw': 'سحب',
// };

// // Transaction type display mapping
// const transactionTypeDisplayMap = {
//   'Deposit': 'إيداع',
//   'Withdraw': 'سحب',
//   'Deposit / Income': 'إيداع',
//   'Withdraw / Expense': 'سحب',
// };

// // Payment method mapping to Arabic
// const paymentMethodMap = {
//   'cash': 'نقدي',
//   'bank': 'بنكي',
//   'bank_transfer': 'تحويل بنكي',
//   'check': 'شيك',
//   'credit_card': 'بطاقة ائتمان',
//   'debit_card': 'بطاقة خصم',
//   'online': 'إلكتروني',
//   'mobile': 'جوال',
// };

// // Currency mapping to Arabic
// const currencyMap = {
//   'USD': 'دولار أمريكي',
//   'EUR': 'يورو',
//   'GBP': 'جنيه إسترليني',
//   'AED': 'درهم إماراتي',
//   'SAR': 'ريال سعودي',
//   'JOD': 'دينار أردني',
//   'KWD': 'دينار كويتي',
//   'QAR': 'ريال قطري',
//   'BHD': 'دينار بحريني',
//   'OMR': 'ريال عماني',
// };

// // Currency symbols for display
// const currencySymbols = {
//   'USD': '$',
//   'EUR': '€',
//   'GBP': '£',
//   'JOD': 'د.أ',
//   'SAR': 'ر.س',
//   'AED': 'د.إ',
//   'KWD': 'د.ك',
//   'QAR': 'ر.ق',
//   'BHD': 'د.ب',
//   'OMR': 'ر.ع',
//   'دولار أمريكي': '$',
//   'دينار أردني': 'د.أ',
//   'ريال سعودي': 'ر.س',
//   'درهم إماراتي': 'د.إ',
// };



// // Map Arabic currency names to ISO codes
// const currencyCodeMap = {
//   'دولار أمريكي': 'USD',
//   'دينار أردني': 'JOD',
//   'ريال سعودي': 'SAR',
//   'درهم إماراتي': 'AED',
//   'دينار كويتي': 'KWD',
//   'ريال قطري': 'QAR',
//   'دينار بحريني': 'BHD',
//   'ريال عماني': 'OMR',
// };

// // ============================================
// // HELPER FUNCTIONS
// // ============================================

// // Get Arabic transaction type
// const getArabicTransactionType = (type) => {
//   if (!type) return type;
//   const lowerType = type.toLowerCase();
//   return transactionTypeMap[lowerType] || type;
// };

// // Get Arabic transaction type display
// const getArabicTransactionTypeDisplay = (typeDisplay) => {
//   if (!typeDisplay) return typeDisplay;
//   return transactionTypeDisplayMap[typeDisplay] || typeDisplay;
// };

// // Get Arabic payment method
// const getArabicPaymentMethod = (method) => {
//   if (!method) return method;
//   const lowerMethod = method.toLowerCase();
//   return paymentMethodMap[lowerMethod] || method;
// };

// // Get Arabic currency name
// const getArabicCurrency = (currency) => {
//   if (!currency) return currency;
//   return currencyMap[currency] || currency;
// };

// // Get currency symbol
// const getCurrencySymbol = (currency) => {
//   if (!currency) return '';
//   return currencySymbols[currency] || currency;
// };

// // Check if transaction is Withdraw/Expense
// const isWithdrawOrExpense = (type) => {
//   if (!type) return false;
//   const lowerType = type.toLowerCase();
//   return lowerType === 'withdraw' || lowerType === 'expense' || lowerType === 'withdrawal';
// };

// const TransactionDetails = ({ transactionId, onClose, onTransactionUpdate }) => {

//     const [transactionData, setTransactionData] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [printing, setPrinting] = useState(false);
//     const [downloading, setDownloading] = useState(false);
//     const contentRef = useRef(null);

//   // State for update modals
//     // Signature Deposit update 
//     const [showUpdateDepositModal, setShowUpdateDepositModal] = useState(false);
//     // Signature withdrow update
//     const [showUpdateWithdrawModal, setShowUpdateWithdrawModal] = useState(false);
//     // Full update
//     const [showUpdateTransactionModal, setShowUpdateTransactionModal] = useState(false);
//     const [selectedTransaction, setSelectedTransaction] = useState(null);

//     // ✅ NEW: State to control voucher rendering instead of routing
//     const [showVoucher, setShowVoucher] = useState(false);
//     const [voucherInfo, setVoucherInfo] = useState(null);

//     // Amount from numbers To languages
//     const getAmountInWords = () => {
//         if (!transactionData?.amount || parseFloat(transactionData.amount) <= 0) {
//             return '';
//         }
//         return formatAmountInWords(transactionData.amount);
//     };

//   // Fetch transaction data when component mounts or transactionId changes
//   useEffect(() => {
//     const fetchTransactionData = async () => {
//       if (!transactionId) {
//         setLoading(false);
//         return;
//       }

//       setLoading(true);
//       setError(null);
      
//       try {
//         const token = localStorage.getItem('access_token');
        
//         if (!token) {
//           toast.error('يرجى تسجيل الدخول لعرض تفاصيل المعاملة');
//           setLoading(false);
//           return;
//         }

//         const url = `${BASE}/api/transactions/${transactionId}/`;
        
//         const response = await fetch(url, {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${token}`
//           }
//         });

//         if (!response.ok) {
//           if (response.status === 401) {
//             toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
//           } else if (response.status === 404) {
//             toast.error('المعاملة غير موجودة');
//           } else {
//             toast.error('فشل تحميل تفاصيل المعاملة');
//           }
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Fetched transaction details:', data);
        
//         setTransactionData(data);
//         setLoading(false);
        
//       } catch (err) {
//         setError('فشل تحميل تفاصيل المعاملة');
//         setLoading(false);
//         console.error('Error fetching transaction details:', err);
//         toast.error('❌ حدث خطأ أثناء جلب تفاصيل المعاملة');
//       }
//     };

//     fetchTransactionData();
//   }, [transactionId]);

  
//   // Handle opening the Signature form based on transaction type
//   const handleOpenUpdateForm = () => {
//     if (!transactionData) return;

//     setSelectedTransaction(transactionData);

//     if (transactionData.type === 'deposit' || transactionData.type === 'income') {
//       setShowUpdateDepositModal(true);
//     } else if (transactionData.type === 'withdraw' || transactionData.type === 'expense') {
//       setShowUpdateWithdrawModal(true);
//     } else {
//       toast.error('نوع المعاملة غير معروف للتحديث');
//     }
//   };


// // Handle opening the full update form
//   const handleOpenFullUpdate = () => {
//     if (!transactionData) return;
//     setSelectedTransaction(transactionData);
//     setShowUpdateTransactionModal(true);
//   };

//   // Handle modal close and refresh
//   const handleUpdateModalClose = () => {
//     // signature update form
//     setShowUpdateDepositModal(false);
//     // signature update form
//     setShowUpdateWithdrawModal(false);
//     // Full update form
//     setShowUpdateTransactionModal(false);
//     setSelectedTransaction(null);
    
//     if (transactionId) {
//       const fetchUpdatedData = async () => {
//         try {
//           const token = localStorage.getItem('access_token');
//           if (!token) return;

//           const response = await fetch(`${BASE}/api/transactions/${transactionId}/`, {
//             headers: {
//               "Content-Type": "application/json",
//               "Authorization": `Bearer ${token}`
//             }
//           });

//           if (response.ok) {
//             const data = await response.json();
//             setTransactionData(data);
//             // toast.success('✅ تم تحديث المعاملة بنجاح');
            
//             if (onTransactionUpdate) {
//               onTransactionUpdate(data);
//             }
//           }
//         } catch (error) {
//           console.error('Error refreshing transaction data:', error);
//         }
//       };
      
//       fetchUpdatedData();
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return '-';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('ar-EG', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch (e) {
//       return dateString;
//     }
//   };

//   // Format currency with Arabic support
//   const formatCurrency = (amount) => {
//     if (!amount && amount !== 0) return '-';
    
//     try {
//       const currency = transactionData?.currency || 'USD';
//       const symbol = getCurrencySymbol(currency);
//       const formattedNumber = new Intl.NumberFormat('ar-EG', {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2
//       }).format(amount);
      
//       return `${formattedNumber} ${symbol}`;
//     } catch (error) {
//       console.warn('Currency formatting error:', error);
//       return `${parseFloat(amount).toFixed(2)} ${transactionData?.currency || ''}`;
//     }
//   };

//   // ============================================
//   // ✅ UPDATED: Handle Print → show Voucher inline
//   // ============================================
//   // Instead of window.print() or navigation, we now display the voucher
//   // component conditionally, based on the transaction type:
//   //   - deposit / income   → <Voucher />
//   //   - withdraw / expense → <VoucherWithdraw />
//   // The transaction data is passed directly as a prop.
//   const handlePrint = () => {
//     if (!transactionData) return;

//     setPrinting(true);

//     try {
//       const lowerType = (transactionData.type || '').toLowerCase();

//       // Only deposit/income and withdraw/expense types are printable
//       const isDeposit = lowerType === 'deposit' || lowerType === 'income';
//       const isWithdraw = lowerType === 'withdraw' || lowerType === 'expense' || lowerType === 'withdrawal';

//       if (!isDeposit && !isWithdraw) {
//         toast.error('نوع المعاملة غير معروف للطباعة');
//         setPrinting(false);
//         return;
//       }

//       // Store the transaction for the voucher to consume
//       setVoucherInfo(transactionData);
//       setShowVoucher(true);
//     } catch (err) {
//       console.error('Print error:', err);
//       toast.error('❌ حدث خطأ أثناء فتح صفحة الطباعة');
//     } finally {
//       setPrinting(false);
//     }
//   };

//   // ✅ NEW: Close the voucher overlay
//   const handleVoucherClose = () => {
//     setShowVoucher(false);
//     setVoucherInfo(null);
//   };

//   // Handle Download as PDF/HTML
//   const handleDownload = () => {
//     setDownloading(true);
//     try {
//       const content = contentRef.current;
//       if (!content) {
//         setDownloading(false);
//         return;
//       }

//       const clone = content.cloneNode(true);
      
//       const styles = document.querySelectorAll('style');
//       let styleText = '';
//       styles.forEach(style => {
//         styleText += style.innerHTML;
//       });

      
//     const htmlContent = `
//   <!DOCTYPE html>
//   <html dir="rtl" lang="ar">
//   <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>${transactionData?.type} - ${transactionData?.transaction_no || 'غير معروف'}</title>
//     <style>
//       ${styleText}
      
//       body { 
//         padding: 20px; 
//         background: white;
//         font-family: 'Arial', sans-serif;
//         margin: 0;
//       }
//       .no-print {
//         display: none !important;
//       }
      
//       /* STRICT HEADER STYLES */
//       .report-header-wrapper {
//         width: 100% !important;
//         display: block !important;
//         position: relative !important;
//         z-index: 9999 !important;
//         margin-bottom: 25px !important;
//         padding-bottom: 10px !important;
//         border-bottom: 2px solid #b08d57 !important; /* The HR line */
//       }
//       .report-header {
//         display: flex !important;
//         align-items: center !important;
//         justify-content: space-between !important;
//         width: 100% !important;
//       }
//       .header-logo {
//         max-height: 80px !important;
//         max-width: 150px !important;
//         object-fit: contain !important;
//       }
//       .header-title {
//         font-size: 24px !important;
//         font-weight: bold !important;
//         color: #333 !important;
//         text-align: right !important;
//         margin: 0 !important;
//         line-height: 1.2 !important;
//       }
//       .header-subtitle {
//         font-size: 14px !important;
//         color: #777 !important;
//         text-align: right !important;
//         margin: 0 !important;
//         margin-top: 5px !important;
//       }

//       /* Ensure the cloned content doesn't overlap */
//       #report-body {
//         width: 100%;
//         display: block;
//       }

//       @media print {
//         .no-print { display: none !important; }
//         body { padding: 0; }
//         .report-header-wrapper {
//           border-bottom: 2px solid #b08d57 !important; 
//         }
//       }
//     </style>
//   </head>
//   <body>
    
//     <!-- NEW HEADER WITH LOGO AND TITLE -->
//     <div class="report-header-wrapper">
//       <div class="report-header">
//         <div style="text-align: right;">
//           <h1 class="header-title">Broker City Properties</h1>
//           <p class="header-subtitle">Real Estate & Brokerage Services</p>
//         </div>
//         <!-- REPLACE src WITH YOUR LOGO URL OR BASE64 -->
//         <img src="YOUR_LOGO_URL_HERE" alt="Logo" class="header-logo">
//       </div>
//     </div>
//     <!-- END HEADER -->

//     <!-- ORIGINAL CLONED CONTENT CONTAINER -->
//     <div id="report-body">
//       ${clone.innerHTML}
//     </div>

//   </body>
//   </html>
// `;
//       // const htmlContent = `
//       //   <!DOCTYPE html>
//       //   <html dir="rtl" lang="ar">
//       //   <head>
//       //     <meta charset="UTF-8">
//       //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       //     <title>${transactionData?.type} - ${transactionData?.transaction_no || 'غير معروف'}</title>
//       //     <style>
//       //       ${styleText}
//       //       body { 
//       //         padding: 20px; 
//       //         background: white;
//       //         font-family: 'Arial', sans-serif;
//       //       }
//       //       .no-print {
//       //         display: none !important;
//       //       }
//       //       @media print {
//       //         .no-print { display: none !important; }
//       //         body { padding: 0; }
//       //       }
//       //     </style>
//       //   </head>
//       //   <body>
//       //     ${clone.innerHTML}
//       //   </body>
//       //   </html>
//       // `;

//       const blob = new Blob([htmlContent], { type: 'text/html' });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `transaction_${transactionData?.transaction_no || 'unknown'}.html`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);

//       toast.success('✅ تم تحميل الملف بنجاح');
//     } catch (err) {
//       console.error('Download error:', err);
//       toast.error('❌ حدث خطأ أثناء التحميل');
//     } finally {
//       setDownloading(false);
//     }
//   };
     
//   // Loading state
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mx-auto"></div>
//           <p className="mt-4 text-gray-600">جاري تحميل تفاصيل المعاملة...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center text-red-600">
//           <p className="text-lg font-semibold">خطأ</p>
//           <p>{error}</p>
//           <button 
//             onClick={() => window.location.reload()}
//             className="mt-4 px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5B45] transition-colors"
//           >
//             إعادة المحاولة
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!transactionData) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <p className="text-gray-600">لا توجد بيانات للمعاملة</p>
//       </div>
//     );
//   }

//   const InfoCard = ({ icon: Icon, title, children, className = '' }) => (
//     <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-100 ${className}`}>
//       <div className="flex items-center gap-2 mb-4">
//         <Icon className="text-[#8B7355] text-lg" />
//         <h3 className="font-semibold text-gray-700">{title}</h3>
//       </div>
//       {children}
//     </div>
//   );


// const InfoRow = ({ label, value, highlight = false, className = '', labelClassName = '', valueClassName = '' }) => (
//   <div className={`flex justify-between items-center py-2 border-b border-gray-50 last:border-0 ${className}`}>
//     <span className={`text-sm text-gray-600 ${labelClassName}`}>{label}</span>
//     <span className={`text-sm font-medium ${highlight ? 'text-[#8B7355]' : 'text-gray-800'} ${valueClassName}`}>
//       {value || '-'}
//     </span>
//   </div>
// );


//   // Signature Display Component (KEEP AS IS - working version)
//   // ...Display Signature
// const SignatureDisplay = ({ label, signatureData }) => {
//   const [imageError, setImageError] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   // Check if signature exists
//   const hasSignature = signatureData && 
//                        signatureData !== '' && 
//                        signatureData !== 'null' && 
//                        signatureData !== 'undefined';

//   // Get image source - if it's not already a data URL, add the prefix
//   const getImageSrc = (data) => {
//     if (!data) return null;
    
//     // If it's already a data URL
//     if (data.startsWith('data:image/')) {
//       return data;
//     }
    
//     // If it contains base64 but not the full data URL
//     if (data.includes('base64,')) {
//       return data;
//     }
    
//     // Assume it's just the base64 string
//     return `data:image/png;base64,${data}`;
//   };

//   const imageSrc = getImageSrc(signatureData);

//   if (!hasSignature) {
//     return (
//       <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
//         <span className="text-xs text-gray-500">{label}</span>
//         <div className="h-12 w-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
//           <FaSignature className="text-gray-400 text-xl" />
//         </div>
//         <span className="text-xs text-gray-400">لا يوجد توقيع</span>
//       </div>
//     );
//   }
//     return (
//     <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
//       <span className="text-xs text-gray-500">{label}</span>
      
//       {isLoading && !imageError && (
//         <div className="h-12 w-24 flex items-center justify-center">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B7355]"></div>
//         </div>
//       )}
      
//       <img 
//         src={imageSrc} 
//         alt={label} 
//         className="h-12 object-contain"
//         style={{ display: isLoading ? 'none' : 'block' }}
//         onLoad={() => {
//           setIsLoading(false);
//           console.log(`✅ ${label} loaded`);
//         }}
//         onError={(e) => {
//           setImageError(true);
//           setIsLoading(false);
//           console.error(`❌ Failed to load ${label}`);
//           e.target.style.display = 'none';
//         }}
//       />
      
//       {imageError && (
//         <div className="flex flex-col items-center gap-2">
//           <div className="h-12 w-24 border-2 border-dashed border-red-300 rounded flex items-center justify-center bg-red-50">
//             <FaSignature className="text-red-400 text-xl" />
//           </div>
//           <span className="text-xs text-red-400">خطأ في عرض التوقيع</span>
//         </div>
//       )}
//     </div>
//   );
// };


//   // Get Arabic type display
//   const arabicTypeDisplay = getArabicTransactionTypeDisplay(transactionData.type_display) || 
//                             getArabicTransactionType(transactionData.type);

//   const isWithdraw = isWithdrawOrExpense(transactionData.type);

//   return (
//     <div className="min-h-screen bg-[#f8f7f5]" dir="rtl">
//       <ToastContainer
//         position="top-center"
//         autoClose={3000}
//         hideProgressBar={false}
//         newestOnTop={false}
//         closeOnClick
//         rtl={true}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         theme="light"
//       />


//           {/* Print-Only Header - Hidden on screen, visible when printing */}
//           <div className="print-only-header hidden print:block print:mb-6 print:border-b print:border-gray-300 print:pb-4">
//               <div className="no-print">
//                   <div>
//                       <h1 className="print:text-2xl print:font-bold print:text-gray-800">
//                           تفاصيل المعاملة
//                       </h1>
//                       <p className="print:text-sm print:text-gray-500">
//                           #{transactionData.transaction_no}
//                       </p>
//                   </div>
//                   <div className="print:text-left">
//                       <p className="print:text-sm print:text-gray-600">
//                           التاريخ: {formatDate(transactionData.transaction_date)}
//                       </p>
//                       <p className="print:text-sm print:text-gray-600">
//                           النوع: {arabicTypeDisplay}
//                       </p>
//                   </div>
//               </div>
//           </div>
//       {/* Regular Header with Print and Download Buttons */}
//       <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 no-print">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="py-6 flex items-center justify-between flex-wrap gap-4">
            
//             <div className="flex items-center gap-4">
//               <h1 className="text-2xl font-extrabold text-gray-800">تفاصيل المعاملة</h1>
//               <p className="text-sm text-gray-500">#{transactionData.transaction_no}</p>
//               {/* FIXED: Type badge with Arabic */}
//               <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
//                 isWithdraw
//                   ? 'bg-red-100 text-red-800 border-red-200'
//                   : 'bg-green-100 text-green-800 border-green-200'
//               }`}>
//                 {arabicTypeDisplay}
//               </span>
//             </div>

//             <div className="flex items-center gap-3 flex-wrap">
              
              
//               {/* Signature/Update Button */}
//               <button
//                 onClick={handleOpenFullUpdate}
//                 className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print"
//                 title="تعديل"
//               >
//                 <CiEdit size="25" className='text-orange-800'/>
//                 <span>تعديل</span>
//               </button>
              


//               {/* <button
//                 onClick={handleOpenUpdateForm}
//                 className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print"
//                 title="توقيع / تحديث"
//               >
//                 <PiSignatureThin size="25" />
//                 <span>توقيع</span>
//               </button> */}
              
//               {/* Print Button */}
//               <button
//                 onClick={handlePrint}
//                 disabled={printing}
//                 className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print"
//                 title="طباعة"
//               >     
//                 {printing ? (
//                   <FaSpinner className="animate-spin" />
//                 ) : (
//                   <FaPrint className='text-[#a47d52]'/>
//                 )}
//                 <span>طباعة</span>
//               </button>

//               {/* Download Button */}
//               <button
//                 onClick={handleDownload}
//                 disabled={downloading}
//                 className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print"
//                 title="تحميل"
//               >
//                 {downloading ? (
//                   <FaSpinner className="animate-spin" />
//                 ) : (
//                   <FaDownload className ='text-blue-600'/>
//                 )}
//                 <span>تحميل</span>
//               </button>

//               {/* FIXED: Close Button - Removed animate-spin, added proper onClick */}
//               <button
//                 onClick={onClose}
//                 className="p-2 cursor-pointer animate-spin text-gray-400 hover:text-gray-600 text-3xl font-light hover:rotate-90 transition-transform duration-300 mr-2"
//                 title="إغلاق"
//                 type="button"
//                 size ={25}
//               >
//                 ✕
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

      
//       {/* Main Content - Wrapped for Print/Download */}
//       <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#f8f7f5]">
        
     
        
//         {/* NEW PRINT-ONLY HEADER */}
//         <div className="print-broker-header hidden print:block">
//             <div className="print:flex print:justify-between print:items-center print:pb-4 ">
//                 <div className="print:text-right">
//                     <h1 className="print:text-3xl print:font-extrabold print:text-gray-800 print:m-0">
//                         Broker City Properties
//                     </h1>
//                     <p className="print:text-sm print:text-gray-600 print:m-0 print:mt-1">
//                         Real Estate & Brokerage Services
//                     </p>
//                 </div>
//                 <div className="print:text-left">
//                     {/* REPLACE THE src BELOW WITH YOUR LOGO URL OR BASE64 STRING */}
//                     <img 
//                         src={logo} 
//                         alt="Broker City Logo" 
//                         className="print:h-20 print:w-auto print:object-contain"
//                     />
//                 </div>
//             </div>
//         </div>
//         {/* END NEW PRINT-ONLY HEADER */}
        
        
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
//           {/* Left Column - Main Info */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Transaction Overview */}
//             <InfoCard icon={FaFileInvoice} title={`سند: ${arabicTypeDisplay}`}>

//               {/* FLEX ROW FOR THE 3 ITEMS */}
//               <div className="flex flex-row justify-between items-center gap-4 py-2 border-b border-gray-50 mb-10">

//                 <div className="flex flex-col items-center text-center">
//                   <span className="text-sm text-gray-600">رقم المعاملة</span>
//                   <span className="text-sm font-medium text-gray-800 mt-1">{transactionData.transaction_no || '-'}</span>
//                 </div>

//                 <div className="flex flex-col items-center text-center">
//                   <span className="text-sm text-gray-600">التاريخ</span>
//                   <span className="text-sm font-medium text-gray-800 mt-1">{formatDate(transactionData.transaction_date)}</span>
//                 </div>

//                 <div className="flex flex-col items-center text-center">
//                   <span className="text-sm text-gray-600">النوع</span>
//                   <span className="text-sm font-medium text-gray-800 mt-1">{arabicTypeDisplay}</span>
//                 </div>

//               </div>
//               {/* END FLEX ROW */}
              
//               {/* FLEX ROW FOR AMOUNT, WORDS, AND CURRENCY */}
//               <div className='flex flex-row justify-between items-center gap-4 py-2 border-b border-gray-50 '>
                
//                 {/* Amount */}
//                 <div className="flex flex-col items-center text-center">
//                   <span className="text-sm text-gray-600">المبلغ</span>
//                   <span className="text-sm font-medium text-[#8B7355] mt-1">
//                     {formatCurrency(transactionData.amount)}
//                   </span>
//                 </div>

//                 {/* Amount in Words */}
//                 {getAmountInWords() && (
//                   <div className="flex flex-col items-center text-center">
//                     <span className="text-sm text-gray-600">المبلغ كتابةً</span>
//                     <div className="flex flex-wrap gap-1 justify-center items-center text-sm mt-1">
//                       <span className="font-medium text-[#a47d52]">
//                         {getAmountInWords()}
//                       </span>
//                       <span className="text-sm text-gray-500">فقط لا غير</span>
//                     </div>
//                   </div>
//                 )}

//                 {/* Currency */}
//                 <div className="flex flex-col items-center text-center">
//                   <span className="text-sm text-gray-600">العملة</span>
//                   <span className="text-sm font-medium text-gray-800 mt-1">
//                     {getArabicCurrency(transactionData.currency)}
//                   </span>
//                 </div>

//               </div>
//               {/* END FLEX ROW */}


//               <InfoRow 
//                 label="طريقة الدفع" 
//                 value={getArabicPaymentMethod(transactionData.payment_method_display || transactionData.payment_method)} 
//               />

              
//               {/* {transactionData.amount_deposit > 0 && (
//                 <InfoRow label="مبلغ الإيداع" value={formatCurrency(transactionData.amount_deposit)} />
//               )}
//               {transactionData.amount_withdraw > 0 && (
//                 <InfoRow label="مبلغ السحب" value={formatCurrency(transactionData.amount_withdraw)} />
//               )} */}
//             </InfoCard>

//             {/* Account Details */}
//             <InfoCard icon={FaExchangeAlt} title="تفاصيل الحساب" className="no-print">
//                 <div className ='grid grid-cols-2 gap-2 items-center'>
//                     <InfoRow label="من حساب" value={transactionData.account_from}  />
//                     <InfoRow label="إلى حساب" value={transactionData.account_to} />
//                     <InfoRow label="البنك" value={transactionData.bank_name || transactionData.bank} />
//                     <InfoRow label="الصندوق" value={transactionData.cashbox_name || transactionData.cashbox} className="no-print" />
//                 </div>
              
//             </InfoCard>

//             {/* Check Information */}
//             {transactionData.has_check && (
//               <InfoCard icon={FaCheckCircle} title="معلومات الشيك">
//                 <InfoRow label="رقم الشيك" value={transactionData.check_no} />
//                 <InfoRow label="بنك الشيك" value={transactionData.check_bank} />
//                 <InfoRow label="تاريخ الشيك" value={transactionData.check_date ? formatDate(transactionData.check_date) : '-'} />
//               </InfoCard>
//             )}

//             {/* Document Information */}
//             {transactionData.has_document && (
//               <InfoCard icon={FaFilePdf} title="معلومات المستند" className="no-print">
//                 <InfoRow label="المستند" value={transactionData.document} />
//                 <InfoRow label="رقم المستند" value={transactionData.document_no} />
//                 {transactionData.document && (
//                   <div className="mt-3">
//                     <a 
//                       href={`${BASE}${transactionData.document}`} 
//                       target="_blank" 
//                       rel="noopener noreferrer"
//                       className="text-[#8B7355] hover:text-[#6B5B45] text-sm font-medium flex items-center gap-2"
//                     >
//                       <FaFilePdf />
//                       عرض المستند
//                     </a>
//                   </div>
//                 )}
//               </InfoCard>
//             )}

//             {/* Amount in Words */}
//             {/* {(transactionData.amount_to_arabic || transactionData.amount_to_english) && (
//               <InfoCard icon={FaFileAlt} title="المبلغ كتابة">
//                 <div className="space-y-2">
//                   {transactionData.amount_to_arabic && (
//                     <>
//                       <div className="text-sm text-gray-600">بالعربية:</div>
//                       <div className="text-base font-medium text-gray-800 bg-[#f8f7f5] p-3 rounded-lg">
//                         {transactionData.amount_to_arabic}
//                       </div>
//                     </>
//                   )}
//                   {transactionData.amount_to_english && (
//                     <>
//                       <div className="text-sm text-gray-600 mt-2">بالإنجليزية:</div>
//                       <div className="text-base font-medium text-gray-800 bg-[#f8f7f5] p-3 rounded-lg">
//                         {transactionData.amount_to_english}
//                       </div>
//                     </>
//                   )}
//                 </div>
//               </InfoCard>
//             )} */}
//           </div>

//           {/* Right Column - Additional Info */}
//           <div className="space-y-6">
//             {/* People Involved - Conditional based on transaction type */}
//             <InfoCard icon={FaUser} title="الأشخاص المعنيون">
//               {isWithdraw ? (
//                 <InfoRow label="الشخص المستلم" value={transactionData.person_receipt} />
//               ) : (
//                 <InfoRow label="الشخص المسلم" value={transactionData.person_deliver} />
//               )}
//             </InfoCard>

//             {/* Statement & Notes */}
//             <InfoCard icon={FaStickyNote} title="البيان والملاحظات" className="no-print">
//               <div className="text-sm text-gray-700 bg-[#f8f7f5] p-3 rounded-lg">
//                 {transactionData.statement || 'لا يوجد بيان'}
//               </div>
//               {transactionData.notes && (
//                 <div className="mt-3 text-sm text-gray-700 bg-[#f8f7f5] p-3 rounded-lg">
//                   <span className="font-medium">ملاحظات:</span> {transactionData.notes}
//                 </div>
//               )}
//             </InfoCard>

            
            
//             {/* Signatures - KEEP AS IS (working version) */}
//             {/* Signatures - Display as column normally, row when printing */}
// <InfoCard icon={FaSignature} title="بيانات التوقيع">
//   <div className="signature-wrapper space-y-2 text-xs">
//     <div className="signature-item">
//       <strong className="block mb-1">توقيع المحاسب:</strong>
//       <pre className="signature-content bg-[#f8f7f5] p-2 rounded mt-1 overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
//         {transactionData.user_signature || 'فارغ'}
//       </pre>
//     </div>
//     <div className="signature-item">
//       <strong className="block mb-1">توقيع المدير:</strong>
//       <pre className="signature-content bg-[#f8f7f5] p-2 rounded mt-1 overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
//         {transactionData.manager_signature || 'فارغ'}
//       </pre>
//     </div>
//     <div className="signature-item">
//       <strong className="block mb-1">توقيع الطرف الثاني:</strong>
//       <pre className="signature-content bg-[#f8f7f5] p-2 rounded mt-1 overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
//         {transactionData.second_person_signature || 'فارغ'}
//       </pre>
//     </div>
//   </div>
// </InfoCard>



//       {/* Print Styles */}
//       <style>{`
//         @media print {
//           .sticky {
//             position: static !important;
//           }
//           .shadow-sm {
//             box-shadow: none !important;
//           }
//           .border-b {
//             border-bottom: 1px solid #e5e7eb !important;
//           }
//           .min-h-screen {
//             min-height: auto !important;
//           }
//           .bg-[#f8f7f5] {
//             background: white !important;
//           }
//           .no-print {
//             display: none !important;
//           }
//           body {
//             background: white !important;
//             padding: 0 !important;
//           }

//           /* FORCE BROKER HEADER TO SHOW IN PRINT */
//           .print-broker-header {
//             display: block !important;
//             width: 100% !important;
//             margin-bottom: 20px !important;
//             padding-bottom: 10px !important;
//             border-bottom: 2px solid #b08d57 !important;
//           }
          
//           /* HIDE THE OLD STICKY HEADER (the one with "تفاصيل المعاملة" and buttons) */
//           .sticky.top-0 {
//             display: none !important;
//           }
          
//           /* REMOVE PADDING FROM MAIN CONTAINER SO HEADER SITS AT THE TOP */
//           div[ref] {
//             padding-top: 0 !important;
//           }
//         }
//       `}</style>


//             {/* Audit Information */}
//             <InfoCard icon={FaClock} title="معلومات التدقيق" className="no-print" >
//               <InfoRow label="تم الإنشاء بواسطة" value={transactionData.transaction_user_name} />
//               <InfoRow label="تاريخ الإنشاء" value={formatDate(transactionData.created_at)} />
//               <InfoRow label="آخر تحديث" value={formatDate(transactionData.updated_at)} />
//             </InfoCard>
//           </div>
//         </div>
//       </div>

//       {/* Update Modals */}
//        {/* Update Transaction Modal - Full Update */}
//       {showUpdateTransactionModal && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div 
//             className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
//             onClick={handleUpdateModalClose}
//           ></div>
//           <div className="flex min-h-full items-center justify-center p-4">
//             <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-[#f8f7f5] rounded-lg">
//               <UpdateTransaction
//                 transactionId={transactionId}
//                 onClose={handleUpdateModalClose}
//                 onSuccess={(updatedData) => {
//                   handleUpdateModalClose();
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       )}



//       {/* Update Deposit  Signature Modal */}
//       {showUpdateDepositModal && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div 
//             className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
//             onClick={handleUpdateModalClose}
//           ></div>
//           <div className="flex min-h-full items-center justify-center p-4">
//             <div className="relative w-full max-w-4xl">
//               <AddDeposit
//                 onClose={handleUpdateModalClose}
//                 initialData={selectedTransaction}
//                 isEditMode={true}
//                 onSuccess={(updatedData) => {
//                   handleUpdateModalClose();
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Update Withdraw Signature Modal */}
//       {showUpdateWithdrawModal && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div 
//             className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
//             onClick={handleUpdateModalClose}
//           ></div>
//           <div className="flex min-h-full items-center justify-center p-4">
//             <div className="relative w-full max-w-4xl">
//               <AddWithdraw
//                 onClose={handleUpdateModalClose}
//                 initialData={selectedTransaction}
//                 isEditMode={true}
//                 onSuccess={(updatedData) => {
//                   handleUpdateModalClose();
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ NEW: Voucher Modal - rendered conditionally based on transaction type */}
//       {showVoucher && voucherInfo && (
//         isWithdrawOrExpense(voucherInfo.type) ? (
//           <VoucherWithdraw
//             transaction={voucherInfo}
//             onClose={handleVoucherClose}
//           />
//         ) : (
//           <Voucher
//             transaction={voucherInfo}
//             onClose={handleVoucherClose}
//           />
//         )
//       )}

//       {/* Print Styles */}
//       <style>{`
//         @media print {
//           .sticky {
//             position: static !important;
//           }
//           .shadow-sm {
//             box-shadow: none !important;
//           }
//           .border-b {
//             border-bottom: 1px solid #e5e7eb !important;
//           }
//           .min-h-screen {
//             min-height: auto !important;
//           }
//           .bg-[#f8f7f5] {
//             background: white !important;
//           }
//           .no-print {
//             display: none !important;
//           }
//           body {
//             background: white !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default TransactionDetails;

