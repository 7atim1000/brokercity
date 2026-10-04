import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const AddDeveloper = ({ developer = null, onClose, onSuccess }) => {
    const isEdit = Boolean(developer?.id);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        type: '',
        email: '',
        registered: true,
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Refs for each input (for Enter-key navigation)
    const nameRef = useRef(null);
    const phoneRef = useRef(null);
    const typeRef = useRef(null);
    const emailRef = useRef(null);
    const registeredRef = useRef(null);

    // Prefill when editing
    useEffect(() => {
        if (isEdit) {
            setFormData({
                name: developer.name || '',
                phone: developer.phone || '',
                type: developer.type || '',
                email: developer.email || '',
                registered:
                    developer.registered !== undefined
                        ? Boolean(developer.registered)
                        : true,
            });
        } else {
            setFormData({
                name: '',
                phone: '',
                type: '',
                email: '',
                registered: true,
            });
        }
    }, [developer, isEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
            if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
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

    // Handle Enter key on the last input to submit
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
        const trimmedPhone = formData.phone.trim();
        const trimmedType = formData.type.trim();
        const trimmedEmail = formData.email.trim();

        // Validation
        if (!trimmedName) {
            newErrors.name = 'اسم المطور مطلوب';
        } else if (trimmedName.length < 2) {
            newErrors.name = 'اسم المطور يجب أن يكون على الأقل حرفين';
        }

        if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            newErrors.email = 'البريد الإلكتروني غير صحيح';
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
                phone: trimmedPhone || '',
                type: trimmedType || '',
                email: trimmedEmail || '',
                registered: Boolean(formData.registered),
            };

            const url = isEdit
                ? `${BASE}/api/developers/${developer.id}/`
                : `${BASE}/api/developers/`;

            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(postData)
            });

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
                    const errorMsg = errorMessages.join(' | ') || (isEdit ? 'فشل تعديل المطور' : 'فشل إضافة المطور');
                    toast.error(errorMsg);
                    setErrors(prev => ({ ...prev, general: errorMsg }));
                } else if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error(isEdit ? 'فشل تعديل المطور' : 'فشل إضافة المطور');
                }
                setLoading(false);
                return;
            }

            toast.success(
                isEdit
                    ? `✅ تم تعديل المطور "${trimmedName}" بنجاح!`
                    : `✅ تم إضافة المطور "${trimmedName}" بنجاح!`
            );
            setLoading(false);

            setFormData({
                name: '',
                phone: '',
                type: '',
                email: '',
                registered: true,
            });
            setErrors({});

            if (onSuccess) {
                onSuccess(data);
            }

            setTimeout(() => {
                if (onClose) onClose();
            }, 1500);

        } catch (err) {
            console.error('Error saving developer:', err);
            toast.error('خطأ في الاتصال بالخادم');
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) onClose();
    };

    // ESC to close
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && !loading) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [loading, onClose]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => document.body.style.overflow = 'unset';
    }, []);

    // Fill states for border coloring
    const isNameFilled = formData.name.trim().length > 0;
    const isPhoneFilled = formData.phone.trim().length > 0;
    const isTypeFilled = formData.type.trim().length > 0;
    const isEmailFilled = formData.email.trim().length > 0;

    // Border color: red if empty/error, gold if filled
    const getFieldBorderColor = (isFilled, hasError) => {
        if (hasError) return '#ef4444';
        if (isFilled) return '#a47d52';
        return '#ef4444';
    };

    const getFieldIndicatorColor = (isFilled, hasError) => {
        if (hasError) return 'bg-red-500';
        if (isFilled) return 'bg-[#a47d52]';
        return 'bg-red-500';
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
                            {isEdit ? 'تعديل مطور' : 'إضافة مطور'}
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
                                    اسم المطور <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        ref={nameRef}
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor: getFieldBorderColor(isNameFilled, errors.name),
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            boxShadow: errors.name
                                                ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
                                                : isNameFilled
                                                    ? '0 0 0 3px rgba(164, 125, 82, 0.1)'
                                                    : '0 0 0 3px rgba(239, 68, 68, 0.1)'
                                        }}
                                        placeholder="مثال: أحمد محمد"
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

                            {/* Phone Field - Optional */}
                            <div className="mb-4">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    رقم الهاتف
                                </label>
                                <div className="relative">
                                    <input
                                        ref={phoneRef}
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, typeRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor: getFieldBorderColor(isPhoneFilled, errors.phone),
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                        }}
                                        placeholder="+971500000000"
                                        dir="ltr"
                                        disabled={loading}
                                    />
                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isPhoneFilled, errors.phone)}`}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-red-500 text-sm font-semibold mt-1">{errors.phone}</p>
                                )}
                            </div>

                            {/* Type Field - Select */}
                            <div className="mb-4">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    النوع
                                </label>
                                <div className="relative">
                                    <select
                                        ref={typeRef}
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, emailRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right appearance-none"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor: getFieldBorderColor(isTypeFilled, errors.type),
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                        }}
                                        disabled={loading}
                                    >
                                        <option value="">اختر النوع</option>
                                        <option value="مطور عقاري - شركة">مطور عقاري - شركة</option>
                                        <option value="مطور عقاري - جهه حكومية">مطور عقاري - جهه حكومية</option>
                                        <option value="مطور عقاري - جهه خاصة">مطور عقاري - جهه خاصة</option>
                                        <option value="تطوير وادارة عقارية - شركة">تطوير وادارة عقارية - شركة</option>
                                        <option value="تطوير وادارة عقارية - جهه حكومية">تطوير وادارة عقارية - جهه حكومية</option>
                                        <option value="تطوير وادارة عقارية - جهه خاصة">تطوير وادارة عقارية - جهه خاصة</option>
                                    </select>
                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 pointer-events-none ${getFieldIndicatorColor(isTypeFilled, errors.type)}`}
                                    />
                                </div>
                                {errors.type && (
                                    <p className="text-red-500 text-sm font-semibold mt-1">{errors.type}</p>
                                )}
                            </div>

                            {/* Email Field - Optional, full width on md+ */}
                            <div className="mb-4 md:col-span-2 lg:col-span-3">
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    البريد الإلكتروني
                                </label>
                                <div className="relative">
                                    <input
                                        ref={emailRef}
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, registeredRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor: getFieldBorderColor(isEmailFilled, errors.email),
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                        }}
                                        placeholder="example@domain.com"
                                        dir="ltr"
                                        disabled={loading}
                                    />
                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isEmailFilled, errors.email)}`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-sm font-semibold mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Registered Checkbox - Default checked in ADD, from DB in EDIT */}
                            <div className="mb-4 md:col-span-2 lg:col-span-3">
                                <label className="flex items-center gap-3 cursor-pointer select-none bg-white rounded-sm shadow-lg px-4 py-3 border border-transparent hover:border-[#a47d52]/40 transition-all duration-300">
                                    <input
                                        ref={registeredRef}
                                        type="checkbox"
                                        name="registered"
                                        checked={Boolean(formData.registered)}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-5 h-5 cursor-pointer accent-[#a47d52]"
                                        style={{
                                            accentColor: '#a47d52',
                                        }}
                                    />
                                    <span className="text-sm font-extrabold text-gray-700">
                                        تم التسجيل
                                    </span>
                                </label>
                                {errors.registered && (
                                    <p className="text-red-500 text-sm font-semibold mt-1">{errors.registered}</p>
                                )}
                            </div>
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
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        {isEdit ? 'جاري التحديث...' : 'جاري الإضافة...'}
                                    </span>
                                ) : (
                                    isEdit ? 'تحديث مطور' : 'إضافة مطور'
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

export default AddDeveloper;

// import React, { useState, useRef, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// const AddDeveloper = ({ developer = null, onClose, onSuccess }) => {
//     const isEdit = Boolean(developer?.id);

//     const [formData, setFormData] = useState({
//         name: '',
//         phone: '',
//         type: '',
//         email: '',
//     });
//     const [loading, setLoading] = useState(false);
//     const [errors, setErrors] = useState({});

//     // Refs for each input (for Enter-key navigation)
//     const nameRef = useRef(null);
//     const phoneRef = useRef(null);
//     const typeRef = useRef(null);
//     const emailRef = useRef(null);

//     // Prefill when editing
//     useEffect(() => {
//         if (isEdit) {
//             setFormData({
//                 name: developer.name || '',
//                 phone: developer.phone || '',
//                 type: developer.type || '',
//                 email: developer.email || '',
//             });
//         } else {
//             setFormData({ name: '', phone: '', type: '', email: '' });
//         }
//     }, [developer, isEdit]);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({ ...prev, [name]: value }));
//         if (errors[name]) {
//             setErrors(prev => ({ ...prev, [name]: '' }));
//         }
//     };

//     // Handle Enter key to move to next input
//     const handleKeyDown = (e, nextRef) => {
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             if (nextRef && nextRef.current) {
//                 nextRef.current.focus();
//             }
//         }
//     };

//     // Handle Enter key on the last input to submit
//     const handleLastInputKeyDown = (e) => {
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             handleSubmit(e);
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         const newErrors = {};
//         const trimmedName = formData.name.trim();
//         const trimmedPhone = formData.phone.trim();
//         const trimmedType = formData.type.trim();
//         const trimmedEmail = formData.email.trim();

//         // Validation
//         if (!trimmedName) {
//             newErrors.name = 'اسم المطور مطلوب';
//         } else if (trimmedName.length < 2) {
//             newErrors.name = 'اسم المطور يجب أن يكون على الأقل حرفين';
//         }

//         if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
//             newErrors.email = 'البريد الإلكتروني غير صحيح';
//         }

//         if (Object.keys(newErrors).length > 0) {
//             setErrors(newErrors);
//             toast.warning('يرجى تصحيح الأخطاء في النموذج');
//             return;
//         }

//         setLoading(true);

//         try {
//             const token = localStorage.getItem('access_token');

//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول أولاً');
//                 setLoading(false);
//                 return;
//             }

//             const postData = {
//                 name: trimmedName,
//                 phone: trimmedPhone || '',
//                 type: trimmedType || '',
//                 email: trimmedEmail || '',
//             };

//             const url = isEdit
//                 ? `${BASE}/api/developers/${developer.id}/`
//                 : `${BASE}/api/developers/`;

//             const method = isEdit ? 'PUT' : 'POST';

//             const response = await fetch(url, {
//                 method,
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": `Bearer ${token}`
//                 },
//                 body: JSON.stringify(postData)
//             });

//             const data = await response.json();

//             if (!response.ok) {
//                 if (response.status === 400) {
//                     const errorMessages = [];
//                     Object.keys(data).forEach(key => {
//                         if (Array.isArray(data[key])) {
//                             errorMessages.push(`${key}: ${data[key].join(', ')}`);
//                         } else {
//                             errorMessages.push(data[key]);
//                         }
//                     });
//                     const errorMsg = errorMessages.join(' | ') || (isEdit ? 'فشل تعديل المطور' : 'فشل إضافة المطور');
//                     toast.error(errorMsg);
//                     setErrors(prev => ({ ...prev, general: errorMsg }));
//                 } else if (response.status === 401) {
//                     toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
//                 } else {
//                     toast.error(isEdit ? 'فشل تعديل المطور' : 'فشل إضافة المطور');
//                 }
//                 setLoading(false);
//                 return;
//             }

//             toast.success(
//                 isEdit
//                     ? `✅ تم تعديل المطور "${trimmedName}" بنجاح!`
//                     : `✅ تم إضافة المطور "${trimmedName}" بنجاح!`
//             );
//             setLoading(false);

//             setFormData({ name: '', phone: '', type: '', email: '' });
//             setErrors({});

//             if (onSuccess) {
//                 onSuccess(data);
//             }

//             setTimeout(() => {
//                 if (onClose) onClose();
//             }, 1500);

//         } catch (err) {
//             console.error('Error saving developer:', err);
//             toast.error('خطأ في الاتصال بالخادم');
//             setLoading(false);
//         }
//     };

//     const handleClose = () => {
//         if (!loading) onClose();
//     };

//     // ESC to close
//     useEffect(() => {
//         const handleEsc = (e) => {
//             if (e.key === 'Escape' && !loading) onClose();
//         };
//         window.addEventListener('keydown', handleEsc);
//         return () => window.removeEventListener('keydown', handleEsc);
//     }, [loading, onClose]);

//     // Lock body scroll
//     useEffect(() => {
//         document.body.style.overflow = 'hidden';
//         return () => document.body.style.overflow = 'unset';
//     }, []);

//     // Fill states for border coloring
//     const isNameFilled = formData.name.trim().length > 0;
//     const isPhoneFilled = formData.phone.trim().length > 0;
//     const isTypeFilled = formData.type.trim().length > 0;
//     const isEmailFilled = formData.email.trim().length > 0;

//     // Border color: red if empty/error, gold if filled
//     const getFieldBorderColor = (isFilled, hasError) => {
//         if (hasError) return '#ef4444';
//         if (isFilled) return '#a47d52';
//         return '#ef4444';
//     };

//     const getFieldIndicatorColor = (isFilled, hasError) => {
//         if (hasError) return 'bg-red-500';
//         if (isFilled) return 'bg-[#a47d52]';
//         return 'bg-red-500';
//     };

//     return (
//         <>
//             {/* Backdrop */}
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/1 backdrop-blur-sm p-4" />

//             {/* Modal */}
//             <div className="fixed inset-0 flex items-center justify-center z-50 p-4 rtl" onClick={handleClose}>
//                 <div
//                     className="bg-[#f8f7f5] rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
//                     onClick={(e) => e.stopPropagation()}
//                     style={{ animation: 'modalFadeIn 0.3s ease-out' }}
//                 >
//                     <style>
//                         {`
//                             @keyframes modalFadeIn {
//                                 from { opacity: 0; transform: scale(0.95) translateY(-20px); }
//                                 to { opacity: 1; transform: scale(1) translateY(0); }
//                             }
//                         `}
//                     </style>

