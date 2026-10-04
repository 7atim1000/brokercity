import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdDeleteForever, MdEdit } from 'react-icons/md';
import AddSlider from '../../components/ar/website/AddSlider';
import EditSlider from '../../components/ar/website/EditSlider';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const Slider = () => {
    const [sliders, setSliders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSlider, setSelectedSlider] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchSliders();
    }, []);

    const fetchSliders = async () => {
        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('يرجى تسجيل الدخول لعرض السلايدرات');
                setLoading(false);
                return;
            }

            const response = await fetch(`${BASE}/api/sliders/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error('فشل تحميل السلايدرات');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setSliders(data);
            setLoading(false);
        } catch (err) {
            setError('فشل تحميل السلايدرات');
            setLoading(false);
            console.error('Error fetching sliders:', err);
        }
    };

    const handleDeleteSlider = async (id, description) => {
        if (!window.confirm(`هل أنت متأكد من حذف السلايدر "${description}"؟`)) {
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

            const response = await fetch(`${BASE}/api/sliders/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else if (response.status === 404) {
                    toast.error('السلايدر غير موجود');
                } else {
                    toast.error('فشل حذف السلايدر');
                }
                setDeletingId(null);
                return;
            }

            setSliders((prev) => prev.filter((s) => s.id !== id));
            toast.success(`✅ تم حذف السلايدر "${description}" بنجاح!`);
            setDeletingId(null);
        } catch (err) {
            console.error('Error deleting slider:', err);
            toast.error('خطأ في الاتصال بالخادم');
            setDeletingId(null);
        }
    };

    const handleEditSlider = (slider) => {
        setSelectedSlider(slider);
        setShowEditModal(true);
    };

    const handleAddSlider = () => {
        setShowAddModal(true);
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        fetchSliders();
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedSlider(null);
        fetchSliders();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-5 rtl">
                <div className="w-12 h-12 border-4 border-[#f0ebe5] border-t-[#a47d52] rounded-full animate-spin"></div>
                <p className="text-[#a47d52] text-lg font-extrabold">جاري تحميل السلايدرات...</p>
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
                    onClick={fetchSliders}
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    if (sliders.length === 0) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
                <span className="text-6xl">🖼️</span>
                <h3 className="text-2xl font-extrabold text-gray-800">لا توجد سلايدرات متاحة</h3>
                <p className="text-gray-600">لا توجد سلايدرات مكونة حالياً.</p>
                <button
                    className="bg-[#a47d52] cursor-pointer text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
                    onClick={handleAddSlider}
                >
                    إضافة سلايدر
                </button>
                {showAddModal && (
                    <AddSlider
                        onClose={handleCloseAddModal}
                        onSuccess={() => fetchSliders()}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4 lg:shadow-lg">
                <div className="text-center sm:text-right">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                        السلايدرات
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 mt-1">
                        إدارة سلايدرات الموقع الخاصة بشركة بروكر سيتي
                    </p>
                </div>
                <button
                    className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                    onClick={handleAddSlider}
                >
                    + إضافة سلايدر
                </button>
            </div>

            {/* Grid of slider cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-4 md:px-6">
                {sliders.map((slider) => (
                    <div
                        key={slider.id}
                        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 relative group"
                    >
                        {/* Delete button (top-left) */}
                        <button
                            onClick={() => handleDeleteSlider(slider.id, slider.description)}
                            disabled={deletingId === slider.id}
                            className={`absolute cursor-pointer top-3 left-3 p-2 rounded-full transition-all duration-300 z-10
                                ${deletingId === slider.id
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-red-50 hover:bg-red-100 hover:scale-110 active:scale-95'
                                }`}
                            title="حذف السلايدر"
                        >
                            {deletingId === slider.id ? (
                                <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <MdDeleteForever className="text-red-500 text-2xl" />
                            )}
                        </button>

                        {/* Edit button (top-right) */}
                        <button
                            onClick={() => handleEditSlider(slider)}
                            className="absolute cursor-pointer top-3 right-3 p-2 rounded-full bg-[#f8f7f5] hover:bg-[#e6cba8] hover:scale-110 active:scale-95 transition-all duration-300 z-10"
                            title="تعديل السلايدر"
                        >
                            <MdEdit className="text-[#a47d52] text-xl" />
                        </button>

                        <div className="p-6 md:p-8 flex flex-col items-center text-center">
                            {/* Image preview */}
                            <div className="w-full aspect-video rounded-xl bg-[#f8f7f5] flex items-center justify-center mb-5 border-b-2 border-[#a47d52] overflow-hidden transition-all duration-300 group-hover:border-[#8a6a44]">
                                {slider.image ? (
                                    <img
                                        src={slider.image}
                                        alt={slider.description}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl">🖼️</span>
                                )}
                            </div>

                            <h3 className="text-lg font-extrabold text-gray-800 mb-4 line-clamp-2">
                                {slider.name}
                            </h3>

                            <div className="w-full border-t border-gray-300 pt-5 mt-auto">
                                <button
                                    onClick={() => handleEditSlider(slider)}
                                    className="w-full cursor-pointer bg-[#a47d52] shadow-lg text-white py-2.5 px-4 rounded-xs font-extrabold text-sm transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
                                >
                                    تعديل السلايدر
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <AddSlider
                    onClose={handleCloseAddModal}
                    onSuccess={() => fetchSliders()}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && selectedSlider && (
                <EditSlider
                    slider={selectedSlider}
                    onClose={handleCloseEditModal}
                    onSuccess={() => fetchSliders()}
                />
            )}
        </div>
    );
};

export default Slider;