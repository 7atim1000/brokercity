import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdDeleteForever, MdEdit, MdVisibility } from 'react-icons/md';
import AddOfferSale from '../../components/ar/offersale/AddOfferSale';
import DetailOfferSale from '../../components/ar/offersale/DetailOfferSale';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const OfferSale = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [viewingOffer, setViewingOffer] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchOffers();
    }, []);

    // ---------- FETCH ----------
    const fetchOffers = async () => {
        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('يرجى تسجيل الدخول لعرض العروض');
                setLoading(false);
                return;
            }

            const response = await fetch(`${BASE}/api/offersales/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error('فشل تحميل العروض');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setOffers(data);
            setLoading(false);
        } catch (err) {
            setError('فشل تحميل العروض');
            setLoading(false);
            console.error('Error fetching offers:', err);
        }
    };

    // ---------- DELETE ----------
    const handleDeleteOffer = async (id, reference) => {
        if (!window.confirm(`هل أنت متأكد من حذف العرض "${reference}"؟`)) return;

        setDeletingId(id);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('يرجى تسجيل الدخول أولاً');
                setDeletingId(null);
                return;
            }

            const response = await fetch(`${BASE}/api/offersales/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else if (response.status === 404) {
                    toast.error('العرض غير موجود');
                } else {
                    toast.error('فشل حذف العرض');
                }
                setDeletingId(null);
                return;
            }

            setOffers((prev) => prev.filter((o) => o.id !== id));
            toast.success(`✅ تم حذف العرض "${reference}" بنجاح!`);
            setDeletingId(null);
        } catch (err) {
            console.error('Error deleting offer:', err);
            toast.error('خطأ في الاتصال بالخادم');
            setDeletingId(null);
        }
    };

    // ---------- ADD / EDIT ----------
    const handleAddOffer = () => {
        setEditingOffer(null);
        setShowModal(true);
    };

    const handleEditOffer = (offer) => {
        setEditingOffer(offer);
        setShowModal(true);
    };

    const handleViewOffer = (offer) => {
        setViewingOffer(offer);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOffer(null);
        fetchOffers();
    };

    const handleCloseDetail = () => {
        setViewingOffer(null);
    };

    // ---------- LOADING ----------
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-5 rtl">
                <div className="w-12 h-12 border-4 border-[#f0ebe5] border-t-[#a47d52] rounded-full animate-spin"></div>
                <p className="text-[#a47d52] text-lg font-extrabold">
                    جاري تحميل العروض...
                </p>
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
                    onClick={fetchOffers}
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    // ---------- EMPTY ----------
    if (offers.length === 0) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
                <span className="text-6xl">📄</span>
                <h3 className="text-2xl font-extrabold text-gray-800">
                    لا توجد عروض متاحة
                </h3>
                <p className="text-gray-600">لا توجد عروض مسجلة حالياً.</p>
                <button
                    className="bg-[#a47d52] cursor-pointer text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
                    onClick={handleAddOffer}
                >
                    إضافة عرض
                </button>

                {showModal && (
                    <AddOfferSale
                        offer={editingOffer}
                        onClose={handleCloseModal}
                        onSuccess={() => fetchOffers()}
                    />
                )}
            </div>
        );
    }

    // ---------- MAIN ----------
    return (
        <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4 lg:shadow-lg">
                <div className="text-center sm:text-right">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                        عروض البيع
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 mt-1">
                        إدارة عروض بيع الوحدات
                    </p>
                </div>
                <button
                    className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                    onClick={handleAddOffer}
                >
                    + إضافة عرض
                </button>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-4 md:px-6">
                {offers.map((offer) => (
                    <div
                        key={offer.id}
                        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 relative group"
                    >
                        {/* DELETE BUTTON */}
                        <button
                            onClick={() =>
                                handleDeleteOffer(
                                    offer.id,
                                    offer.reference_no || `#${offer.id}`
                                )
                            }
                            disabled={deletingId === offer.id}
                            className={`absolute cursor-pointer top-3 left-3 p-2 rounded-full transition-all duration-300 z-10 ${
                                deletingId === offer.id
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-red-50 hover:bg-red-100 hover:scale-110 active:scale-95'
                            }`}
                            title="حذف العرض"
                        >
                            {deletingId === offer.id ? (
                                <svg
                                    className="animate-spin h-5 w-5 text-red-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            ) : (
                                <MdDeleteForever className="text-red-500 text-2xl" />
                            )}
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                            onClick={() => handleEditOffer(offer)}
                            className="absolute cursor-pointer top-3 right-3 p-2 rounded-full bg-[#f8f7f5] hover:bg-[#f0ebe5] hover:scale-110 active:scale-95 transition-all duration-300 z-10"
                            title="تعديل العرض"
                        >
                            <MdEdit className="text-[#a47d52] text-2xl" />
                        </button>

                        <div className="p-6 md:p-8 flex flex-col items-center text-center">
                            {/* IMAGE */}
                            <div className="w-full h-32 rounded-xl bg-[#f8f7f5] flex items-center justify-center mb-5 overflow-hidden border-b-2 border-[#a47d52] transition-all duration-300 group-hover:border-[#a47d52]">
                                {offer.image_display ? (
                                    <img
                                        src={offer.image_display}
                                        alt={offer.reference_no || 'Offer'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl">🏢</span>
                                )}
                            </div>

                            <h3 className="text-xl font-extrabold text-gray-800 mb-1 break-all">
                                {offer.listing_title ||
                                    offer.reference_no ||
                                    'بدون عنوان'}
                            </h3>
                            <p className="text-sm text-[#a47d52] font-bold mb-4">
                                {offer.project || '—'}
                            </p>

                            <div className="w-full space-y-2 mb-4">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 font-semibold">
                                        رقم الوحدة
                                    </span>
                                    <span className="text-sm font-extrabold text-[#a47d52]">
                                        {offer.unit_no || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 font-semibold">
                                        النوع
                                    </span>
                                    <span className="text-sm font-bold text-gray-700">
                                        {offer.unit_type || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 font-semibold">
                                        السعر
                                    </span>
                                    <span className="text-sm font-bold text-gray-700">
                                        {offer.selling_price
                                            ? `${Number(
                                                  offer.selling_price
                                              ).toLocaleString()} ${
                                                  offer.currency || 'AED'
                                              }`
                                            : '—'}
                                    </span>
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex flex-col sm:flex-row gap-2 w-full border-t border-gray-300 pt-5 mt-3">
                                <button
                                    className="flex-1 cursor-pointer bg-[#a47d52] shadow-lg text-white py-2.5 px-4 rounded-xs font-extrabold text-sm transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                    onClick={() => handleViewOffer(offer)}
                                >
                                    <MdVisibility className="text-lg" />
                                    تفاصيل
                                </button>
                                <button
                                    className="flex-1 cursor-pointer bg-white border-2 border-[#a47d52] text-[#a47d52] py-2.5 px-4 rounded-xs font-extrabold text-sm transition-all duration-300 hover:bg-[#f8f7f5] hover:scale-105 active:scale-95"
                                    onClick={() => handleEditOffer(offer)}
                                >
                                    تعديل
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODALS */}
            {showModal && (
                <AddOfferSale
                    offer={editingOffer}
                    onClose={handleCloseModal}
                    onSuccess={() => fetchOffers()}
                />
            )}

            {viewingOffer && (
                <DetailOfferSale
                    offer={viewingOffer}
                    onClose={handleCloseDetail}
                />
            )}
        </div>
    );
};

export default OfferSale;