//                     {/* Header */}
//                     <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-[#f8f7f5] z-10">
//                         <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
//                             {isEdit ? 'تعديل مطور' : 'إضافة مطور'}
//                         </h3>
//                         <button
//                             className="text-red-600 cursor-pointer hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
//                             onClick={handleClose}
//                             disabled={loading}
//                         >
//                             ✕
//                         </button>
//                     </div>

//                     {/* Form */}
//                     <form onSubmit={handleSubmit} className="p-6">
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

//                             {/* Name Field - Required */}
//                             <div className="mb-4">
//                                 <label className="block text-sm font-extrabold text-gray-700 mb-2">
//                                     اسم المطور <span className="text-red-500">*</span>
//                                 </label>
//                                 <div className="relative">
//                                     <input
//                                         ref={nameRef}
//                                         type="text"
//                                         name="name"
//                                         value={formData.name}
//                                         onChange={handleChange}
//                                         onKeyDown={(e) => handleKeyDown(e, phoneRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor: getFieldBorderColor(isNameFilled, errors.name),
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                             boxShadow: errors.name
//                                                 ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
//                                                 : isNameFilled
//                                                     ? '0 0 0 3px rgba(164, 125, 82, 0.1)'
//                                                     : '0 0 0 3px rgba(239, 68, 68, 0.1)'
//                                         }}
//                                         placeholder="مثال: أحمد محمد"
//                                         required
//                                         dir="rtl"
//                                         disabled={loading}
//                                         autoFocus
//                                     />
//                                     <div
//                                         className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isNameFilled, errors.name)}`}
//                                     />
//                                 </div>
//                                 {errors.name && (
//                                     <p className="text-red-500 text-sm font-semibold mt-1">{errors.name}</p>
//                                 )}
//                             </div>

