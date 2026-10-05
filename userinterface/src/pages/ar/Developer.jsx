import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdDeleteForever, MdEdit } from 'react-icons/md';
import { FaMagnifyingGlass, FaRotateRight } from 'react-icons/fa6';
import AddDeveloper from '../../components/ar/developer/AddDeveloper';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const Developer = () => {
    const [developers, setDevelopers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingDeveloper, setEditingDeveloper] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // ✅ NEW: search state
    const [searchTerm, setSearchTerm] = useState('');

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

    // ---------- ✅ NEW: Filtered developers by search ----------
    const filteredDevelopers = useMemo(() => {
        const term = (searchTerm || '').trim().toLowerCase();
        if (!term) return developers;

        return developers.filter((dev) => {
            const haystack = [
                dev.name,
                dev.phone,
                dev.email,
                dev.type,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(term);
        });
    }, [developers, searchTerm]);

    const handleResetSearch = () => setSearchTerm('');

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
        <div className="min-h-screen bg-[#f8f7f5] py-8 px-4 sm:py-10 sm:px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
            {/* ================= HEADER ================= */}
            <div className="flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-6 md:mb-8 gap-4">
                <div className="text-center sm:text-right">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                        المطورون
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-1">
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

            {/* ================= SEARCH BAR ================= */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
                <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="w-full relative">
                        <FaMagnifyingGlass className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ابحث بالاسم، الهاتف، البريد، أو النوع..."
                            className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-3">
                        <span className="text-gray-600 text-sm whitespace-nowrap">
                            إجمالي: {filteredDevelopers.length}
                            {searchTerm && ` / ${developers.length}`}
                        </span>

                        {searchTerm && (
                            <button
                                onClick={handleResetSearch}
                                title="إعادة تعيين البحث"
                                className="cursor-pointer flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm hover:bg-gray-50 transition-colors duration-200"
                            >
                                <FaRotateRight />
                                <span className="hidden sm:inline">إعادة تعيين</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ================= EMPTY FILTER RESULT ================= */}
            {filteredDevelopers.length === 0 ? (
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="bg-white rounded-xl shadow-md py-16 px-5 text-center">
                        <FaMagnifyingGlass className="mx-auto text-gray-300" size="42" />
                        <p className="text-gray-500 text-lg mt-4 font-bold">لا توجد نتائج مطابقة</p>
                        <p className="text-gray-400 text-sm mt-1">
                            جرب كلمة بحث أخرى أو أعد تعيين البحث
                        </p>
                        <button
                            onClick={handleResetSearch}
                            className="mt-5 bg-[#a47d52] cursor-pointer text-white px-6 py-2.5 rounded-full font-extrabold text-sm transition-colors hover:bg-[#8a6a44]"
                        >
                            إعادة تعيين البحث
                        </button>
                    </div>
                </div>
            ) : (
                /* ================= CARDS GRID ================= */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 max-w-7xl mx-auto px-4 md:px-6">
                    {filteredDevelopers.map((dev) => {
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
                                        <MdDeleteForever className="text-red-500 text-xl" />
                                    )}
                                </button>

                                {/* EDIT BUTTON */}
                                <button
                                    onClick={() => handleEditDeveloper(dev)}
                                    className="absolute cursor-pointer top-3 right-3 p-2 rounded-full bg-[#f8f7f5] hover:bg-[#f0ebe5] hover:scale-110 active:scale-95 transition-all duration-300 z-10"
                                    title="تعديل المطور"
                                >
                                    <MdEdit className="text-[#a47d52] text-xl" />
                                </button>

                                <div className="p-5 pt-14">
                                    {/*
                                      ✅ UPDATED HEADER ROW:
                                      Small avatar (48px) + name + registered badge
                                      all in one horizontal row.
                                    */}
                                    <div className="flex items-center gap-3 mb-4">
                                        {/* Smaller avatar / logo */}
                                        <div className="w-12 h-12 shrink-0 rounded-full bg-[#f8f7f5] flex items-center justify-center border-2 border-[#a47d52] transition-all duration-300 group-hover:bg-[#a47d52]">
                                            <span className="text-xl transition-colors duration-300 group-hover:scale-110">
                                                👨‍💻
                                            </span>
                                        </div>

                                        {/* Name + Registered badge */}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base sm:text-lg font-extrabold text-gray-800 truncate">
                                                {dev.name || 'بدون اسم'}
                                            </h3>
                                            <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${registeredLabel.className}`}>
                                                {registeredLabel.text}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info rows */}
                                    <div className="w-full space-y-2 mb-4">
                                        <div className="flex justify-between items-center gap-2 border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 font-semibold shrink-0">الهاتف</span>
                                            <span className="text-xs sm:text-sm font-extrabold text-[#a47d52] truncate" dir="ltr">
                                                {dev.phone || '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2 border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 font-semibold shrink-0">النوع</span>
                                            <span className="text-xs sm:text-sm font-bold text-gray-700 truncate">
                                                {dev.type || '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-xs text-gray-500 font-semibold shrink-0">البريد</span>
                                            <span className="text-xs sm:text-sm font-bold text-gray-700 truncate" dir="ltr">
                                                {dev.email || '—'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Edit button */}
                                    <div className="flex flex-col sm:flex-row gap-2 w-full border-t border-gray-300 pt-4">
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
            )}

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