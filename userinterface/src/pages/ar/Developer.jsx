import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdDeleteForever, MdEdit } from 'react-icons/md';
import AddDeveloper from '../../components/ar/developer/AddDeveloper';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const Developer = () => {
    const [developers, setDevelopers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingDeveloper, setEditingDeveloper] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchDevelopers();
    }, []);

    // ---------- FETCH ----------
    const fetchDevelopers = async () => {
        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('يرجى تسجيل الدخول لعرض المطورين');
                setLoading(false);
                return;
            }

            const response = await fetch(
                `${BASE}/api/developers/`,
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
                    toast.error('فشل تحميل المطورين');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched developers data:', JSON.stringify(data, null, 2));

            setDevelopers(data);
            setLoading(false);
        } catch (err) {
            setError('فشل تحميل المطورين');
            setLoading(false);
            console.error('Error fetching developers:', err);
        }
    };

    // ---------- DELETE ----------
    const handleDeleteDeveloper = async (id, name) => {
        if (!window.confirm(`هل أنت متأكد من حذف المطور "${name}"؟`)) {
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
                `${BASE}/api/developers/${id}/`,
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
                    toast.error('المطور غير موجود');
                } else {
                    toast.error('فشل حذف المطور');
                }
                setDeletingId(null);
                return;
            }

            setDevelopers(prev => prev.filter(dev => dev.id !== id));
            toast.success(`✅ تم حذف المطور "${name}" بنجاح!`);
            setDeletingId(null);

        } catch (err) {
            console.error('Error deleting developer:', err);
            toast.error('خطأ في الاتصال بالخادم');
            setDeletingId(null);
        }
    };

    // ---------- EDIT / ADD ----------
    const handleAddDeveloper = () => {
        setEditingDeveloper(null);
        setShowModal(true);
    };

    const handleEditDeveloper = (developer) => {
        setEditingDeveloper(developer);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingDeveloper(null);
        fetchDevelopers();
    };

    // ---------- REGISTERED LABEL ----------
    // Model allows null=True — treat null/undefined as "لم يتم التسجيل"
    const getRegisteredLabel = (dev) => {
        if (dev.Registered === true) {
            return {
                text: 'تم التسجيل',
                className: 'text-green-600 bg-green-50 border border-green-200',
            };
        }
        return {
            text: 'لم يتم التسجيل',
            className: 'text-red-600 bg-red-50 border border-red-200',
        };
    };

    // ---------- LOADING ----------
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-5 rtl">
                <div className="w-12 h-12 border-4 border-[#f0ebe5] border-t-[#a47d52] rounded-full animate-spin"></div>
                <p className="text-[#a47d52] text-lg font-extrabold">جاري تحميل المطورين...</p>
            </div>
        );
    }

    // ---------- ERROR ----------
    if (error) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
                <span className="text-5xl">⚠️</span>
                <p className="text-red-500 text-lg font-extrabold">{error}</p>
                <button
                    className="bg-[#a47d52] text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44]"
                    onClick={fetchDevelopers}
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    // ---------- EMPTY ----------
    if (developers.length === 0) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
                <span className="text-6xl">👨‍💻</span>
                <h3 className="text-2xl font-extrabold text-gray-800">لا يوجد مطورون متاحون</h3>
                <p className="text-gray-600">لا يوجد مطورون مسجلون حالياً.</p>
                <button
                    className="bg-[#a47d52] cursor-pointer text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
                    onClick={handleAddDeveloper}
                >
                    إضافة مطور
                </button>
                {showModal && (
                    <AddDeveloper
                        developer={editingDeveloper}
                        onClose={handleCloseModal}
                        onSuccess={(data) => {
                            console.log('Developer saved:', data);
                            fetchDevelopers();
                        }}
                    />
                )}
            </div>
        );
    }

    // ---------- MAIN ----------
    return (
        <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
            <div className="flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4 lg:shadow-lg">
                <div className="text-center sm:text-right">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                        المطورون
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 mt-1">
                        إدارة مطوري شركة بروكر سيتي
                    </p>
                </div>
                <button
                    className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                    onClick={handleAddDeveloper}
                >
                    + إضافة مطور
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-4 md:px-6">
                {developers.map((dev) => {
                    const registeredLabel = getRegisteredLabel(dev);

                    return (
                        <div
                            key={dev.id}
                            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 relative group"
                        >
                            {/* DELETE BUTTON */}
                            <button
                                onClick={() => handleDeleteDeveloper(dev.id, dev.name)}
                                disabled={deletingId === dev.id}
                                className={`absolute cursor-pointer top-3 left-3 p-2 rounded-full transition-all duration-300 z-10
                                    ${deletingId === dev.id
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-red-50 hover:bg-red-100 hover:scale-110 active:scale-95'
                                    }`}
                                title="حذف المطور"
                            >
                                {deletingId === dev.id ? (
                                    <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <MdDeleteForever className="text-red-500 text-2xl" />
                                )}
                            </button>

                            {/* EDIT BUTTON */}
                            <button
                                onClick={() => handleEditDeveloper(dev)}
                                className="absolute cursor-pointer top-3 right-3 p-2 rounded-full bg-[#f8f7f5] hover:bg-[#f0ebe5] hover:scale-110 active:scale-95 transition-all duration-300 z-10"
                                title="تعديل المطور"
                            >
                                <MdEdit className="text-[#a47d52] text-2xl" />
                            </button>

                            <div className="p-6 md:p-8 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-[#f8f7f5] flex items-center justify-center mb-5 border-b-2 border-[#a47d52] transition-all duration-300 group-hover:bg-[#a47d52] group-hover:border-[#a47d52]">
                                    <span className="text-3xl transition-colors duration-300">👨‍💻</span>
                                </div>

                                <h3 className="text-xl font-extrabold text-gray-800 mb-2">
                                    {dev.name || 'بدون اسم'}
                                </h3>

                                {/* REGISTERED BADGE */}
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold mb-4 ${registeredLabel.className}`}>
                                    {registeredLabel.text}
                                </div>

                                <div className="w-full space-y-2 mb-4">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                        <span className="text-sm text-gray-500 font-semibold">الهاتف</span>
                                        <span className="text-sm font-extrabold text-[#a47d52]">
                                            {dev.phone || '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                        <span className="text-sm text-gray-500 font-semibold">النوع</span>
                                        <span className="text-sm font-bold text-gray-700">
                                            {dev.type || '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500 font-semibold">البريد</span>
                                        <span className="text-sm font-bold text-gray-700 break-all">
                                            {dev.email || '—'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 w-full border-t border-gray-300 pt-5 mt-5">
                                    <button
                                        className="flex-1 cursor-pointer bg-[#a47d52] shadow-lg text-white py-2.5 px-4 rounded-xs font-extrabold text-sm transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
                                        onClick={() => handleEditDeveloper(dev)}
                                    >
                                        تعديل
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <AddDeveloper
                    developer={editingDeveloper}
                    onClose={handleCloseModal}
                    onSuccess={(data) => {
                        console.log('Developer saved:', data);
                        fetchDevelopers();
                    }}
                />
            )}
        </div>
    );
};

export default Developer;


// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { MdDeleteForever, MdEdit } from 'react-icons/md';
// import AddDeveloper from '../../components/ar/developer/AddDeveloper';

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// const Developer = () => {
//     const [developers, setDevelopers] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [showModal, setShowModal] = useState(false);
//     const [editingDeveloper, setEditingDeveloper] = useState(null);
//     const [deletingId, setDeletingId] = useState(null);

//     useEffect(() => {
//         fetchDevelopers();
//     }, []);

//     // ---------- FETCH ----------
//     const fetchDevelopers = async () => {
//         try {
//             const token = localStorage.getItem('access_token');

//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول لعرض المطورين');
//                 setLoading(false);
//                 return;
//             }

//             const response = await fetch(
//                 `${BASE}/api/developers/`,
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
//                     toast.error('فشل تحميل المطورين');
//                 }
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();
//             console.log('Fetched developers data:', JSON.stringify(data, null, 2));

//             setDevelopers(data);
//             setLoading(false);
//         } catch (err) {
//             setError('فشل تحميل المطورين');
//             setLoading(false);
//             console.error('Error fetching developers:', err);
//         }
//     };

//     // ---------- DELETE ----------
//     const handleDeleteDeveloper = async (id, name) => {
//         if (!window.confirm(`هل أنت متأكد من حذف المطور "${name}"؟`)) {
//             return;
//         }

//         setDeletingId(id);

//         try {
//             const token = localStorage.getItem('access_token');

//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول أولاً');
//                 setDeletingId(null);
//                 return;
//             }

//             const response = await fetch(
//                 `${BASE}/api/developers/${id}/`,
//                 {
//                     method: "DELETE",
//                     headers: {
//                         "Content-Type": "application/json",
//                         "Authorization": `Bearer ${token}`
//                     }
//                 }
//             );

//             if (!response.ok) {
//                 if (response.status === 401) {
//                     toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
//                 } else if (response.status === 404) {
//                     toast.error('المطور غير موجود');
//                 } else {
//                     toast.error('فشل حذف المطور');
//                 }
//                 setDeletingId(null);
//                 return;
//             }

//             setDevelopers(prev => prev.filter(dev => dev.id !== id));
//             toast.success(`✅ تم حذف المطور "${name}" بنجاح!`);
//             setDeletingId(null);

//         } catch (err) {
//             console.error('Error deleting developer:', err);
//             toast.error('خطأ في الاتصال بالخادم');
//             setDeletingId(null);
//         }
//     };

//     // ---------- EDIT / ADD ----------
//     const handleAddDeveloper = () => {
//         setEditingDeveloper(null);
//         setShowModal(true);
//     };

//     const handleEditDeveloper = (developer) => {
//         setEditingDeveloper(developer);
//         setShowModal(true);
//     };

//     const handleCloseModal = () => {
//         setShowModal(false);
//         setEditingDeveloper(null);
//         fetchDevelopers();
//     };

//     // ---------- LOADING ----------
//     if (loading) {
//         return (
//             <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-5 rtl">
//                 <div className="w-12 h-12 border-4 border-[#f0ebe5] border-t-[#a47d52] rounded-full animate-spin"></div>
//                 <p className="text-[#a47d52] text-lg font-extrabold">جاري تحميل المطورين...</p>
//             </div>
//         );
//     }

//     // ---------- ERROR ----------
//     if (error) {
//         return (
//             <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
//                 <span className="text-5xl">⚠️</span>
//                 <p className="text-red-500 text-lg font-extrabold">{error}</p>
//                 <button
//                     className="bg-[#a47d52] text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44]"
//                     onClick={fetchDevelopers}
//                 >
//                     إعادة المحاولة
//                 </button>
//             </div>
//         );
//     }

//     // ---------- EMPTY ----------
//     if (developers.length === 0) {
//         return (
//             <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
//                 <span className="text-6xl">👨‍💻</span>
//                 <h3 className="text-2xl font-extrabold text-gray-800">لا يوجد مطورون متاحون</h3>
//                 <p className="text-gray-600">لا يوجد مطورون مسجلون حالياً.</p>
//                 <button
//                     className="bg-[#a47d52] cursor-pointer text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
//                     onClick={handleAddDeveloper}
//                 >
//                     إضافة مطور
//                 </button>
//                 {showModal && (
//                     <AddDeveloper
//                         developer={editingDeveloper}
//                         onClose={handleCloseModal}
//                         onSuccess={(data) => {
//                             console.log('Developer saved:', data);
//                             fetchDevelopers();
//                         }}
//                     />
//                 )}
//             </div>
//         );
//     }

//     // ---------- MAIN ----------
//     return (
//         <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
//             <div className="flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4 lg:shadow-lg">
//                 <div className="text-center sm:text-right">
//                     <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
//                         المطورون
//                     </h2>
//                     <p className="text-base md:text-lg text-gray-600 mt-1">
//                         إدارة مطوري شركة بروكر سيتي
//                     </p>
//                 </div>
//                 <button
//                     className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
//                     onClick={handleAddDeveloper}
//                 >
//                     + إضافة مطور
//                 </button>
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-4 md:px-6">
//                 {developers.map((dev) => (
//                     <div
//                         key={dev.id}
//                         className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 relative group"
//                     >
//                         {/* DELETE BUTTON */}
//                         <button
//                             onClick={() => handleDeleteDeveloper(dev.id, dev.name)}
//                             disabled={deletingId === dev.id}
//                             className={`absolute cursor-pointer top-3 left-3 p-2 rounded-full transition-all duration-300 z-10
//                                 ${deletingId === dev.id
//                                     ? 'bg-gray-300 cursor-not-allowed'
//                                     : 'bg-red-50 hover:bg-red-100 hover:scale-110 active:scale-95'
//                                 }`}
//                             title="حذف المطور"
//                         >
//                             {deletingId === dev.id ? (
//                                 <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                                 </svg>
//                             ) : (
//                                 <MdDeleteForever className="text-red-500 text-2xl" />
//                             )}
//                         </button>

//                         {/* EDIT BUTTON */}
//                         <button
//                             onClick={() => handleEditDeveloper(dev)}
//                             className="absolute cursor-pointer top-3 right-3 p-2 rounded-full bg-[#f8f7f5] hover:bg-[#f0ebe5] hover:scale-110 active:scale-95 transition-all duration-300 z-10"
//                             title="تعديل المطور"
//                         >
//                             <MdEdit className="text-[#a47d52] text-2xl" />
//                         </button>

//                         <div className="p-6 md:p-8 flex flex-col items-center text-center">
//                             <div className="w-20 h-20 rounded-full bg-[#f8f7f5] flex items-center justify-center mb-5 border-b-2 border-[#a47d52] transition-all duration-300 group-hover:bg-[#a47d52] group-hover:border-[#a47d52]">
//                                 <span className="text-3xl transition-colors duration-300">👨‍💻</span>
//                             </div>

//                             <h3 className="text-xl font-extrabold text-gray-800 mb-2">
//                                 {dev.name || 'بدون اسم'}
//                             </h3>

//                             <div className="w-full space-y-2 mb-4">
//                                 <div className="flex justify-between items-center border-b border-gray-100 pb-2">
//                                     <span className="text-sm text-gray-500 font-semibold">الهاتف</span>
//                                     <span className="text-sm font-extrabold text-[#a47d52]">
//                                         {dev.phone || '—'}
//                                     </span>
//                                 </div>
//                                 <div className="flex justify-between items-center border-b border-gray-100 pb-2">
//                                     <span className="text-sm text-gray-500 font-semibold">النوع</span>
//                                     <span className="text-sm font-bold text-gray-700">
//                                         {dev.type || '—'}
//                                     </span>
//                                 </div>
//                                 <div className="flex justify-between items-center">
//                                     <span className="text-sm text-gray-500 font-semibold">البريد</span>
//                                     <span className="text-sm font-bold text-gray-700 break-all">
//                                         {dev.email || '—'}
//                                     </span>
//                                 </div>
//                             </div>

//                             <div className="flex flex-col sm:flex-row gap-2 w-full border-t border-gray-300 pt-5 mt-5">
//                                 <button
//                                     className="flex-1 cursor-pointer bg-[#a47d52] shadow-lg text-white py-2.5 px-4 rounded-xs font-extrabold text-sm transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
//                                     onClick={() => handleEditDeveloper(dev)}
//                                 >
//                                     تعديل
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             {showModal && (
//                 <AddDeveloper
//                     developer={editingDeveloper}
//                     onClose={handleCloseModal}
//                     onSuccess={(data) => {
//                         console.log('Developer saved:', data);
//                         fetchDevelopers();
//                     }}
//                 />
//             )}
//         </div>
//     );
// };

// export default Developer;