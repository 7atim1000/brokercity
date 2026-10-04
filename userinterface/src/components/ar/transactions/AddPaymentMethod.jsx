import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const AddPaymentMethod = ({ onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setName(e.target.value);
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('اسم طريقة الدفع مطلوب');
            toast.warning('يرجى إدخال اسم طريقة الدفع');
            return;
        }

        if (trimmedName.length < 2) {
            setError('اسم طريقة الدفع يجب أن يكون على الأقل حرفين');
            toast.warning('اسم طريقة الدفع يجب أن يكون على الأقل حرفين');
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

            const response = await fetch(
                `${BASE}/api/payment-methods/create/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        name: trimmedName,
                        is_active: true
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400) {
                    const errorMsg = data.name ? data.name.join(', ') : 'فشل إضافة طريقة الدفع';
                    toast.error(errorMsg);
                    setError(errorMsg);
                } else if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error('فشل إضافة طريقة الدفع');
                }
                setLoading(false);
                return;
            }

            toast.success(`✅ تم إضافة طريقة الدفع "${trimmedName}" بنجاح!`);
            setLoading(false);
            setName('');
            
            if (onSuccess) onSuccess(data);
            
            setTimeout(() => {
                if (onClose) onClose();
            }, 1500);

        } catch (err) {
            console.error('Error adding payment method:', err);
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

    const isFilled = name.trim().length > 0;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-[#f8f7f] bg-opacity-50 z-40"
                onClick={handleClose}
                style={{ backdropFilter: 'blur(4px)' }}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 rtl" onClick={handleClose}>
                <div 
                    className="bg-[#f8f7f5] rounded-2xl max-w-md w-full shadow-2xl"
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
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                            إضافة طريقة سداد
                        </h3>
                        <button 
                            className="text-gray-400 hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="mb-6">
                            <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                اسم طريقة الدفع <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-white rounded-lg focus:outline-none transition-all duration-300 text-right border-2 ${
                                        error 
                                            ? 'border-red-500' 
                                            : isFilled 
                                                ? 'border-[#f8f7f5]' 
                                                : 'border-gray-300'
                                    }`}
                                    
                                    placeholder="مثال: نقدي، تحويل بنكي"
                                    required
                                    dir="rtl"
                                    disabled={loading}
                                    autoFocus
                                />
                                {/* Right border indicator line */}
                                <div 
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${
                                        error 
                                            ? 'bg-red-500' 
                                            : isFilled 
                                                ? 'bg-[#a47d52]' 
                                                : 'bg-red-500'
                                    }`}
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm font-semibold mt-2">{error}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1 mr-1">
                                أدخل اسم طريقة الدفع (مطلوب)
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-[#a47d52] text-white py-3.5 rounded-full font-extrabold transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md hover:shadow-lg"
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
                                    'إضافة طريقة سداد'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 bg-gray-200 text-gray-700 py-3.5 rounded-full font-extrabold transition-all duration-300 hover:bg-gray-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AddPaymentMethod;