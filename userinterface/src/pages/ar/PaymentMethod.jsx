import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdDeleteForever } from "react-icons/md";
import AddPaymentMethod from '../../components/ar/transactions/AddPaymentMethod';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const PaymentMethod = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                toast.error('يرجى تسجيل الدخول لعرض طرق الدفع');
                setLoading(false);
                return;
            }

            const response = await fetch(
                `${BASE}/api/payment-methods/all/`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error('فشل تحميل طرق الدفع');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setPaymentMethods(data);
            setLoading(false);
        } catch (err) {
            setError('فشل تحميل طرق الدفع');
            setLoading(false);
            console.error('Error fetching payment methods:', err);
        }
    };

    const handleDeletePaymentMethod = async (id, name) => {
        // Show confirmation dialog
        if (!window.confirm(`هل أنت متأكد من حذف طريقة الدفع "${name}"؟`)) {
            return;
        }

        setDeletingId(id);
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                toast.error('يرجى تسجيل الدخول أولاً');
                setDeletingId(null);
                return;
            }

            const response = await fetch(
                `${BASE}/api/payment-methods/${id}/delete/`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else if (response.status === 404) {
                    toast.error('طريقة الدفع غير موجودة');
                } else {
                    toast.error('فشل حذف طريقة الدفع');
                }
                setDeletingId(null);
                return;
            }

            // Remove from list
            setPaymentMethods(prev => prev.filter(method => method.id !== id));
            toast.success(`✅ تم حذف طريقة الدفع "${name}" بنجاح!`);
            setDeletingId(null);

        } catch (err) {
            console.error('Error deleting payment method:', err);
            toast.error('خطأ في الاتصال بالخادم');
            setDeletingId(null);
        }
    };

    const handleAddPaymentMethod = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        fetchPaymentMethods();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-5 rtl">
                <div className="w-12 h-12 border-4 border-[#f0ebe5] border-t-[#a47d52] rounded-full animate-spin"></div>
                <p className="text-[#a47d52] text-lg font-extrabold">جاري تحميل طرق الدفع...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
                <span className="text-5xl">⚠️</span>
                <p className="text-red-500 text-lg font-extrabold">{error}</p>
                <button 
                    className="bg-[#a47d52] text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44]"
                    onClick={fetchPaymentMethods}
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    if (paymentMethods.length === 0) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
                <span className="text-6xl">💳</span>
                <h3 className="text-2xl font-extrabold text-gray-800">لا توجد طرق دفع متاحة</h3>
                <p className="text-gray-600">لا توجد طرق دفع مكونة حالياً.</p>
                <button 
                    className="bg-[#a47d52] cursor-pointer text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
                    onClick={handleAddPaymentMethod}
                >
                    إضافة طريقة سداد
                </button>
                {showModal && (
                    <AddPaymentMethod 
                        onClose={handleCloseModal}
                        onSuccess={fetchPaymentMethods}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4 lg:shadow-lg">
                <div className="text-center sm:text-right">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                        طرق الدفع
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 mt-1">
                        اختر طريقة الدفع المفضلة لديك
                    </p>
                </div>
                <button 
                    className="bg-[#a47d52] text-white px-6 md:px-8 py-3 rounded-full font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                    onClick={handleAddPaymentMethod}
                >
                    + إضافة طريقة سداد
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-4 md:px-6">
                {paymentMethods.map((method) => (
                    <div 
                        key={method.id} 
                        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 relative group"
                    >
                        {/* Delete Button */}
                        <button
                            onClick={() => handleDeletePaymentMethod(method.id, method.name)}
                            disabled={deletingId === method.id}
                            className={`absolute top-3 left-3 p-2 rounded-full transition-all duration-300 z-10
                                ${deletingId === method.id 
                                    ? 'bg-gray-300 cursor-not-allowed' 
                                    : 'bg-red-50 hover:bg-red-100 hover:scale-110 active:scale-95'
                                }`}
                            title="حذف طريقة الدفع"
                        >
                            {deletingId === method.id ? (
                                <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                            ) : (
                                <MdDeleteForever className="text-red-500 text-2xl cursor-pointer" />
                            )}
                        </button>

                        <div className="p-6 md:p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-[#f8f7f5] flex items-center justify-center mb-5 border-2 border-[#a47d52] transition-all duration-300 group-hover:bg-[#a47d52] group-hover:border-[#a47d52]">
                                <span className="text-3xl transition-colors duration-300">
                                    {method.icon || '💳'}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-extrabold text-gray-800 mb-2">
                                {method.name}
                            </h3>
                            
                            
                            
                            <button 
                                className={`w-full max-w-[250px] py-3.5 px-6 rounded-full font-extrabold uppercase tracking-wide transition-all duration-300 ${
                                    method.is_active 
                                        ? 'bg-[#a47d52] text-white hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95' 
                                        : 'bg-[#a47d52] text-white cursor-not-allowed opacity-70'
                                }`}
                                onClick={() => handleSelectMethod(method.id, method.name)}
                                disabled={!method.is_active}
                            >
                                {method.is_active ? 'اختيار طريقة الدفع' : 'متاح'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <AddPaymentMethod 
                    onClose={handleCloseModal}
                    onSuccess={fetchPaymentMethods}
                />
            )}
        </div>
    );
};

export default PaymentMethod;




// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import AddPaymentMethod from '../../components/ar/transactions/AddPaymentMethod';

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// const PaymentMethod = () => {
//     const [paymentMethods, setPaymentMethods] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [showModal, setShowModal] = useState(false);

//     useEffect(() => {
//         fetchPaymentMethods();
//     }, []);

//     const fetchPaymentMethods = async () => {
//         try {
//             const token = localStorage.getItem('access_token');
            
//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول لعرض طرق الدفع');
//                 setLoading(false);
//                 return;
//             }

//             const response = await fetch(
//                 `${BASE}/api/payment-methods/all/`,
//                 {
//                     method: "GET",
//                     headers: {
//                         "Content-Type": "application/json",
//                         "Authorization": `Bearer ${token}`
//                     }
//                 }
//             );

//             if (!response.ok) {
//                 if (response.status === 401) {
//                     toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
//                 } else {
//                     toast.error('فشل تحميل طرق الدفع');
//                 }
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();
//             setPaymentMethods(data);
//             //toast.success('تم تحميل طرق الدفع بنجاح');
//             setLoading(false);
//         } catch (err) {
//             setError('فشل تحميل طرق الدفع');
//             setLoading(false);
//             console.error('Error fetching payment methods:', err);
//         }
//     };

   
//     const handleAddPaymentMethod = () => {
//         setShowModal(true);
//     };

//     const handleCloseModal = () => {
//         setShowModal(false);
//         // Refresh the list after adding a new payment method
//         fetchPaymentMethods();
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-5 rtl">
//                 <div className="w-12 h-12 border-4 border-[#f0ebe5] border-t-[#a47d52] rounded-full animate-spin"></div>
//                 <p className="text-[#a47d52] text-lg font-extrabold">جاري تحميل طرق الدفع...</p>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
//                 <span className="text-5xl">⚠️</span>
//                 <p className="text-red-500 text-lg font-extrabold">{error}</p>
//                 <button 
//                     className="bg-[#a47d52] text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44]"
//                     onClick={fetchPaymentMethods}
//                 >
//                     إعادة المحاولة
//                 </button>
//             </div>
//         );
//     }

//     if (paymentMethods.length === 0) {
//         return (
//             <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
//                 <span className="text-6xl">💳</span>
//                 <h3 className="text-2xl font-extrabold text-gray-800">لا توجد طرق دفع متاحة</h3>
//                 <p className="text-gray-600">لا توجد طرق دفع مكونة حالياً.</p>
//                 <button 
//                     className="bg-[#a47d52] cursor-pointer text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
//                     onClick={handleAddPaymentMethod}
//                 >
//                     إضافة طريقة سداد
//                 </button>
//                 {showModal && (
//                     <AddPaymentMethod 
//                         onClose={handleCloseModal}
//                         onSuccess={fetchPaymentMethods}
//                     />
//                 )}
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
//             {/* Header with Add Button */}
//             <div className="flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4 lg:shadow-lg">
//                 <div className="text-center sm:text-right">
//                     <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
//                         طرق الدفع
//                     </h2>
//                     <p className="text-base md:text-lg text-gray-600 mt-1">
//                         اختر طريقة الدفع المفضلة لديك
//                     </p>
//                 </div>
//                 <button 
//                     className="bg-[#a47d52] text-white px-6 md:px-8 py-3 rounded-full font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
//                     onClick={handleAddPaymentMethod}
//                 >
//                     + إضافة طريقة سداد
//                 </button>
//             </div>
            
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-4 md:px-6">
//                 {paymentMethods.map((method) => (
//                     <div 
//                         key={method.id} 
//                         className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1"
//                     >
//                         <div className="p-6 md:p-8 flex flex-col items-center text-center">
//                             <div className="w-20 h-20 rounded-full bg-[#f8f7f5] flex items-center justify-center mb-5 border-2 border-[#a47d52] transition-all duration-300 group-hover:bg-[#a47d52] group-hover:border-[#a47d52]">
//                                 <span className="text-3xl transition-colors duration-300">
//                                     {method.icon || '💳'}
//                                 </span>
//                             </div>
                            
//                             <h3 className="text-xl font-extrabold text-gray-800 mb-2">
//                                 {method.name}
//                             </h3>
                            
                            
                            
//                             <div className="mb-4 w-full">
//                                 <span 
//                                     className={`inline-block px-4 py-1.5 rounded-full text-xs font-extrabold text-white tracking-wide ${
//                                         method.is_active ? 'bg-[#a47d52] text-green-600' : 'bg-gray-300 text-green-600'
//                                     }`}
//                                 >
//                                     {method.is_active ? '✓ نشط' : '✓ نشط'}
//                                 </span>
//                             </div>
                            
//                             <button 
//                                 className={`w-full max-w-[250px] py-3.5 px-6 rounded-full font-extrabold uppercase tracking-wide transition-all duration-300 ${
//                                     method.is_active 
//                                         ? 'bg-green-600 text-white hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95' 
//                                         : 'bg-green-600 text-white cursor-not-allowed opacity-70'
//                                 }`}
//                                 onClick={() => handleSelectMethod(method.id, method.name)}
//                                 disabled={!method.is_active}
//                             >
//                                 {method.is_active ? 'اختيار طريقة الدفع' : 'متاح'}
//                             </button>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             {/* Modal */}
//             {showModal && (
//                 <AddPaymentMethod 
//                     onClose={handleCloseModal}
//                     onSuccess={fetchPaymentMethods}
//                 />
//             )}
//         </div>
//     );
// };

// export default PaymentMethod;