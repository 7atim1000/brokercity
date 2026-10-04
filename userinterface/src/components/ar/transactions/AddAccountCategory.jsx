import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const AddAccountCategory = ({ onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const nameRef = useRef(null);

    // Check if field is filled
    const isNameFilled = name.trim().length > 0;

    // Get border color based on field state
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!name.trim()) {
            setError('يرجى إدخال اسم نوع الحساب');
            toast.warning('⚠️ يرجى إدخال اسم نوع الحساب');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                toast.error('يرجى تسجيل الدخول');
                setLoading(false);
                return;
            }

            const response = await fetch(`${BASE}/api/categories/create/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: name.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add category');
            }

            toast.success('✅ تم إضافة نوع الحساب بنجاح');
            setName('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding category:', error);
            setError('حدث خطأ أثناء إضافة نوع الحساب');
            toast.error('❌ حدث خطأ أثناء إضافة نوع الحساب');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#f8f7f5] bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-[#f8f7f5] z-10">
                    <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                        إضافة نوع حساب جديد
                    </h3>
                    <button 
                        className="text-gray-400 hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
                        onClick={onClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>
                
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                اسم نوع الحساب <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    ref={nameRef}
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setError('');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                    style={{
                                        borderTopColor: 'transparent',
                                        borderBottomColor: 'white',
                                        borderLeftColor: 'transparent',
                                        borderRightColor: getFieldBorderColor(isNameFilled, !!error),
                                        borderWidth: '2px',
                                        borderStyle: 'solid',
                                        boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 
                                                    isNameFilled ? '0 0 0 3px rgba(164, 125, 82, 0.1)' : '0 0 0 3px rgba(239, 68, 68, 0.1)'
                                    }}
                                    placeholder="أدخل اسم نوع الحساب"
                                    required
                                    dir="rtl"
                                    disabled={loading}
                                    autoFocus
                                />
                                <div 
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isNameFilled, !!error)}`}
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm mt-1">{error}</p>
                            )}
                        </div>
                        
                        {/* Buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-[#6c7a89] text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:bg-[#5a6775] hover:scale-105 disabled:opacity-50"
                            >
                                {loading ? 'جاري الإضافة...' : 'إضافة'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:bg-gray-400"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddAccountCategory;