import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdDeleteForever } from 'react-icons/md';
import AddBank from '../../components/ar/transactions/AddBank';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const Bank = () => {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchBanks();
    }, []);

    const fetchBanks = async () => {
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                toast.error('يرجى تسجيل الدخول لعرض البنوك');
                setLoading(false);
                return;
            }

            const response = await fetch(
                `${BASE}/api/banks/`,
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
                    toast.error('فشل تحميل البنوك');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched banks data:', data);
            
            // Check if data is paginated (has results array) or direct array
            let banksData = [];
            if (data && Array.isArray(data)) {
                banksData = data;
            } else if (data && data.results && Array.isArray(data.results)) {
                banksData = data.results;
            } else {
                banksData = [];
            }
            
            // Ensure each bank has proper values
            const formattedData = banksData.map(bank => ({
                ...bank,
                balance: parseFloat(bank.balance) || 0,
                balance_opening: parseFloat(bank.balance_opening) || 0
            }));
            
            console.log('Formatted banks:', formattedData);
            setBanks(formattedData);
            setLoading(false);
        } catch (err) {
            setError('فشل تحميل البنوك');
            setLoading(false);
            console.error('Error fetching banks:', err);
        }
    };

    const handleDeleteBank = async (id, name) => {
        if (!window.confirm(`هل أنت متأكد من حذف البنك "${name}"؟`)) {
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
                `${BASE}/api/banks/${id}/delete/`,
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
                    toast.error('البنك غير موجود');
                } else {
                    toast.error('فشل حذف البنك');
                }
                setDeletingId(null);
                return;
            }

            setBanks(prev => prev.filter(bank => bank.id !== id));
            toast.success(`✅ تم حذف البنك "${name}" بنجاح!`);
            setDeletingId(null);

        } catch (err) {
            console.error('Error deleting bank:', err);
            toast.error('خطأ في الاتصال بالخادم');
            setDeletingId(null);
        }
    };

    const handleAddBank = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        fetchBanks();
    };

    const handleSelectBank = (id) => {
        console.log('View bank:', id);
        toast.info('جاري تحميل تفاصيل البنك...');
    };

    const handleDeposit = (id) => {
        console.log('Deposit to bank:', id);
        toast.info('جاري فتح نموذج الإيداع...');
    };

    const handleWithdraw = (id) => {
        console.log('Withdraw from bank:', id);
        toast.info('جاري فتح نموذج السحب...');
    };

    const formatCurrency = (amount, currency = 'AED') => {
        const numAmount = parseFloat(amount);
        const safeAmount = isNaN(numAmount) ? 0 : numAmount;
        
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: currency || 'AED',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(safeAmount);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-5 rtl">
                <div className="w-12 h-12 border-4 border-[#f0ebe5] border-t-[#a47d52] rounded-full animate-spin"></div>
                <p className="text-[#a47d52] text-lg font-extrabold">جاري تحميل البنوك...</p>
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
                    onClick={fetchBanks}
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    if (banks.length === 0) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
                <span className="text-6xl">🏦</span>
                <h3 className="text-2xl font-extrabold text-gray-800">لا توجد بنوك متاحة</h3>
                <p className="text-gray-600">لا توجد بنوك مكونة حالياً.</p>
                <button 
                    className="bg-[#a47d52] cursor-pointer text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
                    onClick={handleAddBank}
                >
                    إضافة بنك
                </button>
                {showModal && (
                    <AddBank 
                        onClose={handleCloseModal}
                        onSuccess={fetchBanks}
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
                        البنوك
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 mt-1">
                          اداره البنوك الخاصة بشركة بروكر سيتي
                    </p>
                </div>
                <button 
                    className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                    onClick={handleAddBank}
                >
                    + إضافة بنك
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-4 md:px-6">
                {banks.map((bank) => (
                    <div 
                        key={bank.id} 
                        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 relative group"
                    >
                        {/* Delete Button */}
                        <button
                            onClick={() => handleDeleteBank(bank.id, bank.name)}
                            disabled={deletingId === bank.id}
                            className={`absolute cursor-pointer top-3 left-3 p-2 rounded-full transition-all duration-300 z-10
                                ${deletingId === bank.id 
                                    ? 'bg-gray-300 cursor-not-allowed' 
                                    : 'bg-red-50 hover:bg-red-100 hover:scale-110 active:scale-95'
                                }`}
                            title="حذف البنك"
                        >
                            {deletingId === bank.id ? (
                                <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                            ) : (
                                <MdDeleteForever className="text-red-500 text-2xl" />
                            )}
                        </button>

                        <div className="p-6 md:p-8 flex flex-col items-center text-center">
                            {/* Icon */}
                            <div className="w-20 h-20 rounded-full bg-[#f8f7f5] shadow-xl flex items-center justify-center mb-5 border-b-2 border-[#a47d52] transition-all duration-300 group-hover:bg-[#f8f7f5] group-hover:border-[#a47d52]">
                                <span className="text-3xl transition-colors duration-300">
                                    🏦
                                </span>
                            </div>
                            
                            {/* Name */}
                            <h3 className="text-xl font-extrabold text-gray-800 mb-2">
                                {bank.name}
                            </h3>
                            
                            {/* Account Details */}
                            <div className="w-full space-y-2 mb-4">
                                {bank.account_number && (
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                        <span className="text-sm text-gray-500 font-semibold">رقم الحساب</span>
                                        <span className="text-sm font-bold text-gray-700">
                                            {bank.account_number}
                                        </span>
                                    </div>
                                )}
                                {bank.iban && (
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                        <span className="text-sm text-gray-500 font-semibold">IBAN</span>
                                        <span className="text-sm font-bold text-gray-700">
                                            {bank.iban}
                                        </span>
                                    </div>
                                )}
                                {bank.swift_code && (
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                        <span className="text-sm text-gray-500 font-semibold">SWIFT</span>
                                        <span className="text-sm font-bold text-gray-700">
                                            {bank.swift_code}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 font-semibold">الرصيد الحالي</span>
                                    <span className="text-lg font-extrabold text-[#a47d52]">
                                        {formatCurrency(bank.balance, bank.currency || 'AED')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 font-semibold">رصيد الافتتاح</span>
                                    <span className="text-sm font-bold text-gray-700">
                                        {formatCurrency(bank.balance_opening, bank.currency || 'AED')}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Status */}
                            <div className="mb-2 md:mb-10 w-full mt-5">
                                <span 
                                    className={`inline-block px-4 py-1.5 rounded-full text-xs font-extrabold text-white tracking-wide ${
                                        bank.is_active !== false ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                                >
                                    {bank.is_active !== false ? '✓ نشط' : '✗ غير نشط'}
                                </span>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 w-full border-t border-gray-300 pt-5">
                                <button 
                                    className="flex-1 cursor-pointer bg-[#a47d52] shadow-lg text-white py-2.5 px-4 rounded-xs font-extrabold text-sm transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
                                    onClick={() => handleSelectBank(bank.id)}
                                >
                                    كشف حساب
                                </button>
                                {/* <button 
                                    className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-full font-extrabold text-sm transition-all duration-300 hover:bg-green-700 hover:scale-105 active:scale-95"
                                    onClick={() => handleDeposit(bank.id)}
                                >
                                    إيداع
                                </button>
                                <button 
                                    className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-full font-extrabold text-sm transition-all duration-300 hover:bg-red-700 hover:scale-105 active:scale-95"
                                    onClick={() => handleWithdraw(bank.id)}
                                >
                                    سحب
                                </button> */}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <AddBank 
                    onClose={handleCloseModal}
                    onSuccess={(data) => {
                        console.log('New bank added:', data);
                        setBanks(prev => [...prev, data]);
                        fetchBanks();
                    }}
                />
            )}
        </div>
    );
};

export default Bank;