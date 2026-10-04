import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const AddAccount = ({ onClose, accountData, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'revenues',
        category_id: ''
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const nameRef = useRef(null);
    const typeRef = useRef(null);
    const categoryRef = useRef(null);

    // Check if fields are filled
    const isNameFilled = formData.name.trim().length > 0;
    const isTypeFilled = formData.type !== '';
    const isCategoryFilled = formData.category_id !== '';

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

    useEffect(() => {
        // Fetch categories
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('access_token');
                
                if (!token) {
                    toast.error('يرجى تسجيل الدخول');
                    return;
                }

                const response = await fetch(`${BASE}/api/categories/`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }

                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast.error('حدث خطأ أثناء جلب أنواع الحسابات');
            }
        };
        fetchCategories();

        // If editing, populate form
        if (accountData) {
            setFormData({
                name: accountData.name || '',
                type: accountData.type || 'revenues',
                category_id: accountData.category ? accountData.category.toString() : ''
            });
        }

        // Auto focus on name field
        if (nameRef.current) {
            nameRef.current.focus();
        }
    }, [accountData]);

    // Auto-select type based on category
    useEffect(() => {
        if (formData.category_id && categories.length > 0) {
            const selectedCategory = categories.find(cat => cat.id === parseInt(formData.category_id));
            if (selectedCategory) {
                // Check if category name contains 'ايرادات' or 'Revenue'
                const categoryName = selectedCategory.name.toLowerCase();
                if (categoryName.includes('ايرادات') || categoryName.includes('revenue')) {
                    setFormData(prev => ({ ...prev, type: 'revenues' }));
                    setErrors(prev => ({ ...prev, type: '' }));
                } else if (categoryName.includes('مصروفات') || categoryName.includes('expense')) {
                    setFormData(prev => ({ ...prev, type: 'expenses' }));
                    setErrors(prev => ({ ...prev, type: '' }));
                }
            }
        }
    }, [formData.category_id, categories]);

    const handleTypeSelect = (type) => {
        setFormData({ ...formData, type });
        setErrors({ ...errors, type: '' });
    };

    const handleKeyDown = (e, nextRef) => {
        if (e.key === 'Enter' && nextRef && nextRef.current) {
            e.preventDefault();
            nextRef.current.focus();
        }
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
        newErrors.name = 'اسم الحساب مطلوب';
    }
    if (!formData.type) {
        newErrors.type = 'يرجى اختيار نوع الحساب';
    }
    if (!formData.category_id) {
        newErrors.category_id = 'يرجى اختيار نوع الحساب';
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.warning('يرجى تعبئة جميع الحقول المطلوبة');
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

        const url = accountData 
            ? `${BASE}/api/accounts/update/${accountData.id}/`
            : `${BASE}/api/accounts/create/`;
        const method = accountData ? 'PUT' : 'POST';
        
        // SEND 'category_id' INSTEAD OF 'category'
        const requestData = {
            name: formData.name.trim(),
            type: formData.type,
            category_id: parseInt(formData.category_id)  // CHANGE BACK TO category_id
        };
        console.log('Sending data:', requestData);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });

        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Response is not JSON:', responseText);
            toast.error('❌ خطأ في استجابة الخادم');
            setLoading(false);
            return;
        }

        if (!response.ok) {
            console.error('Server errors:', data);
            let errorMessage = 'حدث خطأ أثناء حفظ الحساب';
            if (data && typeof data === 'object') {
                const errors = Object.entries(data)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                    .join('; ');
                errorMessage = errors || errorMessage;
            }
            toast.error(`❌ ${errorMessage}`);
            throw new Error(errorMessage);
        }

        toast.success(accountData ? '✅ تم تحديث الحساب بنجاح' : '✅ تم إضافة الحساب بنجاح');
        onSuccess();
        onClose();
    } catch (error) {
        console.error('Error saving account:', error);
    } finally {
        setLoading(false);
    }
};

    return (
        
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/1 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-[#f8f7f5] z-10">
                    <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                        {accountData ? 'تعديل حساب' : 'إضافة حساب جديد'}
                    </h3>
                    <button 
                        className="text-red-600 cursor-pointer hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
                        onClick={onClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>
                
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Name Field */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                اسم الحساب <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    ref={nameRef}
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({...formData, name: e.target.value});
                                        setErrors({...errors, name: ''});
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, categoryRef)}
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
                                    placeholder="أدخل اسم الحساب"
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
                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                            )}
                        </div>
                        
                        {/* Category Selection - Moved before type buttons */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                نوع الحساب الرئيسي <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    ref={categoryRef}
                                    required
                                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right appearance-none"
                                    style={{
                                        borderTopColor: 'transparent',
                                        borderBottomColor: 'white',
                                        borderLeftColor: 'transparent',
                                        borderRightColor: getFieldBorderColor(isCategoryFilled, errors.category_id),
                                        borderWidth: '2px',
                                        borderStyle: 'solid',
                                        boxShadow: errors.category_id ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 
                                                    isCategoryFilled ? '0 0 0 3px rgba(164, 125, 82, 0.1)' : '0 0 0 3px rgba(239, 68, 68, 0.1)'
                                    }}
                                    value={formData.category_id}
                                    onChange={(e) => {
                                        setFormData({...formData, category_id: e.target.value});
                                        setErrors({...errors, category_id: ''});
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                    dir="rtl"
                                    disabled={loading}
                                >
                                    <option value="">اختر نوع الحساب الرئيسي</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <div 
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isCategoryFilled, errors.category_id)}`}
                                />
                                {/* Custom dropdown arrow */}
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            {errors.category_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
                            )}
                        </div>
                        
                        {/* Type Selection - Two Buttons (Auto-selected based on category) */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                نوع الحساب الفرعي <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                                <button
                                    ref={typeRef}
                                    type="button"
                                    className={`flex-1 py-3 rounded-lg font-bold transition-all duration-300 ${
                                        formData.type === 'revenues'
                                            ? 'bg-green-500 text-white shadow-lg scale-105'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                    onClick={() => handleTypeSelect('revenues')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleTypeSelect('revenues');
                                        }
                                    }}
                                >
                                    إيرادات
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-3 rounded-lg font-bold transition-all duration-300 ${
                                        formData.type === 'expenses'
                                            ? 'bg-red-500 text-white shadow-lg scale-105'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                    onClick={() => handleTypeSelect('expenses')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleTypeSelect('expenses');
                                        }
                                    }}
                                >
                                    مصروفات
                                </button>
                            </div>
                            {errors.type && (
                                <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                            )}
                            {/* Show which category is selected */}
                            {formData.category_id && categories.length > 0 && (
                                <div className="mt-2 text-sm text-gray-600">
                                    <span className="font-semibold">ملاحظة:</span> تم اختيار نوع الحساب تلقائياً بناءً على نوع الحساب الرئيسي
                                </div>
                            )}
                        </div>
                        
                        {/* Buttons */}
                        <div className="flex gap-3 mt-15 border-t border-gray-200 pt-10">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-3 cursor-pointer font-extrabold bg-[#a47d52] text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 disabled:opacity-50"
                            >
                                {loading ? 'جاري الحفظ...' : (accountData ? 'تحديث' : 'إضافة')}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 cursor-pointer font-extrabold bg-gray-300 text-red-600 px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:bg-gray-400"
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

export default AddAccount;