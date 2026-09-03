import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddDeposit from '../../components/ar/transactions/AddDeposit';
import AddWithdraw from '../../components/ar/transactions/AddWithdraw';
import TransactionDetails from '../../components/ar/transactions/TransactionDetails';
import { BiSolidShow } from "react-icons/bi";
import { MdDeleteForever } from "react-icons/md";

// Base URL from environment variables
const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// FOR fetch account_from, account_to, ...
const renderAccountValue = (value) => {
    if (!value) return '-';
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-800">
            {value}
        </span>
    );
};

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddWithdrawModal, setShowAddWithdrawModal] = useState(false);
    const [showAddDepositModal, setShowAddDepositModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
    const [error, setError] = useState('');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    // Modal state for TransactionDetails
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState(null);

    const handleViewTransaction = (transactionId) => {
        setSelectedTransactionId(transactionId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTransactionId(null);
    };

    // Fetch transactions with pagination
    const fetchTransactions = async (page = 1) => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                toast.error('يرجى تسجيل الدخول لعرض المعاملات');
                setLoading(false);
                return;
            }

            let url = `${BASE}/api/transactions/?page=${page}&page_size=${pageSize}`;
            
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }
            if (filterType) {
                url += `&type=${filterType}`;
            }
            if (filterPaymentMethod) {
                url += `&payment_method=${filterPaymentMethod}`;
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error('فشل تحميل المعاملات');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched transactions data:', data);
            
            if (data && data.results && Array.isArray(data.results)) {
                setTransactions(data.results);
                setTotalCount(data.count || 0);
                setTotalPages(Math.ceil((data.count || 0) / pageSize));
                setNextPage(data.next);
                setPreviousPage(data.previous);
            } else if (data && Array.isArray(data)) {
                setTransactions(data);
                setTotalCount(data.length);
                setTotalPages(Math.ceil(data.length / pageSize));
                setNextPage(null);
                setPreviousPage(null);
            } else {
                setTransactions([]);
                setTotalCount(0);
                setTotalPages(0);
            }
            
            setLoading(false);
        } catch (err) {
            setError('فشل تحميل المعاملات');
            setLoading(false);
            console.error('Error fetching transactions:', err);
            toast.error('❌ حدث خطأ أثناء جلب المعاملات');
        }
    };

    // Handle search with debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (currentPage === 1) {
                fetchTransactions(1);
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filterType, filterPaymentMethod]);

    // Fetch on page change
    useEffect(() => {
        fetchTransactions(currentPage);
    }, [currentPage]);

    // Initial fetch
    useEffect(() => {
        fetchTransactions(1);
    }, []);

    // Delete transaction
    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                toast.error('يرجى تسجيل الدخول');
                return;
            }

            const response = await fetch(
                `${BASE}/api/transactions/${id}/delete/`,
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
                    toast.error('فشل حذف المعاملة');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success('✅ تم حذف المعاملة بنجاح');
            fetchTransactions(currentPage);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('❌ حدث خطأ أثناء حذف المعاملة');
        }
    };

    // Update transaction
    const handleUpdate = (transaction) => {
        console.log('Updating transaction:', transaction);
        setSelectedTransaction(transaction);
        
        if (transaction.type === 'deposit') {
            setShowAddDepositModal(true);
        } else if (transaction.type === 'withdraw') {
            setShowAddWithdrawModal(true);
        } else {
            toast.error('نوع المعاملة غير معروف');
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        setShowAddDepositModal(false);
        setShowAddWithdrawModal(false);
        setSelectedTransaction(null);
        fetchTransactions(currentPage);
    };

    // Get type badge
    const getTypeBadge = (type) => {
        if (type === 'deposit') {
            return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-green-100 text-green-800">إيداع</span>;
        } else if (type === 'withdraw') {
            return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-red-100 text-red-800">سحب</span>;
        }
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{type}</span>;
    };

    // Get payment method badge
    const getPaymentMethodBadge = (method) => {
        if (method === 'banks') {
            return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-blue-100 text-blue-800">بنوك</span>;
        } else if (method === 'cash') {
            return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-yellow-100 text-yellow-800">نقدي</span>;
        }
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{method}</span>;
    };

    // Get amount display with color
    const getAmountDisplay = (transaction) => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'deposit') {
            return <span className="text-green-600 font-bold">+ {amount.toFixed(2)}</span>;
        } else {
            return <span className="text-red-600 font-bold">- {amount.toFixed(2)}</span>;
        }
    };

    // Pagination controls
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value);
        setPageSize(newSize);
        setCurrentPage(1);
    };

    // Pagination component
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center gap-2 mt-6 justify-center">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    السابق
                </button>
                
                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => handlePageChange(1)}
                            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
                    </>
                )}
                
                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                            currentPage === page
                                ? 'bg-[#a47d52] text-white border-[#a47d52]'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {page}
                    </button>
                ))}
                
                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        >
                            {totalPages}
                        </button>
                    </>
                )}
                
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    التالي
                </button>
            </div>
        );
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
            <div className="flex flex-col shadow-lg sm:flex-row justify-between items-center max-w-full mx-auto px-4 py-2 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4">
                <div className="text-center sm:text-right">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                        المعاملات المالية
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 mt-1">
                        إدارة المعاملات المالية (إيداع / سحب)
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        className="bg-green-600 cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                        onClick={() => {
                            setSelectedTransaction(null);
                            setShowAddDepositModal(true);
                        }}
                    >
                        + إيداع
                    </button>
                    <button 
                        className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:text-white hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                        onClick={() => {
                            setSelectedTransaction(null);
                            setShowAddWithdrawModal(true);
                        }}
                    >
                        + سحب
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-full mx-auto px-4 md:px-3 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder="بحث عن معاملة (رقم، بيان، رقم الشيك)..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-1/5">
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">جميع الأنواع</option>
                            <option value="deposit">إيداع</option>
                            <option value="withdraw">سحب</option>
                        </select>
                    </div>
                    <div className="w-full md:w-1/5">
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
                            value={filterPaymentMethod}
                            onChange={(e) => setFilterPaymentMethod(e.target.value)}
                        >
                            <option value="">جميع طرق الدفع</option>
                            <option value="banks">بنوك</option>
                            <option value="cash">نقدي</option>
                        </select>
                    </div>
                    <div className="w-full md:w-auto flex gap-3 items-center">
                        <span className="text-gray-600 text-sm whitespace-nowrap">
                            إجمالي: {totalCount} معاملة
                        </span>
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                            value={pageSize}
                            onChange={handlePageSizeChange}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
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
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg">لا توجد معاملات</p>
                            <p className="text-gray-400 text-sm mt-2">قم بإضافة معاملة جديدة</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#e9e6e1] text-[#a47d52]">
                                        <tr>
                                            <th className="px-6 py-4 text-right text-sm font-bold">#</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">رقم المعاملة</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">التاريخ</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">النوع</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">طريقة الدفع</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">من حساب</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">الى حساب</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">المستلم</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">المبلغ</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">البيان</th>
                                            <th className="px-6 py-4 text-center text-sm font-bold">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((transaction, index) => (
                                            <tr 
                                                key={transaction.id} 
                                                className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                                            >
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    {(currentPage - 1) * pageSize + index + 1}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium text-gray-800">
                                                    {transaction.transaction_no}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    {new Date(transaction.transaction_date).toLocaleDateString('ar-EG')}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {getTypeBadge(transaction.type)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {getPaymentMethodBadge(transaction.payment_method)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {renderAccountValue(transaction.account_from)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {transaction.account_to}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {transaction.person_receipt}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {getAmountDisplay(transaction)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700 max-w-[150px] truncate">
                                                    {transaction.statement || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleViewTransaction(transaction.id)}
                                                            className="cursor-pointer px-2 py-2 bg-white text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                                                            title="عرض"
                                                        >
                                                            <BiSolidShow className='text-green-600' size='22' />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(transaction.id)}
                                                            className="cursor-pointer px-2 py-2 bg-white text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                                                            title="حذف"
                                                        >
                                                            <MdDeleteForever className="text-red-600" size="22" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    
                                    {/* Table Footer with Totals */}
                                    <tfoot className="bg-[#f8f7f5] border-t-2 border-[#a47d52]">
                                        <tr className="bg-green-100">
                                            <td colSpan="8" className="px-6 py-3 text-right text-sm font-extrabold text-green-600">
                                                إجمالي الإيداعات
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm font-bold text-green-600">
                                                {transactions.reduce((sum, t) => {
                                                    if (t.type === 'deposit') {
                                                        return sum + parseFloat(t.amount || 0);
                                                    }
                                                    return sum;
                                                }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td colSpan="2"></td>
                                        </tr>
                                        <tr className="bg-red-100">
                                            <td colSpan="8" className="px-6 py-3 text-right text-sm font-extrabold text-red-600">
                                                إجمالي السحوبات
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm font-bold text-red-600">
                                                {transactions.reduce((sum, t) => {
                                                    if (t.type === 'withdraw') {
                                                        return sum + parseFloat(t.amount || 0);
                                                    }
                                                    return sum;
                                                }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td colSpan="2"></td>
                                        </tr>
                                        <tr className="bg-[#e9e6e1] border-t-2 border-[#a47d52]">
                                            <td colSpan="8" className="px-6 py-4 text-right text-sm font-extrabold text-[#a47d52]">
                                                الرصيد (إيداعات - سحوبات)
                                            </td>
                                            <td className={`px-6 py-4 text-right text-sm font-bold ${
                                                transactions.reduce((sum, t) => {
                                                    if (t.type === 'deposit') {
                                                        return sum + parseFloat(t.amount || 0);
                                                    } else if (t.type === 'withdraw') {
                                                        return sum - parseFloat(t.amount || 0);
                                                    }
                                                    return sum;
                                                }, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {transactions.reduce((sum, t) => {
                                                    if (t.type === 'deposit') {
                                                        return sum + parseFloat(t.amount || 0);
                                                    } else if (t.type === 'withdraw') {
                                                        return sum - parseFloat(t.amount || 0);
                                                    }
                                                    return sum;
                                                }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td colSpan="2"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-sm text-gray-600">
                                        عرض {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} من {totalCount} معاملة
                                    </div>
                                    {renderPagination()}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ===== MODALS - All modals rendered here ===== */}
            
            {/* Transaction Details Modal */}
            {/* Transaction Details Modal */}
            {/* In Parent Component (where modal is rendered): */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Backdrop with blur effect */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={handleCloseModal}
                    ></div>

                    {/* Modal Content */}
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto bg-[#f8f7f5]">

                            {/* Close Button - This one works */}
                            <button
                                onClick={handleCloseModal}
                                className="sticky top-4 float-end z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200 m-4"
                                title="Close"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Transaction Details - PASS onClose prop */}
                            <TransactionDetails
                                transactionId={selectedTransactionId}
                                onClose={handleCloseModal}  // ← ADD THIS!
                            />
                        </div>
                    </div>
                </div>
            )}


            {/* Deposit Modal */}
            {showAddDepositModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-4xl">
                            <AddDeposit
                                onClose={handleModalClose}
                                initialData={selectedTransaction}
                                isEditMode={!!selectedTransaction}
                                onSuccess={() => fetchTransactions(currentPage)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showAddWithdrawModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-4xl">
                            <AddWithdraw
                                onClose={handleModalClose}
                                initialData={selectedTransaction}
                                isEditMode={!!selectedTransaction}
                                onSuccess={() => fetchTransactions(currentPage)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;