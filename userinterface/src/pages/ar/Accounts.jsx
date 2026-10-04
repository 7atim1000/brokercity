import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddAccount from "../../components/ar/transactions/AddAccount";
import AddAccountCategory from "../../components/ar/transactions/AddAccountCategory";

import { CiEdit } from "react-icons/ci";
import { MdDeleteForever } from "react-icons/md";

// Base URL from environment variables
const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [error, setError] = useState('');

    // Fetch accounts
    const fetchAccounts = async () => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                toast.error('يرجى تسجيل الدخول لعرض الحسابات');
                setLoading(false);
                return;
            }

            const response = await fetch(
                `${BASE}/api/accounts/`,
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
                    toast.error('فشل تحميل الحسابات');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched accounts data:', data);
            
            // Check if data is paginated (has results array) or direct array
            let accountsData = [];
            if (data && Array.isArray(data)) {
                accountsData = data;
            } else if (data && data.results && Array.isArray(data.results)) {
                accountsData = data.results;
            } else {
                accountsData = [];
            }
            
            setAccounts(accountsData);
            setLoading(false);
        } catch (err) {
            setError('فشل تحميل الحسابات');
            setLoading(false);
            console.error('Error fetching accounts:', err);
            toast.error('❌ حدث خطأ أثناء جلب الحسابات');
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    // Delete account
    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                toast.error('يرجى تسجيل الدخول');
                return;
            }

            const response = await fetch(
                `${BASE}/api/accounts/${id}/delete/`,
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
                } else {
                    toast.error('فشل حذف الحساب');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success('✅ تم حذف الحساب بنجاح');
            fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('❌ حدث خطأ أثناء حذف الحساب');
        }
    };

    // Update account
    const handleUpdate = (account) => {
        setSelectedAccount(account);
        setShowAddAccountModal(true);
    };

    // Filter accounts
    const filteredAccounts = accounts.filter(account => {
        const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (account.category_name && account.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType ? account.type === filterType : true;
        return matchesSearch && matchesType;
    });

    // Handle modal close
    const handleModalClose = () => {
        setShowAddAccountModal(false);
        setShowAddCategoryModal(false);
        setSelectedAccount(null);
        fetchAccounts();
    };

    // Get type badge
    const getTypeBadge = (type) => {
        if (type === 'revenues') {
            return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">إيرادات</span>;
        } else if (type === 'expenses') {
            return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">مصروفات</span>;
        }
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{type}</span>;
    };

    return (
        <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={true}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4 lg:shadow-lg">
                <div className="text-center sm:text-right">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                        بنود الحسابات
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 mt-1">
                        إدارة البنود وأنواع الحسابات
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                        onClick={() => {
                            setSelectedAccount(null);
                            setShowAddAccountModal(true);
                        }}
                    >
                        + اضافه بند
                    </button>
                    {/* <button 
                        className="bg-[#6c7a89] text-white px-6 md:px-8 py-3 rounded-full font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#5a6775] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                        onClick={() => setShowAddCategoryModal(true)}
                    >
                        + إضافة نوع حساب
                    </button> */}
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-full mx-auto px-4 md:px-3 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder="بحث عن حساب..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <select
                            className="w-full px-4 py-3 cursor-pointer rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">جميع الأنواع</option>
                            <option value="revenues">إيرادات</option>
                            <option value="expenses">مصروفات</option>
                        </select>
                    </div>
                    <div className="w-full md:w-auto">
                        <span className="text-gray-600 text-sm">
                            عدد الحسابات: {filteredAccounts.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="max-w-full mx-auto px-4 md:px-3">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a47d52]"></div>
                        </div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg">لا توجد حسابات</p>
                            <p className="text-gray-400 text-sm mt-2">قم بإضافة حساب جديد</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#e9e6e1] text-[#a47d52]">
                                    <tr>
                                        <th className="px-6 py-4 text-right text-sm font-bold">#</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold">اسم الحساب</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold">النوع</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold">نوع الحساب</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold">تاريخ الإنشاء</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAccounts.map((account, index) => (
                                        <tr 
                                            key={account.id} 
                                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-800">
                                                {account.name}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm">
                                                {getTypeBadge(account.type)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                {account.category_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-600">
                                                {new Date(account.created_at).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleUpdate(account)}
                                                        className="px-2 py-2 cursor-pointer bg-white text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                                                    >
                                                        <CiEdit className ='text-green-600' size="22"/>
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(account.id)}
                                                        className="px-2 py-2 cursor-pointer bg-white text-white rounded-lg text-sm font-semibold  transition-all duration-200 hover:scale-105"
                                                    >
                                                        <MdDeleteForever className ='text-red-600' size="22"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showAddAccountModal && (
                <AddAccount
                    onClose={handleModalClose}
                    accountData={selectedAccount}
                    onSuccess={fetchAccounts}
                />
            )}

            {showAddCategoryModal && (
                <AddAccountCategory
                    onClose={handleModalClose}
                    onSuccess={fetchAccounts}
                />
            )}
        </div>
    );
};

export default Accounts;