import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const AddCashBox = ({ onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [balanceOpening, setBalanceOpening] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [balanceError, setBalanceError] = useState('');

    const handleChange = (e) => {
        setName(e.target.value);
        if (error) setError('');
    };

    const handleBalanceOpeningChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setBalanceOpening(value);
            if (balanceError) setBalanceError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('اسم صندوق النقد مطلوب');
            toast.warning('يرجى إدخال اسم صندوق النقد');
            return;
        }

        if (trimmedName.length < 2) {
            setError('اسم صندوق النقد يجب أن يكون على الأقل حرفين');
            toast.warning('اسم صندوق النقد يجب أن يكون على الأقل حرفين');
            return;
        }

        const balanceValue = balanceOpening === '' ? 0 : parseFloat(balanceOpening);
        
        if (isNaN(balanceValue)) {
            setBalanceError('رصيد الافتتاح يجب أن يكون رقماً صحيحاً');
            toast.warning('رصيد الافتتاح يجب أن يكون رقماً صحيحاً');
            return;
        }
        
        if (balanceValue < 0) {
            setBalanceError('رصيد الافتتاح لا يمكن أن يكون سالباً');
            toast.warning('رصيد الافتتاح لا يمكن أن يكون سالباً');
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
                balance: balanceValue,
                balance_opening: balanceValue,
                is_active: true
            };

            console.log('Sending data:', postData);

            const response = await fetch(
                `${BASE}/api/cashboxes/create/`,
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
            console.log('Response data:', data);

            if (!response.ok) {
                if (response.status === 400) {
                    const errorMsg = data.name ? data.name.join(', ') : 'فشل إضافة صندوق النقد';
                    toast.error(errorMsg);
                    setError(errorMsg);
                } else if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error('فشل إضافة صندوق النقد');
                }
                setLoading(false);
                return;
            }

            toast.success(`✅ تم إضافة صندوق النقد "${trimmedName}" بنجاح!`);
            setLoading(false);
            setName('');
            setBalanceOpening('');
            setError('');
            setBalanceError('');
            
            // Pass the data back to parent
            if (onSuccess) {
                // Make sure balance_opening is a number
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
            console.error('Error adding cash box:', err);
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

    const isNameFilled = name.trim().length > 0;
    const isBalanceFilled = balanceOpening.trim().length > 0;

    const getNameBorderColor = () => {
        if (error) return '#ef4444';
        if (isNameFilled) return '#a47d52';
        return '#ef4444';
    };

    const getBalanceBorderColor = () => {
        if (balanceError) return '#ef4444';
        if (isBalanceFilled) return '#a47d52';
        return '#d1d5db';
    };

    const getNameIndicatorColor = () => {
        if (error) return 'bg-red-500';
        if (isNameFilled) return 'bg-[#a47d52]';
        return 'bg-red-500';
    };

    const getBalanceIndicatorColor = () => {
        if (balanceError) return 'bg-red-500';
        if (isBalanceFilled) return 'bg-[#a47d52]';
        return 'bg-gray-300';
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/1 backdrop-blur-sm p-4" />
            
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 rtl" onClick={handleClose}>
                <div 
                    className="bg-[#f8f7f5] rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
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

                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                            إضافة صندوق نقد
                        </h3>
                        <button 
                            className="text-red-600 cursor-pointer hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="mb-6">
                            <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                اسم صندوق النقد <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white rounded-lg focus:outline-none transition-all duration-300 text-right border-2"
                                    style={{
                                        borderTopColor: 'transparent',
                                        borderBottomColor: 'transparent',
                                        borderLeftColor: 'transparent',
                                        borderRightColor: getNameBorderColor(),
                                        borderWidth: '2px',
                                        borderStyle: 'solid',
                                        boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 
                                                    isNameFilled ? '0 0 0 3px rgba(164, 125, 82, 0.1)' : '0 0 0 3px rgba(239, 68, 68, 0.1)'
                                    }}
                                    placeholder="مثال: صندوق نقدي - الخزينه"
                                    required
                                    dir="rtl"
                                    disabled={loading}
                                    autoFocus
                                />
                                <div 
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getNameIndicatorColor()}`}
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm font-semibold mt-2">{error}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1 mr-1">
                                أدخل اسم صندوق النقد (مطلوب)
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                رصيد الافتتاح
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={balanceOpening}
                                    onChange={handleBalanceOpeningChange}
                                    className="w-full px-4 py-3 bg-white rounded-lg focus:outline-none transition-all duration-300 text-right border-2"
                                    style={{
                                        borderTopColor: 'transparent',
                                        borderBottomColor: 'transparent',
                                        borderLeftColor: 'transparent',
                                        borderRightColor: getBalanceBorderColor(),
                                        borderWidth: '2px',
                                        borderStyle: 'solid',
                                        boxShadow: balanceError ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 
                                                    isBalanceFilled ? '0 0 0 3px rgba(164, 125, 82, 0.1)' : 'none'
                                    }}
                                    placeholder="0.00"
                                    dir="ltr"
                                    disabled={loading}
                                />
                                <div 
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getBalanceIndicatorColor()}`}
                                />
                            </div>
                            {balanceError && (
                                <p className="text-red-500 text-sm font-semibold mt-2">{balanceError}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1 mr-1">
                                أدخل رصيد الافتتاح (اختياري، القيمة الافتراضية 0)
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                الرصيد الحالي
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={balanceOpening ? parseFloat(balanceOpening).toFixed(2) : '0.00'}
                                    className="w-full px-4 py-3 bg-gray-100 rounded-lg text-right border-2 border-gray-200 cursor-not-allowed"
                                    style={{
                                        borderTopColor: 'transparent',
                                        borderBottomColor: 'transparent',
                                        borderLeftColor: 'transparent',
                                        borderRightColor: '#d1d5db',
                                        borderWidth: '2px',
                                        borderStyle: 'solid',
                                        opacity: 0.7
                                    }}
                                    dir="ltr"
                                    disabled
                                />
                                <div 
                                    className="absolute right-0 top-0 h-full w-1 rounded-r-lg bg-gray-300"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 mr-1">
                                يتم تحديث الرصيد تلقائياً بناءً على رصيد الافتتاح
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-3 cursor-pointer bg-[#a47d52] text-white py-3.5 rounded-full font-extrabold transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md hover:shadow-lg"
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
                                    'إضافة صندوق نقد'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1  cursor-pointer bg-gray-200 text-red-600 py-3.5 rounded-full font-extrabold transition-all duration-300 hover:bg-gray-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AddCashBox;