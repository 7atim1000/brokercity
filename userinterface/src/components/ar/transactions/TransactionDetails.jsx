// Fix ISO Currency
import React, { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
            toast.success('✅ تم تحديث المعاملة بنجاح');
            
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

  // Handle Print
  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 500);
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
          <title>تفاصيل المعاملة - ${transactionData?.transaction_no || 'غير معروف'}</title>
          <style>
            ${styleText}
            body { 
              padding: 20px; 
              background: white;
              font-family: 'Arial', sans-serif;
            }
            .no-print {
              display: none !important;
            }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${clone.innerHTML}
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
    <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-100 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="text-[#8B7355] text-lg" />
        <h3 className="font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );

//   const InfoRow = ({ label, value, highlight = false, className = '' }) => (
//   <div className={`flex justify-between items-center py-2 border-b border-gray-50 last:border-0 ${className}`}>
//     <span className="text-sm text-gray-600">{label}</span>
//     <span className={`text-sm font-medium ${highlight ? 'text-[#8B7355]' : 'text-gray-800'}`}>
//       {value || '-'}
//     </span>
//   </div>
// );

const InfoRow = ({ label, value, highlight = false, className = '', labelClassName = '', valueClassName = '' }) => (
  <div className={`flex justify-between items-center py-2 border-b border-gray-50 last:border-0 ${className}`}>
    <span className={`text-sm text-gray-600 ${labelClassName}`}>{label}</span>
    <span className={`text-sm font-medium ${highlight ? 'text-[#8B7355]' : 'text-gray-800'} ${valueClassName}`}>
      {value || '-'}
    </span>
  </div>
);


  // Signature Display Component (KEEP AS IS - working version)
  // ...Display Signature