//                             {/* Phone Field - Optional */}
//                             <div className="mb-4">
//                                 <label className="block text-sm font-extrabold text-gray-700 mb-2">
//                                     رقم الهاتف
//                                 </label>
//                                 <div className="relative">
//                                     <input
//                                         ref={phoneRef}
//                                         type="text"
//                                         name="phone"
//                                         value={formData.phone}
//                                         onChange={handleChange}
//                                         onKeyDown={(e) => handleKeyDown(e, typeRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor: getFieldBorderColor(isPhoneFilled, errors.phone),
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                         }}
//                                         placeholder="+971500000000"
//                                         dir="ltr"
//                                         disabled={loading}
//                                     />
//                                     <div
//                                         className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isPhoneFilled, errors.phone)}`}
//                                     />
//                                 </div>
//                                 {errors.phone && (
//                                     <p className="text-red-500 text-sm font-semibold mt-1">{errors.phone}</p>
//                                 )}
//                             </div>

//                             {/* Type Field - Select (شركة / جهه حكومية) */}
//                             <div className="mb-4">
//                                 <label className="block text-sm font-extrabold text-gray-700 mb-2">
//                                     النوع
//                                 </label>
//                                 <div className="relative">
//                                     <select
//                                         ref={typeRef}
//                                         name="type"
//                                         value={formData.type}
//                                         onChange={handleChange}
//                                         onKeyDown={(e) => handleKeyDown(e, emailRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right appearance-none"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor: getFieldBorderColor(isTypeFilled, errors.type),
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                         }}
//                                         disabled={loading}
//                                     >
//                                         <option value="">اختر النوع</option>
//                                         <option value="شركة">شركة</option>
//                                         <option value="جهه حكومية">جهه حكومية</option>
//                                     </select>
//                                     <div
//                                         className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 pointer-events-none ${getFieldIndicatorColor(isTypeFilled, errors.type)}`}
//                                     />
//                                 </div>
//                                 {errors.type && (
//                                     <p className="text-red-500 text-sm font-semibold mt-1">{errors.type}</p>
//                                 )}
//                             </div>

