import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AddRental from "../../components/ar/propertymanagement/AddRental";
import EditRental from "../../components/ar/propertymanagement/EditRental";
import DetailRental from "../../components/ar/propertymanagement/DetailRental";

import { CiEdit } from "react-icons/ci";
import { MdDeleteForever } from "react-icons/md";
import {
    FiEye,
    FiPlus,
    FiSearch,
    FiRefreshCw,
    FiGrid,
    FiList,
    FiPhone,
    FiMail,
    FiUser,
    FiCreditCard,
} from "react-icons/fi";
import { FaUserTie, FaMoneyBillWave } from "react-icons/fa";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const Rental = () => {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [selectedRental, setSelectedRental] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");

    // =========================================================
    // View mode: "cards" (default) or "table"
    // =========================================================
    const [viewMode, setViewMode] = useState("cards");

    /* =========================================================
       FETCH ALL RENTALS
    ========================================================= */

    const fetchRentals = async () => {
        setLoading(true);

        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                toast.error("يرجى تسجيل الدخول");
                return;
            }

            const response = await fetch(`${BASE}/api/rentals/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error(
                        "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى"
                    );
                } else {
                    toast.error("فشل تحميل المستأجرين");
                }

                throw new Error(
                    `HTTP error! status: ${response.status}`
                );
            }

            const data = await response.json();

            let rentalsData = [];

            if (Array.isArray(data)) {
                rentalsData = data;
            } else if (Array.isArray(data.results)) {
                rentalsData = data.results;
            } else if (Array.isArray(data.rentals)) {
                rentalsData = data.rentals;
            } else if (Array.isArray(data.rental)) {
                rentalsData = data.rental;
            }

            setRentals(rentalsData);
        } catch (error) {
            console.error("Error fetching rentals:", error);

            if (
                !error.message?.includes("401") &&
                error.message !== "Failed to fetch"
            ) {
                toast.error("❌ حدث خطأ أثناء جلب المستأجرين");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRentals();
    }, []);

    /* =========================================================
       DELETE
    ========================================================= */

    const handleDelete = async (id, name) => {
        const confirmed = window.confirm(
            `هل أنت متأكد من حذف المستأجر "${name || ""}"؟`
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                toast.error("يرجى تسجيل الدخول");
                return;
            }

            const response = await fetch(
                `${BASE}/api/rentals/${id}/delete/`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const responseText = await response.text();

            let data = null;

            try {
                data = responseText ? JSON.parse(responseText) : null;
            } catch {
                data = null;
            }

            if (!response.ok) {
                let message = "فشل حذف المستأجر";

                if (data && typeof data === "object") {
                    message =
                        data.detail || data.message || message;
                }

                throw new Error(message);
            }

            toast.success("✅ تم حذف المستأجر بنجاح");

            fetchRentals();
        } catch (error) {
            console.error("Error deleting rental:", error);

            toast.error(
                `❌ ${error.message || "حدث خطأ أثناء حذف المستأجر"}`
            );
        }
    };

    /* =========================================================
       HANDLERS
    ========================================================= */

    const handleAdd = () => {
        setSelectedRental(null);
        setShowAddModal(true);
    };

    const handleEdit = (rental) => {
        setSelectedRental(rental);
        setShowEditModal(true);
    };

    const handleDetails = (rental) => {
        setSelectedRental(rental);
        setShowDetailModal(true);
    };

    const handleModalClose = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowDetailModal(false);
        setSelectedRental(null);
    };

    const handleSuccess = () => {
        fetchRentals();
    };

    /* =========================================================
       HELPERS
    ========================================================= */

    const formatAmount = (amount) => {
        const number = Number(amount || 0);

        return number.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    /* =========================================================
       FILTER
    ========================================================= */

    const filteredRentals = rentals.filter((rental) => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) return true;

        return (
            String(rental.name || "")
                .toLowerCase()
                .includes(search) ||
            String(rental.nationality || "")
                .toLowerCase()
                .includes(search) ||
            String(rental.phone_1 || "")
                .toLowerCase()
                .includes(search) ||
            String(rental.phone_2 || "")
                .toLowerCase()
                .includes(search) ||
            String(rental.id_number || "")
                .toLowerCase()
                .includes(search) ||
            String(rental.email || "")
                .toLowerCase()
                .includes(search)
        );
    });

    /* =========================================================
       RENDER — CARD VIEW
    ========================================================= */

    const renderCardsView = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-4 md:px-6">

            {filteredRentals.map((rental) => (

                <div
                    key={rental.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 relative group"
                >

                    {/* Delete button (top-left) */}
                    <button
                        onClick={() =>
                            handleDelete(rental.id, rental.name)
                        }
                        className="absolute cursor-pointer top-3 left-3 p-2 rounded-full bg-red-50 hover:bg-red-100 hover:scale-110 active:scale-95 transition-all duration-300 z-10"
                        title="حذف المستأجر"
                    >
                        <MdDeleteForever className="text-red-500 text-2xl" />
                    </button>

                    {/* Edit button (top-right) */}
                    <button
                        onClick={() => handleEdit(rental)}
                        className="absolute cursor-pointer top-3 right-3 p-2 rounded-full bg-[#f8f7f5] hover:bg-[#e6cba8] hover:scale-110 active:scale-95 transition-all duration-300 z-10"
                        title="تعديل المستأجر"
                    >
                        <CiEdit className="text-[#a47d52] text-2xl" />
                    </button>

                    <div className="p-6 md:p-8 pt-14 flex flex-col items-center text-center">

                        {/* Avatar / Icon */}
                        <div className="w-24 h-24 rounded-full bg-[#f8f7f5] flex items-center justify-center mb-5 border-b-2 border-[#a47d52] transition-all duration-300 group-hover:border-[#8a6a44]">

                            <FaUserTie
                                className="text-[#a47d52]"
                                size={38}
                            />

                        </div>

                        {/* Name */}
                        <h3 className="text-lg font-extrabold text-gray-800 mb-1 line-clamp-1">
                            {rental.name || "بدون اسم"}
                        </h3>

                        {/* Nationality */}
                        {rental.nationality && (
                            <p className="text-sm text-gray-500 mb-4">
                                {rental.nationality}
                            </p>
                        )}

                        {/* Info list */}
                        <div className="w-full space-y-2 text-sm text-gray-700 mb-4">

                            {rental.phone_1 && (
                                <div className="flex items-center gap-2 justify-start">
                                    <FiPhone className="text-[#a47d52] shrink-0" />
                                    <span dir="ltr" className="truncate">
                                        {rental.phone_1}
                                    </span>
                                </div>
                            )}

                            {rental.email && (
                                <div className="flex items-center gap-2 justify-start">
                                    <FiMail className="text-[#a47d52] shrink-0" />
                                    <span className="truncate">
                                        {rental.email}
                                    </span>
                                </div>
                            )}

                            {rental.id_number && (
                                <div className="flex items-center gap-2 justify-start">
                                    <FiCreditCard className="text-[#a47d52] shrink-0" />
                                    <span dir="ltr" className="truncate">
                                        {rental.id_number}
                                    </span>
                                </div>
                            )}

                        </div>

                        {/* Balances */}
                        <div className="w-full grid grid-cols-2 gap-2 mb-4">

                            <div className="bg-blue-50 rounded-lg py-2 px-2">
                                <p className="text-[10px] font-bold text-blue-600">
                                    رصيد التأمين
                                </p>
                                <p className="text-sm font-extrabold text-blue-700" dir="ltr">
                                    {formatAmount(
                                        rental.insurance_balance
                                    )}
                                </p>
                            </div>

                            <div className="bg-green-50 rounded-lg py-2 px-2">
                                <p className="text-[10px] font-bold text-green-600">
                                    الرصيد
                                </p>
                                <p className="text-sm font-extrabold text-green-700" dir="ltr">
                                    {formatAmount(rental.balance)}
                                </p>
                            </div>

                        </div>

                        {/* Actions */}
                        <div className="w-full border-t border-gray-200 pt-4 mt-auto flex gap-2">

                            <button
                                onClick={() => handleDetails(rental)}
                                className="flex-1 cursor-pointer bg-white border-2 border-[#a47d52] text-[#a47d52] py-2.5 px-2 rounded-lg font-extrabold text-xs transition-all duration-300 hover:bg-[#f8f7f5] hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
                            >
                                <FiEye size={16} />
                                التفاصيل
                            </button>

                            <button
                                onClick={() => handleEdit(rental)}
                                className="flex-1 cursor-pointer bg-[#a47d52] shadow-lg text-white py-2.5 px-2 rounded-lg font-extrabold text-xs transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
                            >
                                <CiEdit size={16} />
                                تعديل
                            </button>

                        </div>

                    </div>

                </div>

            ))}

        </div>
    );

    /* =========================================================
       RENDER — TABLE VIEW
    ========================================================= */

    const renderTableView = () => (
        <div className="max-w-full mx-auto px-4 md:px-3">

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full">

                        <thead className="bg-[#e9e6e1] text-[#a47d52]">

                            <tr>

                                <th className="px-6 py-4 text-right text-sm font-bold">
                                    #
                                </th>

                                <th className="px-6 py-4 text-right text-sm font-bold">
                                    الاسم
                                </th>

                                <th className="px-6 py-4 text-right text-sm font-bold">
                                    الجنسية
                                </th>

                                <th className="px-6 py-4 text-right text-sm font-bold">
                                    الهاتف 1
                                </th>

                                <th className="px-6 py-4 text-right text-sm font-bold">
                                    الهاتف 2
                                </th>

                                <th className="px-6 py-4 text-right text-sm font-bold">
                                    رقم الهوية
                                </th>

                                <th className="px-6 py-4 text-right text-sm font-bold">
                                    البريد الإلكتروني
                                </th>

                                <th className="px-6 py-4 text-right text-sm font-bold">
                                    رصيد التأمين
                                </th>

                                <th className="px-6 py-4 text-right text-sm font-bold">
                                    الرصيد
                                </th>

                                <th className="px-6 py-4 text-center text-sm font-bold">
                                    الإجراءات
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredRentals.map((rental, index) => (

                                <tr
                                    key={rental.id}
                                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                                >

                                    <td className="px-6 py-4 text-right text-sm text-gray-700">
                                        {index + 1}
                                    </td>

                                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-800">
                                        {rental.name || "-"}
                                    </td>

                                    <td className="px-6 py-4 text-right text-sm text-gray-700">
                                        {rental.nationality || "-"}
                                    </td>

                                    <td className="px-6 py-4 text-right text-sm text-gray-700" dir="ltr">
                                        {rental.phone_1 || "-"}
                                    </td>

                                    <td className="px-6 py-4 text-right text-sm text-gray-700" dir="ltr">
                                        {rental.phone_2 || "-"}
                                    </td>

                                    <td className="px-6 py-4 text-right text-sm text-gray-700" dir="ltr">
                                        {rental.id_number || "-"}
                                    </td>

                                    <td className="px-6 py-4 text-right text-sm text-gray-700">
                                        {rental.email || "-"}
                                    </td>

                                    <td className="px-6 py-4 text-right text-sm text-gray-700">

                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">

                                            <FaMoneyBillWave size={12} />

                                            {formatAmount(
                                                rental.insurance_balance
                                            )}

                                        </span>

                                    </td>

                                    <td className="px-6 py-4 text-right text-sm text-gray-700">

                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">

                                            <FaMoneyBillWave size={12} />

                                            {formatAmount(
                                                rental.balance
                                            )}

                                        </span>

                                    </td>

                                    <td className="px-6 py-4 text-center">

                                        <div className="flex justify-center gap-1">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDetails(rental)
                                                }
                                                className="px-2 py-2 cursor-pointer bg-white rounded-lg transition-all duration-200 hover:scale-110"
                                                title="التفاصيل"
                                            >
                                                <FiEye
                                                    className="text-[#a47d52]"
                                                    size={21}
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEdit(rental)
                                                }
                                                className="px-2 py-2 cursor-pointer bg-white rounded-lg transition-all duration-200 hover:scale-110"
                                                title="تعديل"
                                            >
                                                <CiEdit
                                                    className="text-green-600"
                                                    size={22}
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(
                                                        rental.id,
                                                        rental.name
                                                    )
                                                }
                                                className="px-2 py-2 cursor-pointer bg-white rounded-lg transition-all duration-200 hover:scale-110"
                                                title="حذف"
                                            >
                                                <MdDeleteForever
                                                    className="text-red-600"
                                                    size={22}
                                                />
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <div
            className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl"
            dir="rtl"
        >
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

            {/* =====================================================
                HEADER
            ====================================================== */}
            <div className="flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4 lg:shadow-lg">

                <div className="text-center sm:text-right">

                    <div className="flex items-center gap-3">

                        <div className="hidden sm:flex w-12 h-12 rounded-xl bg-[#e9e6e1] items-center justify-center">

                            <FaUserTie
                                className="text-[#a47d52]"
                                size={24}
                            />

                        </div>

                        <div>

                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                                إدارة المستأجرين
                            </h2>

                            <p className="text-base md:text-lg text-gray-600 mt-1">
                                إدارة بيانات المستأجرين وأرصدتهم
                            </p>

                        </div>

                    </div>

                </div>

                <div className="flex flex-col sm:flex-row gap-3">

                    {/* Add */}
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center justify-center gap-2 bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                    >
                        <FiPlus size={20} />
                        إضافة مستأجر
                    </button>

                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={fetchRentals}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-[#6c7a89] cursor-pointer text-white px-5 py-3 rounded-full font-extrabold transition-all duration-300 hover:bg-[#5a6775] hover:scale-105 disabled:opacity-50"
                    >
                        <FiRefreshCw
                            size={18}
                            className={loading ? "animate-spin" : ""}
                        />
                    </button>

                </div>

            </div>

            {/* =====================================================
                SEARCH + VIEW TOGGLE
            ====================================================== */}
            <div className="max-w-full mx-auto px-4 md:px-3 mb-6">

                <div className="flex flex-col md:flex-row gap-4 items-center">

                    {/* Search */}
                    <div className="relative w-full md:flex-1">

                        <FiSearch
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                        />

                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الجنسية أو رقم الهاتف أو البريد الإلكتروني..."
                            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white text-right"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                        />

                    </div>

                    {/* View toggle */}
                    <div className="w-full md:w-auto flex gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">

                        <button
                            type="button"
                            onClick={() => setViewMode("cards")}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-extrabold text-sm transition-all duration-300 cursor-pointer ${
                                viewMode === "cards"
                                    ? "bg-[#a47d52] text-white shadow-md"
                                    : "text-gray-600 hover:bg-[#f8f7f5]"
                            }`}
                            title="عرض البطاقات"
                        >
                            <FiGrid size={18} />
                            بطاقات
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-extrabold text-sm transition-all duration-300 cursor-pointer ${
                                viewMode === "table"
                                    ? "bg-[#a47d52] text-white shadow-md"
                                    : "text-gray-600 hover:bg-[#f8f7f5]"
                            }`}
                            title="عرض الجدول"
                        >
                            <FiList size={18} />
                            جدول
                        </button>

                    </div>

                </div>

            </div>

            {/* =====================================================
                CONTENT
            ====================================================== */}

            {loading ? (

                <div className="flex justify-center items-center py-20">

                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a47d52]" />

                </div>

            ) : filteredRentals.length === 0 ? (

                <div className="max-w-full mx-auto px-4 md:px-3">

                    <div className="bg-white rounded-xl shadow-lg text-center py-20">

                        <FaUserTie
                            className="mx-auto text-gray-300 mb-4"
                            size={50}
                        />

                        <p className="text-gray-500 text-lg">
                            لا يوجد مستأجرون
                        </p>

                        <p className="text-gray-400 text-sm mt-2">
                            قم بإضافة مستأجر جديد
                        </p>

                        <button
                            type="button"
                            onClick={handleAdd}
                            className="mt-5 bg-[#a47d52] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#8a6a44] transition cursor-pointer"
                        >
                            + إضافة مستأجر
                        </button>

                    </div>

                </div>

            ) : viewMode === "cards" ? (
                renderCardsView()
            ) : (
                renderTableView()
            )}

            {/* =====================================================
                ADD RENTAL
            ====================================================== */}
            {showAddModal && (
                <AddRental
                    onClose={handleModalClose}
                    onSuccess={handleSuccess}
                />
            )}

            {/* =====================================================
                EDIT RENTAL
            ====================================================== */}
            {showEditModal && selectedRental && (
                <EditRental
                    rentalId={selectedRental.id}
                    onClose={handleModalClose}
                    onSuccess={handleSuccess}
                />
            )}

            {/* =====================================================
                DETAILS
            ====================================================== */}
            {showDetailModal && selectedRental && (
                <DetailRental
                    rentalId={selectedRental.id}
                    onClose={handleModalClose}
                />
            )}

        </div>
    );
};

export default Rental;