const SignatureDisplay = ({ label, signatureData }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if signature exists
  const hasSignature = signatureData && 
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
        <div className="h-12 w-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
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
        <div className="h-12 w-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B7355]"></div>
        </div>
      )}
      
      <img 
        src={imageSrc} 
        alt={label} 
        className="h-12 object-contain"
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
          <div className="h-12 w-24 border-2 border-dashed border-red-300 rounded flex items-center justify-center bg-red-50">
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
              <div className="print:flex print:justify-between print:items-center">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-extrabold text-gray-800">تفاصيل المعاملة</h1>
              <p className="text-sm text-gray-500">#{transactionData.transaction_no}</p>
              {/* FIXED: Type badge with Arabic */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                isWithdraw
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-green-100 text-green-800 border-green-200'
              }`}>
                {arabicTypeDisplay}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              
              
              {/* Signature/Update Button */}
              <button
                onClick={handleOpenFullUpdate}
                className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print"
                title="تعديل"
              >
                <CiEdit size="25" className='text-orange-800'/>
                <span>تعديل</span>
              </button>
              


              <button
                onClick={handleOpenUpdateForm}
                className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print"
                title="توقيع / تحديث"
              >
                <PiSignatureThin size="25" />
                <span>توقيع</span>
              </button>
              
              {/* Print Button */}
              <button
                onClick={handlePrint}
                disabled={printing}
                className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print"
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
                className="flex cursor-pointer shadow-lg font-extrabold items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg  transition-colors duration-200 disabled:opacity-50 no-print"
                title="تحميل"
              >
                {downloading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaDownload className ='text-blue-600'/>
                )}
                <span>تحميل</span>
              </button>

              {/* FIXED: Close Button - Removed animate-spin, added proper onClick */}
              <button
                onClick={onClose}
                className="p-2 cursor-pointer animate-spin text-gray-400 hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform duration-300 mr-2"
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
      <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Overview */}
            <InfoCard icon={FaFileInvoice} title="البيانات الاساسية">
              <InfoRow label="رقم المعاملة" value={transactionData.transaction_no} />
              <InfoRow label="التاريخ" value={formatDate(transactionData.transaction_date)} />
              {/* FIXED: Type in Arabic */}
              <InfoRow label="النوع" value={arabicTypeDisplay} />
              
              <div className ='flex flex-col md:flex-row lg:flex-row justify-between items-center'>
                  
                              <InfoRow
                                  label="المبلغ : "
                                
                                  value={formatCurrency(transactionData.amount)}
                                  highlight={true}
                              />


                              {/* Amount in Words - Displayed after the amount */}
                              {getAmountInWords() && (
                                  <div className="pt-3 mt-1 border-t border-[#a47d52]/20">
                                      <div className="flex flex-wrap gap-1 items-center text-sm">
                                          {/* <span className="text-gray-600">المبلغ كتابةً:</span> */}
                                          <span className="font-medium text-[#a47d52]">
                                              {getAmountInWords()}
                                          </span>
                                          <span className="text-sm text-gray-500">فقط لا غير</span>
                                      </div>
                                  </div>
                              )}



              </div>
              
              <InfoRow 
                label="العملة" 
                value={getArabicCurrency(transactionData.currency)} 
              />
              <InfoRow 
                label="طريقة الدفع" 
                value={getArabicPaymentMethod(transactionData.payment_method_display || transactionData.payment_method)} 
              />

              
              {/* {transactionData.amount_deposit > 0 && (
                <InfoRow label="مبلغ الإيداع" value={formatCurrency(transactionData.amount_deposit)} />
              )}
              {transactionData.amount_withdraw > 0 && (
                <InfoRow label="مبلغ السحب" value={formatCurrency(transactionData.amount_withdraw)} />
              )} */}
            </InfoCard>

            {/* Account Details */}
            <InfoCard icon={FaExchangeAlt} title="تفاصيل الحساب" className="no-print">
                <div className ='grid grid-cols-2 gap-2 items-center'>
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

            {/* Amount in Words */}
            {/* {(transactionData.amount_to_arabic || transactionData.amount_to_english) && (
              <InfoCard icon={FaFileAlt} title="المبلغ كتابة">
                <div className="space-y-2">
                  {transactionData.amount_to_arabic && (
                    <>
                      <div className="text-sm text-gray-600">بالعربية:</div>
                      <div className="text-base font-medium text-gray-800 bg-[#f8f7f5] p-3 rounded-lg">
                        {transactionData.amount_to_arabic}
                      </div>
                    </>
                  )}
                  {transactionData.amount_to_english && (
                    <>
                      <div className="text-sm text-gray-600 mt-2">بالإنجليزية:</div>
                      <div className="text-base font-medium text-gray-800 bg-[#f8f7f5] p-3 rounded-lg">
                        {transactionData.amount_to_english}
                      </div>
                    </>
                  )}
                </div>
              </InfoCard>
            )} */}
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
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

            
            
            {/* Signatures - KEEP AS IS (working version) */}
            {/* Signatures - Display as column normally, row when printing */}
<InfoCard icon={FaSignature} title="بيانات التوقيع">
  <div className="signature-wrapper space-y-2 text-xs">
    <div className="signature-item">
      <strong className="block mb-1">توقيع المحاسب:</strong>
      <pre className="signature-content bg-[#f8f7f5] p-2 rounded mt-1 overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
        {transactionData.user_signature || 'فارغ'}
      </pre>
    </div>
    <div className="signature-item">
      <strong className="block mb-1">توقيع المدير:</strong>
      <pre className="signature-content bg-[#f8f7f5] p-2 rounded mt-1 overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
        {transactionData.manager_signature || 'فارغ'}
      </pre>
    </div>
    <div className="signature-item">
      <strong className="block mb-1">توقيع الطرف الثاني:</strong>
      <pre className="signature-content bg-[#f8f7f5] p-2 rounded mt-1 overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
        {transactionData.second_person_signature || 'فارغ'}
      </pre>
    </div>
  </div>
</InfoCard>

<style>{`
  @media print {
    /* Signature wrapper becomes flex row */
    .signature-wrapper {
      display: flex !important;
      flex-direction: row !important;
      gap: 1.5rem !important;
      padding: 0.5rem 0 !important;
    }
    
    .signature-item {
      flex: 1 !important;
      min-width: 0 !important;
    }
    
    .signature-item strong {
      font-size: 12px !important;
      margin-bottom: 4px !important;
    }
    
    .signature-content {
      background: transparent !important;
      max-height: none !important;
      border: 1px solid #d1d5db !important;
      padding: 0.75rem !important;
      margin-top: 0 !important;
      font-size: 12px !important;
    }
    
    /* Other print styles */
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

            {/* Audit Information */}
            <InfoCard icon={FaClock} title="معلومات التدقيق" className="no-print">
              <InfoRow label="تم الإنشاء بواسطة" value={transactionData.transaction_user} />
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


// import React, { useState, useEffect, useRef } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
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
// import AddDeposit from './AddDeposit'; // Adjust path as needed
// import AddWithdraw from './AddWithdraw'; // Adjust path as needed

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
// }


// // Currency mapping for display
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
//   const [transactionData, setTransactionData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [printing, setPrinting] = useState(false);
//   const [downloading, setDownloading] = useState(false);
//   const contentRef = useRef(null);

//   // State for update modals
//   const [showUpdateDepositModal, setShowUpdateDepositModal] = useState(false);
//   const [showUpdateWithdrawModal, setShowUpdateWithdrawModal] = useState(false);
//   const [selectedTransaction, setSelectedTransaction] = useState(null);

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

//   // Handle opening the update form based on transaction type
//   const handleOpenUpdateForm = () => {
//     if (!transactionData) return;

//     // Set the selected transaction data
//     setSelectedTransaction(transactionData);

//     // Open the appropriate modal based on transaction type
//     if (transactionData.type === 'deposit' || transactionData.type === 'income') {
//       setShowUpdateDepositModal(true);
//     } else if (transactionData.type === 'withdraw' || transactionData.type === 'expense') {
//       setShowUpdateWithdrawModal(true);
//     } else {
//       toast.error('نوع المعاملة غير معروف للتحديث');
//     }
//   };

//   // Handle modal close and refresh
//   const handleUpdateModalClose = () => {
//     setShowUpdateDepositModal(false);
//     setShowUpdateWithdrawModal(false);
//     setSelectedTransaction(null);
    
//     // Refresh transaction data after update
//     if (transactionId) {
//       // Re-fetch the transaction data
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
//             toast.success('✅ تم تحديث المعاملة بنجاح');
            
//             // Notify parent component if callback exists
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

//   // Improved currency formatting function
//     // Format currency with Arabic support
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

//   // Handle Print
//   const handlePrint = () => {
//     setPrinting(true);
//     setTimeout(() => {
//       window.print();
//       setPrinting(false);
//     }, 500);
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

//       const htmlContent = `
//         <!DOCTYPE html>
//         <html dir="rtl" lang="ar">
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>تفاصيل المعاملة - ${transactionData?.transaction_no || 'غير معروف'}</title>
//           <style>
//             ${styleText}
//             body { 
//               padding: 20px; 
//               background: white;
//               font-family: 'Arial', sans-serif;
//             }
//             .no-print {
//               display: none !important;
//             }
//             @media print {
//               .no-print { display: none !important; }
//               body { padding: 0; }
//             }
//           </style>
//         </head>
//         <body>
//           ${clone.innerHTML}
//         </body>
//         </html>
//       `;

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

//   const InfoRow = ({ label, value, highlight = false }) => (
//     <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
//       <span className="text-sm text-gray-600">{label}</span>
//       <span className={`text-sm font-medium ${highlight ? 'text-[#8B7355]' : 'text-gray-800'}`}>
//         {value || '-'}
//       </span>
//     </div>
//   );

// // ...Display Signature
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




//   const isWithdrawOrExpense = () => {
//     const type = transactionData?.type?.toLowerCase();
//     return type === 'withdraw' || type === 'expense' || type === 'withdrawal';
//   };

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

//       {/* Header with Print and Download Buttons */}
//       <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="py-6 flex items-center justify-between flex-wrap gap-4">
//             <div className="flex items-center gap-4">
//               <h1 className="text-2xl font-bold text-gray-800">تفاصيل المعاملة</h1>
//               <p className="text-sm text-gray-500">#{transactionData.transaction_no}</p>
//             </div>
//             <div className="flex items-center gap-3 flex-wrap">
//               <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
//                 transactionData.type === 'deposit' || transactionData.type === 'income'
//                   ? 'bg-green-100 text-green-800 border-green-200' 
//                   : transactionData.type === 'withdraw' || transactionData.type === 'expense'
//                   ? 'bg-red-100 text-red-800 border-red-200'
//                   : 'bg-gray-100 text-gray-800 border-gray-200'
//               }`}>
//                 {transactionData.type_display || transactionData.type}
//               </span>
              
//               {/* Signature/Update Button */}
//               <button
//                 onClick={handleOpenUpdateForm}
//                 className="flex font-extrabold items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 no-print"
//                 title="توقيع / تحديث"
//               >
//                 <PiSignatureThin size="25" />
//                 <span>توقيع</span>
//               </button>
              
//               {/* Print Button */}
//               <button
//                 onClick={handlePrint}
//                 disabled={printing}
//                 className="flex items-center gap-2 px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5B45] transition-colors duration-200 disabled:opacity-50 no-print"
//                 title="طباعة"
//               >
//                 {printing ? (
//                   <FaSpinner className="animate-spin" />
//                 ) : (
//                   <FaPrint />
//                 )}
//                 <span>طباعة</span>
//               </button>

//               {/* Download Button */}
//               <button
//                 onClick={handleDownload}
//                 disabled={downloading}
//                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 no-print"
//                 title="تحميل"
//               >
//                 {downloading ? (
//                   <FaSpinner className="animate-spin" />
//                 ) : (
//                   <FaDownload />
//                 )}
//                 <span>تحميل</span>
//               </button>

//                 <button
//                     className="animate-spin mr-15 cursor-pointer text-gray-400 hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
//                     onClick={onClose}
//                     disabled={loading}
//                     >
//                         ✕
//                 </button>
//             </div>
//           </div>
//         </div>
//       </div>

//         {/* Main Content - Wrapped for Print/Download */}
//         <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
//           {/* Left Column - Main Info */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Transaction Overview */}
//             <InfoCard icon={FaFileInvoice} title="نظرة عامة على المعاملة">
//               <InfoRow label="رقم المعاملة" value={transactionData.transaction_no} />
//               <InfoRow label="التاريخ" value={formatDate(transactionData.transaction_date)} />
//               <InfoRow label="النوع" value={transactionData.type_display || transactionData.type} />
//               <InfoRow 
//                 label="المبلغ" 
//                 value={formatCurrency(transactionData.amount)} 
//                 highlight={true}
//               />
//                <InfoRow 
//                 label="العملة" 
//                 value={getArabicCurrency(transactionData.currency)} 
//               />
//               <InfoRow 
//                 label="طريقة الدفع" 
//                 value={getArabicPaymentMethod(transactionData.payment_method_display || transactionData.payment_method)} 
//               />
//               {transactionData.amount_deposit > 0 && (
//                 <InfoRow label="مبلغ الإيداع" value={formatCurrency(transactionData.amount_deposit)} />
//               )}
//               {transactionData.amount_withdraw > 0 && (
//                 <InfoRow label="مبلغ السحب" value={formatCurrency(transactionData.amount_withdraw)} />
//               )}
//             </InfoCard>

//             {/* Account Details */}
//             <InfoCard icon={FaExchangeAlt} title="تفاصيل الحساب">
//               <InfoRow label="من حساب" value={transactionData.account_from} />
//               <InfoRow label="إلى حساب" value={transactionData.account_to} />
//               <InfoRow label="البنك" value={transactionData.bank_name || transactionData.bank} />
//               <InfoRow label="الصندوق" value={transactionData.cashbox_name || transactionData.cashbox} />
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
//               <InfoCard icon={FaFilePdf} title="معلومات المستند">
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
//             {(transactionData.amount_to_arabic || transactionData.amount_to_english) && (
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
//             )}
//           </div>

//           {/* Right Column - Additional Info */}
//           <div className="space-y-6">
//             {/* People Involved - Conditional based on transaction type */}
//             <InfoCard icon={FaUser} title="الأشخاص المعنيون">
//               {isWithdrawOrExpense() ? (
//                 // For Withdraw/Expense - show receiver
//                 <InfoRow label="الشخص المستلم" value={transactionData.person_receipt} />
//               ) : (
//                 // For Deposit/Income - show deliverer
//                 <InfoRow label="الشخص المسلم" value={transactionData.person_deliver} />
//               )}
//             </InfoCard>

//             {/* Statement & Notes */}
//             <InfoCard icon={FaStickyNote} title="البيان والملاحظات">
//               <div className="text-sm text-gray-700 bg-[#f8f7f5] p-3 rounded-lg">
//                 {transactionData.statement || 'لا يوجد بيان'}
//               </div>
//               {transactionData.notes && (
//                 <div className="mt-3 text-sm text-gray-700 bg-[#f8f7f5] p-3 rounded-lg">
//                   <span className="font-medium">ملاحظات:</span> {transactionData.notes}
//                 </div>
//               )}
//             </InfoCard>

//             {/* Signatures */}
//             {/* Signatures - Display base64 signatures */}
//             {/* Debug: Show raw signature data */}
// <InfoCard icon={FaSignature} title="بيانات التوقيع">
//   <div className="space-y-2 text-xs">
//     <div>
//       <strong>توقيع المحاسب:</strong>
//       <pre className="bg-[#f8f7f5] p-2 rounded mt-1 overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
//         {transactionData.user_signature || 'فارغ'}
//       </pre>
//     </div>
//     <div>
//       <strong>توقيع المدير:</strong>
//       <pre className="bg-[#f8f7f5] p-2 rounded mt-1 overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
//         {transactionData.manager_signature || 'فارغ'}
//       </pre>
//     </div>
//     <div>
//       <strong>توقيع الطرف الثاني:</strong>
//       <pre className="bg-[#f8f7f5] p-2 rounded mt-1 overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
//         {transactionData.second_person_signature || 'فارغ'}
//       </pre>
//     </div>
//   </div>
// </InfoCard>

//             {/* Audit Information */}
//             <InfoCard icon={FaClock} title="معلومات التدقيق">
//               <InfoRow label="تم الإنشاء بواسطة" value={transactionData.transaction_user} />
//               <InfoRow label="تاريخ الإنشاء" value={formatDate(transactionData.created_at)} />
//               <InfoRow label="آخر تحديث" value={formatDate(transactionData.updated_at)} />
//             </InfoCard>
//           </div>
//         </div>
//       </div>

//       {/* Update Modals */}
      
//       {/* Update Deposit Modal */}
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
//                   // Refresh the transaction data
//                   handleUpdateModalClose();
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Update Withdraw Modal */}
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
//                   // Refresh the transaction data
//                   handleUpdateModalClose();
//                 }}
//               />
//             </div>
//           </div>
//         </div>
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