//                             {/* Email Field - Optional, full width on md+ */}
//                             <div className="mb-4 md:col-span-2 lg:col-span-3">
//                                 <label className="block text-sm font-extrabold text-gray-700 mb-2">
//                                     البريد الإلكتروني
//                                 </label>
//                                 <div className="relative">
//                                     <input
//                                         ref={emailRef}
//                                         type="email"
//                                         name="email"
//                                         value={formData.email}
//                                         onChange={handleChange}
//                                         onKeyDown={handleLastInputKeyDown}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor: getFieldBorderColor(isEmailFilled, errors.email),
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                         }}
//                                         placeholder="example@domain.com"
//                                         dir="ltr"
//                                         disabled={loading}
//                                     />
//                                     <div
//                                         className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isEmailFilled, errors.email)}`}
//                                     />
//                                 </div>
//                                 {errors.email && (
//                                     <p className="text-red-500 text-sm font-semibold mt-1">{errors.email}</p>
//                                 )}
//                             </div>
//                         </div>

//                         {/* Buttons */}
//                         <div className="flex flex-col sm:flex-row gap-3 mt-6">
//                             <button
//                                 type="submit"
//                                 disabled={loading}
//                                 className="flex-3 bg-[#a47d52] cursor-pointer text-white py-3.5 rounded-lg font-extrabold transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md hover:shadow-lg"
//                             >
//                                 {loading ? (
//                                     <span className="flex items-center justify-center gap-2">
//                                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                                         </svg>
//                                         {isEdit ? 'جاري التحديث...' : 'جاري الإضافة...'}
//                                     </span>
//                                 ) : (
//                                     isEdit ? 'تحديث مطور' : 'إضافة مطور'
//                                 )}
//                             </button>
//                             <button
//                                 type="button"
//                                 onClick={handleClose}
//                                 disabled={loading}
//                                 className="flex-1 bg-gray-200 cursor-pointer text-red-600 py-3.5 rounded-lg font-extrabold transition-all duration-300 hover:bg-gray-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
//                             >
//                                 إلغاء
//                             </button>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         </>
//     );
// };

// export default AddDeveloper;