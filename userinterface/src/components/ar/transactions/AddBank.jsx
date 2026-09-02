import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const AddBank = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        balance_opening: '',
        account_number: '',
        iban: '',
        swift_code: '',
        currency: 'AED',
        is_active: true,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Create refs for each input
    const nameRef = useRef(null);
    const balanceRef = useRef(null);
    const accountRef = useRef(null);
    const ibanRef = useRef(null);
    const swiftRef = useRef(null);
    const currencyRef = useRef(null);
    const notesRef = useRef(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBalanceOpeningChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setFormData(prev => ({
                ...prev,
                balance_opening: value
            }));
            if (errors.balance_opening) {
                setErrors(prev => ({ ...prev, balance_opening: '' }));
            }
        }
    };

    // Handle Enter key to move to next input
    const handleKeyDown = (e, nextRef) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextRef && nextRef.current) {
                nextRef.current.focus();
            }
        }
    };

    // Handle Enter key on the last input (notes) to submit
    const handleLastInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = {};
        const trimmedName = formData.name.trim();
        
        if (!trimmedName) {
            newErrors.name = 'اسم البنك مطلوب';
        } else if (trimmedName.length < 2) {
            newErrors.name = 'اسم البنك يجب أن يكون على الأقل حرفين';
        }

        const balanceValue = formData.balance_opening === '' ? 0 : parseFloat(formData.balance_opening);
        if (isNaN(balanceValue) || balanceValue < 0) {
            newErrors.balance_opening = 'رصيد الافتتاح يجب أن يكون رقماً صحيحاً غير سالب';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.warning('يرجى تصحيح الأخطاء في النموذج');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                toast.error('يرجى تسجيل الدخول أولاً');
                setLoading(false);
                return;
            }

            const postData = {
                name: trimmedName,
                balance_opening: balanceValue,
                account_number: formData.account_number.trim() || '',
                iban: formData.iban.trim() || '',
                swift_code: formData.swift_code.trim() || '',
                currency: formData.currency,
                is_active: formData.is_active,
                notes: formData.notes.trim() || ''
            };

            const response = await fetch(
                `${BASE}/api/banks/create/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(postData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400) {
                    const errorMessages = [];
                    Object.keys(data).forEach(key => {
                        if (Array.isArray(data[key])) {
                            errorMessages.push(`${key}: ${data[key].join(', ')}`);
                        } else {
                            errorMessages.push(data[key]);
                        }
                    });
                    const errorMsg = errorMessages.join(' | ') || 'فشل إضافة البنك';
                    toast.error(errorMsg);
                    setErrors(prev => ({ ...prev, general: errorMsg }));
                } else if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error('فشل إضافة البنك');
                }
                setLoading(false);
                return;
            }

            toast.success(`✅ تم إضافة البنك "${trimmedName}" بنجاح!`);
            setLoading(false);
            
            setFormData({
                name: '',
                balance_opening: '',
                account_number: '',
                iban: '',
                swift_code: '',
                currency: 'AED',
                is_active: true,
                notes: ''
            });
            setErrors({});
            
            if (onSuccess) {
                const formattedData = {
                    ...data,
                    balance: parseFloat(data.balance) || 0,
                    balance_opening: parseFloat(data.balance_opening) || 0
                };
                onSuccess(formattedData);
            }
            
            setTimeout(() => {
                if (onClose) onClose();
            }, 1500);

        } catch (err) {
            console.error('Error adding bank:', err);
            toast.error('خطأ في الاتصال بالخادم');
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) onClose();
    };

    React.useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && !loading) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [loading, onClose]);

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => document.body.style.overflow = 'unset';
    }, []);

    // Independent fill states for each input
    const isNameFilled = formData.name.trim().length > 0;
    const isBalanceFilled = formData.balance_opening.trim().length > 0;
    const isAccountFilled = formData.account_number.trim().length > 0;
    const isIbanFilled = formData.iban.trim().length > 0;
    const isSwiftFilled = formData.swift_code.trim().length > 0;
    const isNotesFilled = formData.notes.trim().length > 0;

    // Get border color - RED when empty, #a47d52 when filled
    const getFieldBorderColor = (isFilled, hasError) => {
        if (hasError) return '#ef4444';
        if (isFilled) return '#a47d52';
        return '#ef4444'; // Red when empty
    };

    const getFieldIndicatorColor = (isFilled, hasError) => {
        if (hasError) return 'bg-red-500';
        if (isFilled) return 'bg-[#a47d52]';
        return 'bg-red-500'; // Red when empty
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/1 backdrop-blur-sm p-4" />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 rtl" onClick={handleClose}>
                <div 
                    className="bg-[#f8f7f5] rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                    style={{ animation: 'modalFadeIn 0.3s ease-out' }}
                >
                    <style>
                        {`
                            @keyframes modalFadeIn {
                                from { opacity: 0; transform: scale(0.95) translateY(-20px); }
                                to { opacity: 1; transform: scale(1) translateY(0); }
                            }
                        `}
                    </style>

                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-[#f8f7f5] z-10">
                        <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                            إضافة بنك
                        </h3>
                        <button 
                            className="text-red-600 cursor-pointer hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Name Field - Required */}
                            <div className="mb-4">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    اسم البنك <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        ref={nameRef}
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, balanceRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor: getFieldBorderColor(isNameFilled, errors.name),
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            boxShadow: errors.name ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 
                                                        isNameFilled ? '0 0 0 3px rgba(164, 125, 82, 0.1)' : '0 0 0 3px rgba(239, 68, 68, 0.1)'
                                        }}
                                        placeholder="مثال: البنك الأهلي"
                                        required
                                        dir="rtl"
                                        disabled={loading}
                                        autoFocus
                                    />
                                    <div 
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isNameFilled, errors.name)}`}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-red-500 text-sm font-semibold mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Balance Opening Field */}
                            <div className="mb-4">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    رصيد الافتتاح
                                </label>
                                <div className="relative">
                                    <input
                                        ref={balanceRef}
                                        type="text"
                                        name="balance_opening"
                                        value={formData.balance_opening}
                                        onChange={handleBalanceOpeningChange}
                                        onKeyDown={(e) => handleKeyDown(e, accountRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right "
                                        
                                        placeholder="0.00"
                                        dir="ltr"
                                        disabled={loading}
                                    />
                                    {/* <div 
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isBalanceFilled, errors.balance_opening)}`}
                                    /> */}
                                </div>
                                {/* {errors.balance_opening && (
                                    <p className="text-red-500 text-sm font-semibold mt-1">{errors.balance_opening}</p>
                                )} */}
                            </div>

                            {/* Balance Field (Disabled - Auto Synced) */}
                            <div className="mb-4">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    الرصيد الحالي
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.balance_opening ? parseFloat(formData.balance_opening).toFixed(2) : '0.00'}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-sm shadow-lg text-right  border-gray-200 cursor-not-allowed"
                                        
                                        dir="ltr"
                                        disabled
                                    />
                                    <div className="absolute right-0 top-0 h-full w-1 rounded-r-lg bg-gray-300" />
                                </div>
                            </div>

                            {/* Account Number Field - Optional */}
                            <div className="mb-4">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    رقم الحساب
                                </label>
                                <div className="relative">
                                    <input
                                        ref={accountRef}
                                        type="text"
                                        name="account_number"
                                        value={formData.account_number}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, ibanRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        
                                        placeholder="رقم الحساب"
                                        dir="ltr"
                                        disabled={loading}
                                    />
                                    
                                </div>
                            </div>

                            {/* IBAN Field - Optional */}
                            <div className="mb-4">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    IBAN
                                </label>
                                <div className="relative">
                                    <input
                                        ref={ibanRef}
                                        type="text"
                                        name="iban"
                                        value={formData.iban}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, swiftRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right "
                                        
                                        placeholder="SA0000000000000000000000"
                                        dir="ltr"
                                        disabled={loading}
                                    />
                                    
                                </div>
                            </div>

                            {/* SWIFT Code Field - Optional */}
                            <div className="mb-4">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    SWIFT Code
                                </label>
                                <div className="relative">
                                    <input
                                        ref={swiftRef}
                                        type="text"
                                        name="swift_code"
                                        value={formData.swift_code}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, currencyRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        
                                    
                                        placeholder="ABCDEFGHIJK"
                                        dir="ltr"
                                        disabled={loading}
                                    />
                                    
                                </div>
                            </div>

                            {/* Currency Field */}
                            <div className="mb-4 md:col-span-2 lg:col-span-1">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    العملة
                                </label>
                                <div className="relative">
                                    <select
                                        ref={currencyRef}
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, notesRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        
                                        disabled={loading}
                                    >
                                        <option value="AED">درهم إماراتي (AED)</option>
                                        <option value="USD">دولار أمريكي (USD)</option>
                                        <option value="EUR">يورو (EUR)</option>
                                        <option value="SAR">ريال سعودي (SAR)</option>
                                    </select>
                                    
                                </div>
                            </div>

                            {/* Notes Field - Full Width */}
                            <div className="mb-4 md:col-span-2 lg:col-span-3">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    ملاحظات
                                </label>
                                <div className="relative">
                                    <textarea
                                        ref={notesRef}
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        onKeyDown={handleLastInputKeyDown}
                                        className="w-full px-4 py-3 bg-white rounded-sm focus:outline-none transition-all duration-300 text-right shadow-lg resize-none"
                                        placeholder="ملاحظات اضافية عن البنك ان وجدت"
                                        rows="3"
                                        dir="rtl"
                                        disabled={loading}
                                        
                                    />
                                    
                                </div>
                            </div>
                        </div>

                        {/* Active Status Toggle */}
                        <div className="mt-2">
                            <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-[#a47d52] focus:ring-[#a47d52] focus:ring-2 border-gray-300 rounded transition-all duration-200"
                                    disabled={loading}
                                />
                                <span></span>
                                <span className="text-sm font-extrabold text-gray-700">
                                    بنك نشط
                                </span>
                            </label>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-3 bg-[#a47d52] cursor-pointer text-white py-3.5 rounded-lg font-extrabold transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md hover:shadow-lg"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                        </svg>
                                        جاري الإضافة...
                                    </span>
                                ) : (
                                    'إضافة بنك'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 bg-gray-200 cursor-pointer text-red-600 py-3.5 rounded-lg font-extrabold transition-all duration-300 hover:bg-gray-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AddBank;