// import React from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { 
//   FaArrowLeft, 
//   FaFileInvoice, 
//   FaCalendarAlt, 
//   FaMoneyBillWave, 
//   FaCreditCard,
//   FaUniversity,
//   FaUser,
//   FaStickyNote,
//   FaFilePdf,
//   FaCheckCircle,
//   FaSignature,
//   FaExchangeAlt,
//   FaBuilding,
//   FaCashRegister,
//   FaFileAlt,
//   FaUserCheck,
//   FaUserTie,
//   FaClock
// } from 'react-icons/fa';

// const TransactionDetails = () => {
//   const { id } = useParams();
  
//   // Mock data - Replace with actual API call
//   const transactionData = {
//     id: id,
//     transaction_no: 'TRX-2026-0001',
//     transaction_date: '2026-09-02',
//     type: 'deposit',
//     type_display: 'Deposit',
//     amount: 1500.00,
//     amount_deposit: 1500.00,
//     amount_withdraw: 0.00,
//     currency: 'USD',
//     payment_method: 'bank_transfer',
//     payment_method_display: 'Bank Transfer',
//     account_from: 'Main Operating Account',
//     account_to: 'Savings Account',
//     bank: 'Chase Bank',
//     bank_name: 'JPMorgan Chase',
//     cashbox: 'CB-001',
//     cashbox_name: 'Main Cash Box',
//     statement: 'Monthly savings deposit',
//     has_check: true,
//     check_no: 'CHK-2026-0042',
//     check_bank: 'Wells Fargo',
//     check_date: '2026-09-01',
//     person_deliver: 'John Smith',
//     person_receipt: 'Jane Doe',
//     notes: 'Approved by department head',
//     has_document: true,
//     document: 'deposit_slip_0902.pdf',
//     document_no: 'DOC-2026-0789',
//     transaction_user: 'admin_user',
//     created_at: '2026-09-02T10:30:00Z',
//     updated_at: '2026-09-02T11:15:00Z',
//     amount_to_arabic: 'ألف وخمسمائة دولار',
//     amount_to_english: 'One Thousand Five Hundred Dollars',
//     user_signature: 'user_signature_url.png',
//     manager_signature: 'manager_signature_url.png',
//     second_person_signature: 'second_person_signature_url.png'
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: transactionData.currency || 'USD'
//     }).format(amount);
//   };

//   const getStatusColor = (type) => {
//     if (type === 'deposit' || type === 'credit') return 'text-green-600';
//     if (type === 'withdraw' || type === 'debit') return 'text-red-600';
//     return 'text-blue-600';
//   };

//   const InfoCard = ({ icon: Icon, title, children, className = '' }) => (
//     <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-100 ${className}`}>
//       <div className="flex items-center gap-2 mb-4">
//         <Icon className="text-[#8B7355] text-lg" />
//         <h3 className="font-semibold text-gray-700">{title}</h3>
//       </div>
//       {children}
//     </div>
//   );

//   const InfoRow = ({ label, value, highlight = false }) => (
//     <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
//       <span className="text-sm text-gray-600">{label}</span>
//       <span className={`text-sm font-medium ${highlight ? 'text-[#8B7355]' : 'text-gray-800'}`}>
//         {value || '-'}
//       </span>
//     </div>
//   );

//   const SignatureDisplay = ({ label, signatureUrl }) => (
//     <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
//       <span className="text-xs text-gray-500">{label}</span>
//       {signatureUrl ? (
//         <img 
//           src={signatureUrl} 
//           alt={label} 
//           className="h-12 object-contain"
//         />
//       ) : (
//         <div className="h-12 w-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
//           <FaSignature className="text-gray-400" />
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-[#f8f7f5]">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="py-6 flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <Link 
//                 to="/transactions" 
//                 className="text-[#8B7355] hover:text-[#6B5B45] transition-colors"
//               >
//                 <FaArrowLeft className="text-xl" />
//               </Link>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-800">Transaction Details</h1>
//                 <p className="text-sm text-gray-500">#{transactionData.transaction_no}</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <span className="px-3 py-1 bg-[#f8f7f5] rounded-full text-sm text-gray-600 border border-gray-200">
//                 {transactionData.type_display}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
//           {/* Left Column - Main Info */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Transaction Overview */}
//             <InfoCard icon={FaFileInvoice} title="Transaction Overview">
//               <InfoRow label="Transaction Number" value={transactionData.transaction_no} />
//               <InfoRow label="Date" value={formatDate(transactionData.transaction_date)} />
//               <InfoRow label="Type" value={transactionData.type_display} />
//               <InfoRow 
//                 label="Amount" 
//                 value={formatCurrency(transactionData.amount)} 
//                 highlight={true}
//               />
//               <InfoRow label="Currency" value={transactionData.currency} />
//               <InfoRow label="Payment Method" value={transactionData.payment_method_display} />
//               {transactionData.amount_deposit > 0 && (
//                 <InfoRow label="Deposit Amount" value={formatCurrency(transactionData.amount_deposit)} />
//               )}
//               {transactionData.amount_withdraw > 0 && (
//                 <InfoRow label="Withdrawal Amount" value={formatCurrency(transactionData.amount_withdraw)} />
//               )}
//             </InfoCard>

//             {/* Account Details */}
//             <InfoCard icon={FaExchangeAlt} title="Account Details">
//               <InfoRow label="From Account" value={transactionData.account_from} />
//               <InfoRow label="To Account" value={transactionData.account_to} />
//               <InfoRow label="Bank" value={transactionData.bank_name || transactionData.bank} />
//               <InfoRow label="Cashbox" value={transactionData.cashbox_name || transactionData.cashbox} />
//             </InfoCard>

//             {/* Check Information */}
//             {transactionData.has_check && (
//               <InfoCard icon={FaCheckCircle} title="Check Information">
//                 <InfoRow label="Check Number" value={transactionData.check_no} />
//                 <InfoRow label="Check Bank" value={transactionData.check_bank} />
//                 <InfoRow label="Check Date" value={transactionData.check_date ? formatDate(transactionData.check_date) : '-'} />
//               </InfoCard>
//             )}

//             {/* Document Information */}
//             {transactionData.has_document && (
//               <InfoCard icon={FaFilePdf} title="Document Information">
//                 <InfoRow label="Document" value={transactionData.document} />
//                 <InfoRow label="Document Number" value={transactionData.document_no} />
//                 <div className="mt-3">
//                   <button className="text-[#8B7355] hover:text-[#6B5B45] text-sm font-medium flex items-center gap-2">
//                     <FaFilePdf />
//                     View Document
//                   </button>
//                 </div>
//               </InfoCard>
//             )}

//             {/* Amount in Words */}
//             <InfoCard icon={FaFileAlt} title="Amount in Words">
//               <div className="space-y-2">
//                 <div className="text-sm text-gray-600">Arabic:</div>
//                 <div className="text-base font-medium text-gray-800 bg-[#f8f7f5] p-3 rounded-lg">
//                   {transactionData.amount_to_arabic}
//                 </div>
//                 <div className="text-sm text-gray-600 mt-2">English:</div>
//                 <div className="text-base font-medium text-gray-800 bg-[#f8f7f5] p-3 rounded-lg">
//                   {transactionData.amount_to_english}
//                 </div>
//               </div>
//             </InfoCard>
//           </div>

//           {/* Right Column - Additional Info */}
//           <div className="space-y-6">
//             {/* People Involved */}
//             <InfoCard icon={FaUser} title="People Involved">
//               <InfoRow label="Person Deliver" value={transactionData.person_deliver} />
//               <InfoRow label="Person Receipt" value={transactionData.person_receipt} />
//             </InfoCard>

//             {/* Statement & Notes */}
//             <InfoCard icon={FaStickyNote} title="Statement & Notes">
//               <div className="text-sm text-gray-700 bg-[#f8f7f5] p-3 rounded-lg">
//                 {transactionData.statement || 'No statement provided'}
//               </div>
//               {transactionData.notes && (
//                 <div className="mt-3 text-sm text-gray-700 bg-[#f8f7f5] p-3 rounded-lg">
//                   <span className="font-medium">Notes:</span> {transactionData.notes}
//                 </div>
//               )}
//             </InfoCard>

//             {/* Signatures */}
//             <InfoCard icon={FaSignature} title="Signatures">
//               <div className="space-y-3">
//                 <SignatureDisplay 
//                   label="User Signature" 
//                   signatureUrl={transactionData.user_signature} 
//                 />
//                 <SignatureDisplay 
//                   label="Manager Signature" 
//                   signatureUrl={transactionData.manager_signature} 
//                 />
//                 <SignatureDisplay 
//                   label="Second Person Signature" 
//                   signatureUrl={transactionData.second_person_signature} 
//                 />
//               </div>
//             </InfoCard>

//             {/* Audit Information */}
//             <InfoCard icon={FaClock} title="Audit Information">
//               <InfoRow label="Created By" value={transactionData.transaction_user} />
//               <InfoRow label="Created At" value={formatDate(transactionData.created_at)} />
//               <InfoRow label="Updated At" value={formatDate(transactionData.updated_at)} />
//             </InfoCard>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TransactionDetails;              