import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaTimes, FaSave, FaSpinner, FaUser, FaCalendar, FaMoneyBillWave, FaCreditCard, FaUniversity, FaCashRegister, FaFile, FaCheck, FaStickyNote, FaUserCheck, FaFilePdf, FaSignature, FaImage } from 'react-icons/fa';

// Base URL from environment variables
const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// Transaction type choices
const TRANSACTION_TYPES = [
    { value: 'deposit', label: 'إيداع' },
    { value: 'withdraw', label: 'سحب' },
];

// Payment method choices
const PAYMENT_METHODS = [
    { value: 'cash', label: 'نقدي' },
    { value: 'banks', label: 'بنوك' },
];

// Currency choices
const CURRENCIES = [
    { value: 'USD', label: 'دولار أمريكي' },
    { value: 'EUR', label: 'يورو' },
    { value: 'GBP', label: 'جنيه إسترليني' },
    { value: 'AED', label: 'درهم إماراتي' },
    { value: 'SAR', label: 'ريال سعودي' },
    { value: 'JOD', label: 'دينار أردني' },
    { value: 'KWD', label: 'دينار كويتي' },
    { value: 'QAR', label: 'ريال قطري' },
];

const UpdateTransaction = ({ transactionId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        transaction_no: '',
        transaction_date: '',
        type: '',
        amount: '',
        currency: '',
        payment_method: '',
        account_from: '',
        account_to: '',
        bank: '',
        bank_name: '',
        cashbox: '',
        cashbox_name: '',
        statement: '',
        has_check: false,
        check_no: '',
        check_bank: '',
        check_date: '',
        person_deliver: '',
        person_receipt: '',
        notes: '',
        has_document: false,
        document: null,
        document_no: '',
        user_signature: '',
        manager_signature: '',
        second_person_signature: '',
    });
    
    const [errors, setErrors] = useState({});
    const [existingDocument, setExistingDocument] = useState(null);
    const [banks, setBanks] = useState([]);
    const [cashboxes, setCashboxes] = useState([]);
    const [accounts, setAccounts] = useState([]);

    // Fetch transaction data
    useEffect(() => {
        const fetchTransactionData = async () => {
            if (!transactionId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    toast.error('يرجى تسجيل الدخول');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${BASE}/api/transactions/${transactionId}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch transaction');
                }

                const data = await response.json();
                console.log('Fetched transaction:', data);

                setFormData({
                    transaction_no: data.transaction_no || '',
                    transaction_date: data.transaction_date ? data.transaction_date.split('T')[0] : '',
                    type: data.type || '',
                    amount: data.amount || '',
                    currency: data.currency || 'USD',
                    payment_method: data.payment_method || '',
                    account_from: data.account_from || '',
                    account_to: data.account_to || '',
                    bank: data.bank || '',
                    bank_name: data.bank_name || '',
                    cashbox: data.cashbox || '',
                    cashbox_name: data.cashbox_name || '',
                    statement: data.statement || '',
                    has_check: data.has_check || false,
                    check_no: data.check_no || '',
                    check_bank: data.check_bank || '',
                    check_date: data.check_date ? data.check_date.split('T')[0] : '',
                    person_deliver: data.person_deliver || '',
                    person_receipt: data.person_receipt || '',
                    notes: data.notes || '',
                    has_document: data.has_document || false,
                    document: null,
                    document_no: data.document_no || '',
                    user_signature: data.user_signature || '',
                    manager_signature: data.manager_signature || '',
                    second_person_signature: data.second_person_signature || '',
                });

                // Store existing document path
                if (data.document) {
                    setExistingDocument(data.document);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching transaction:', error);
                toast.error('❌ حدث خطأ أثناء تحميل بيانات المعاملة');
                setLoading(false);
            }
        };

        fetchTransactionData();
    }, [transactionId]);

    // Fetch banks, cashboxes, accounts
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                // Fetch banks
                const banksRes = await fetch(`${BASE}/api/banks/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (banksRes.ok) {
                    const data = await banksRes.json();
                    setBanks(data.results || data);
                }

                // Fetch cashboxes
                const cashboxesRes = await fetch(`${BASE}/api/cashboxes/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (cashboxesRes.ok) {
                    const data = await cashboxesRes.json();
                    setCashboxes(data.results || data);
                }

                // Fetch accounts
                const accountsRes = await fetch(`${BASE}/api/accounts/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (accountsRes.ok) {
                    const data = await accountsRes.json();
                    setAccounts(data.results || data);
                }
            } catch (error) {
                console.error('Error fetching options:', error);
            }
        };

        fetchOptions();
    }, []);

    // Handle input change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handle file change for document
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                document: file,
            }));
            // Clear document error if exists
            if (errors.document) {
                setErrors(prev => ({ ...prev, document: '' }));
            }
        }
    };

    // Handle signature change (base64)
    const handleSignatureChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.transaction_date) {
            newErrors.transaction_date = 'التاريخ مطلوب';
        }
        if (!formData.type) {
            newErrors.type = 'نوع المعاملة مطلوب';
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'المبلغ مطلوب وقيمته يجب أن تكون أكبر من 0';
        }
        if (!formData.currency) {
            newErrors.currency = 'العملة مطلوبة';
        }
        if (!formData.payment_method) {
            newErrors.payment_method = 'طريقة الدفع مطلوبة';
        }

        // Type-specific validation
        if (formData.type === 'deposit') {
            if (!formData.account_from) {
                newErrors.account_from = 'الحساب المصدر مطلوب للإيداع';
            }
            if (formData.payment_method === 'banks' && !formData.bank) {
                newErrors.bank = 'البنك مطلوب للإيداع عبر البنوك';
            }
            if (formData.payment_method === 'cash' && !formData.cashbox) {
                newErrors.cashbox = 'الصندوق مطلوب للإيداع نقداً';
            }
        } else if (formData.type === 'withdraw') {
            if (!formData.account_to) {
                newErrors.account_to = 'الحساب الوجهة مطلوب للسحب';
            }
            if (formData.payment_method === 'banks' && !formData.bank) {
                newErrors.bank = 'البنك مطلوب للسحب عبر البنوك';
            }
            if (formData.payment_method === 'cash' && !formData.cashbox) {
                newErrors.cashbox = 'الصندوق مطلوب للسحب نقداً';
            }
        }

        // Check validation
        if (formData.has_check) {
            if (!formData.check_no) {
                newErrors.check_no = 'رقم الشيك مطلوب';
            }
            if (!formData.check_bank) {
                newErrors.check_bank = 'بنك الشيك مطلوب';
            }
            if (!formData.check_date) {
                newErrors.check_date = 'تاريخ الشيك مطلوب';
            }
        }

        // Document validation
        if (formData.has_document && !formData.document_no) {
            newErrors.document_no = 'رقم المستند مطلوب';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('❌ يرجى تصحيح الأخطاء في النموذج');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('يرجى تسجيل الدخول');
                setSaving(false);
                return;
            }

            // Prepare data for submission
            const submitData = {};
            
            // Add all form fields to submitData (excluding file and non-field data)
            Object.keys(formData).forEach(key => {
                if (key === 'document') {
                    // Handle document separately
                    if (formData.document instanceof File) {
                        // If a new file is selected, we need to send it as FormData
                        // We'll handle this below
                    }
                    return;
                }
                
                // Skip empty values except for boolean fields
                if (key === 'has_check' || key === 'has_document') {
                    submitData[key] = formData[key];
                } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                    submitData[key] = formData[key];
                }
            });

            // Check if we need to send FormData (file upload)
            const hasFile = formData.document instanceof File;
            
            let response;
            
            if (hasFile) {
                // Use FormData for file upload
                const formDataObj = new FormData();
                
                // Add all fields to FormData
                Object.keys(submitData).forEach(key => {
                    formDataObj.append(key, submitData[key]);
                });
                
                // Add the file
                formDataObj.append('document', formData.document);
                
                response = await fetch(`${BASE}/api/transactions/${transactionId}/update/`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formDataObj,
                });
            } else {
                // Send as JSON
                response = await fetch(`${BASE}/api/transactions/${transactionId}/update/`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submitData),
                });
            }

            // Log response status for debugging
            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Validation errors:', errorData);
                
                // Handle field-specific errors
                if (errorData && typeof errorData === 'object') {
                    // Check for non-field errors
                    if (errorData.non_field_errors) {
                        toast.error(errorData.non_field_errors.join(', '));
                    } else {
                        setErrors(errorData);
                        // Show first error message
                        const firstError = Object.values(errorData)[0];
                        if (firstError) {
                            toast.error(typeof firstError === 'string' ? firstError : firstError[0]);
                        } else {
                            toast.error('❌ فشل تحديث المعاملة');
                        }
                    }
                }
                throw new Error('Failed to update transaction');
            }

            const data = await response.json();
            console.log('Update response:', data);
            
            toast.success('✅ تم تحديث المعاملة بنجاح');
            
            if (onSuccess) {
                onSuccess(data);
            }
            
            // Close modal after short delay
            setTimeout(() => {
                if (onClose) {
                    onClose();
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error updating transaction:', error);
            if (!error.message.includes('Failed to update transaction')) {
                toast.error('❌ حدث خطأ أثناء تحديث المعاملة');
            }
        } finally {
            setSaving(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mx-auto"></div>
                    <p className="mt-4 text-gray-600">جاري تحميل بيانات المعاملة...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f7f5] p-6" dir="rtl">
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

            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-800">تحديث المعاملة</h2>
                        <p className="text-sm text-gray-500">#{formData.transaction_no}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 cursor-pointer animate-spin text-gray-400 hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform duration-300 mr-2"
                        title="إغلاق"
                        type="button"
                    >
                        {/* <FaTimes className="text-gray-500 text-xl" /> */}
                        ✕
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FaFile className="text-[#8B7355]" />
                            معلومات أساسية
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Transaction Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    التاريخ *
                                </label>
                                <input
                                    type="date"
                                    name="transaction_date"
                                    value={formData.transaction_date}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                        errors.transaction_date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.transaction_date && (
                                    <p className="text-red-500 text-xs mt-1">{errors.transaction_date}</p>
                                )}
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    النوع *
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                        errors.type ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">اختر النوع</option>
                                    {TRANSACTION_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.type && (
                                    <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                                )}
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    المبلغ *
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0.01"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                        errors.amount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.amount && (
                                    <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                                )}
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    العملة *
                                </label>
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                        errors.currency ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    {CURRENCIES.map(currency => (
                                        <option key={currency.value} value={currency.value}>
                                            {currency.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.currency && (
                                    <p className="text-red-500 text-xs mt-1">{errors.currency}</p>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    طريقة الدفع *
                                </label>
                                <select
                                    name="payment_method"
                                    value={formData.payment_method}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                        errors.payment_method ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">اختر طريقة الدفع</option>
                                    {PAYMENT_METHODS.map(method => (
                                        <option key={method.value} value={method.value}>
                                            {method.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.payment_method && (
                                    <p className="text-red-500 text-xs mt-1">{errors.payment_method}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FaUser className="text-[#8B7355]" />
                            معلومات الحساب
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Account From */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.type === 'deposit' ? 'من حساب *' : 'من حساب'}
                                </label>
                                <input
                                    type="text"
                                    name="account_from"
                                    value={formData.account_from}
                                    onChange={handleChange}
                                    placeholder={formData.type === 'deposit' ? 'اسم الحساب المصدر' : 'اسم المصدر'}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                        errors.account_from ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    readOnly={formData.type !== 'deposit'}
                                />
                                {errors.account_from && (
                                    <p className="text-red-500 text-xs mt-1">{errors.account_from}</p>
                                )}
                            </div>

                            {/* Account To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.type === 'withdraw' ? 'إلى حساب *' : 'إلى حساب'}
                                </label>
                                <input
                                    type="text"
                                    name="account_to"
                                    value={formData.account_to}
                                    onChange={handleChange}
                                    placeholder={formData.type === 'withdraw' ? 'اسم الحساب الوجهة' : 'اسم الوجهة'}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                        errors.account_to ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    readOnly={formData.type !== 'withdraw'}
                                />
                                {errors.account_to && (
                                    <p className="text-red-500 text-xs mt-1">{errors.account_to}</p>
                                )}
                            </div>

                            {/* Bank - Conditional */}
                            {(formData.payment_method === 'banks') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        البنك *
                                    </label>
                                    <input
                                        type="text"
                                        name="bank_name"
                                        value={formData.bank_name || formData.bank}
                                        onChange={handleChange}
                                        placeholder="اسم البنك"
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                            errors.bank ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.bank && (
                                        <p className="text-red-500 text-xs mt-1">{errors.bank}</p>
                                    )}
                                </div>
                            )}

                            {/* Cashbox - Conditional */}
                            {(formData.payment_method === 'cash') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        الصندوق *
                                    </label>
                                    <input
                                        type="text"
                                        name="cashbox_name"
                                        value={formData.cashbox_name || formData.cashbox}
                                        onChange={handleChange}
                                        placeholder="اسم الصندوق"
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                            errors.cashbox ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.cashbox && (
                                        <p className="text-red-500 text-xs mt-1">{errors.cashbox}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* People Involved */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FaUserCheck className="text-[#8B7355]" />
                            الأشخاص المعنيون
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.type === 'deposit' ? 'الشخص المودع' : 'الشخص المسلم'}
                                </label>
                                <input
                                    type="text"
                                    name="person_deliver"
                                    value={formData.person_deliver}
                                    onChange={handleChange}
                                    placeholder="اسم الشخص"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.type === 'withdraw' ? 'الشخص المستلم' : 'الشخص المستلم'}
                                </label>
                                <input
                                    type="text"
                                    name="person_receipt"
                                    value={formData.person_receipt}
                                    onChange={handleChange}
                                    placeholder="اسم الشخص المستلم"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Check Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FaCheck className="text-[#8B7355]" />
                            معلومات الشيك
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="has_check"
                                    checked={formData.has_check}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#8B7355] border-gray-300 rounded focus:ring-[#8B7355] ml-2"
                                />
                                <label className="text-sm font-medium text-gray-700">
                                    يوجد شيك
                                </label>
                            </div>

                            {formData.has_check && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            رقم الشيك *
                                        </label>
                                        <input
                                            type="text"
                                            name="check_no"
                                            value={formData.check_no}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                                errors.check_no ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.check_no && (
                                            <p className="text-red-500 text-xs mt-1">{errors.check_no}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            بنك الشيك *
                                        </label>
                                        <input
                                            type="text"
                                            name="check_bank"
                                            value={formData.check_bank}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                                errors.check_bank ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.check_bank && (
                                            <p className="text-red-500 text-xs mt-1">{errors.check_bank}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            تاريخ الشيك *
                                        </label>
                                        <input
                                            type="date"
                                            name="check_date"
                                            value={formData.check_date}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                                errors.check_date ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.check_date && (
                                            <p className="text-red-500 text-xs mt-1">{errors.check_date}</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Document Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FaFilePdf className="text-[#8B7355]" />
                            معلومات المستند
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="has_document"
                                    checked={formData.has_document}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#8B7355] border-gray-300 rounded focus:ring-[#8B7355] ml-2"
                                />
                                <label className="text-sm font-medium text-gray-700">
                                    يوجد مستند
                                </label>
                            </div>

                            {formData.has_document && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            رقم المستند *
                                        </label>
                                        <input
                                            type="text"
                                            name="document_no"
                                            value={formData.document_no}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] ${
                                                errors.document_no ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.document_no && (
                                            <p className="text-red-500 text-xs mt-1">{errors.document_no}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            تحميل المستند
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                name="document"
                                                onChange={handleFileChange}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#8B7355] file:text-white hover:file:bg-[#6B5B45]"
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            />
                                            {existingDocument && (
                                                <a 
                                                    href={`${BASE}${existingDocument}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-[#8B7355] hover:text-[#6B5B45] text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                                                >
                                                    <FaImage />
                                                    عرض المستند الحالي
                                                </a>
                                            )}
                                        </div>
                                        {existingDocument && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                المستند الحالي: {existingDocument.split('/').pop()}
                                            </p>
                                        )}
                                        {formData.document instanceof File && (
                                            <p className="text-xs text-green-600 mt-1">
                                                ✅ تم اختيار ملف جديد: {formData.document.name}
                                            </p>
                                        )}
                                        {errors.document && (
                                            <p className="text-red-500 text-xs mt-1">{errors.document}</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Statement & Notes */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FaStickyNote className="text-[#8B7355]" />
                            البيان والملاحظات
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    البيان
                                </label>
                                <input
                                    type="text"
                                    name="statement"
                                    value={formData.statement}
                                    onChange={handleChange}
                                    placeholder="بيان المعاملة"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ملاحظات
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="ملاحظات إضافية"
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FaSignature className="text-[#8B7355]" />
                            التوقيعات
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    توقيع المحاسب
                                </label>
                                <input
                                    type="text"
                                    name="user_signature"
                                    value={formData.user_signature}
                                    onChange={handleChange}
                                    placeholder="اسم المحاسب"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    توقيع المدير
                                </label>
                                <input
                                    type="text"
                                    name="manager_signature"
                                    value={formData.manager_signature}
                                    onChange={handleChange}
                                    placeholder="اسم المدير"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    توقيع الطرف الثاني
                                </label>
                                <input
                                    type="text"
                                    name="second_person_signature"
                                    value={formData.second_person_signature}
                                    onChange={handleChange}
                                    placeholder="اسم الطرف الثاني"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    
                    <button
                        type="submit"
                        disabled={saving}
                        className="cursor-pointer font-extrabold px-6 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5B45] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <FaSave />
                                حفظ التعديلات
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer font-extrabold px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={saving}
                    >
                        إلغاء
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdateTransaction;