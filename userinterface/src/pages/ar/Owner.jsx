import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AddOwner from "../../components/ar/propertymanagement/AddOwner";
import EditOwner from "../../components/ar/propertymanagement/EditOwner";
import DetailOwner from "../../components/ar/propertymanagement/DetailOwner";

import { CiEdit } from "react-icons/ci";
import { MdDeleteForever } from "react-icons/md";
import { FiEye, FiPlus, FiSearch, FiRefreshCw } from "react-icons/fi";
import { FaUserTie } from "react-icons/fa";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const Owner = () => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [selectedOwner, setSelectedOwner] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // ---------------------------------------------------------
    // Fetch owners
    // ---------------------------------------------------------
    const fetchOwners = async () => {
        setLoading(true);

        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                toast.error("يرجى تسجيل الدخول");
                return;
            }

            const response = await fetch(`${BASE}/api/owners/`, {
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
                    toast.error("فشل تحميل الملاك");
                }

                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            console.log("Fetched owners:", data);

            // API may return:
            // [ ... ]
            // OR { results: [...] }
            // OR { owner: [...] }
            let ownersData = [];

            if (Array.isArray(data)) {
                ownersData = data;
            } else if (Array.isArray(data.results)) {
                ownersData = data.results;
            } else if (Array.isArray(data.owner)) {
                ownersData = data.owner;
            } else if (Array.isArray(data.owners)) {
                ownersData = data.owners;
            }

            setOwners(ownersData);
        } catch (error) {
            console.error("Error fetching owners:", error);
            toast.error("❌ حدث خطأ أثناء جلب الملاك");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwners();
    }, []);

    // ---------------------------------------------------------
    // Delete owner
    // ---------------------------------------------------------
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "هل أنت متأكد من حذف هذا المالك؟"
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                toast.error("يرجى تسجيل الدخول");
                return;
            }

            const response = await fetch(
                `${BASE}/api/owners/${id}/delete/`,
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
                let message = "فشل حذف المالك";

                if (data && typeof data === "object") {
                    message =
                        data.detail ||
                        data.message ||
                        message;
                }

                throw new Error(message);
            }

            toast.success("✅ تم حذف المالك بنجاح");

            fetchOwners();
        } catch (error) {
            console.error("Error deleting owner:", error);
            toast.error(`❌ ${error.message || "حدث خطأ أثناء حذف المالك"}`);
        }
    };

    // ---------------------------------------------------------
    // Add
    // ---------------------------------------------------------
    const handleAdd = () => {
        setSelectedOwner(null);
        setShowAddModal(true);
    };

    // ---------------------------------------------------------
    // Edit
    // ---------------------------------------------------------
    const handleEdit = (owner) => {
        setSelectedOwner(owner);
        setShowEditModal(true);
    };

    // ---------------------------------------------------------
    // Details
    // ---------------------------------------------------------
    const handleDetails = (owner) => {
        setSelectedOwner(owner);
        setShowDetailModal(true);
    };

    // ---------------------------------------------------------
    // Close all modals
    // ---------------------------------------------------------
    const handleModalClose = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowDetailModal(false);
        setSelectedOwner(null);
    };

    // ---------------------------------------------------------
    // Success
    // ---------------------------------------------------------
    const handleSuccess = () => {
        fetchOwners();
    };

    // ---------------------------------------------------------
    // Search
    // ---------------------------------------------------------
    const filteredOwners = owners.filter((owner) => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) return true;

        return (
            String(owner.name || "")
                .toLowerCase()
                .includes(search) ||
            String(owner.phone || "")
                .toLowerCase()
                .includes(search) ||
            String(owner.address || "")
                .toLowerCase()
                .includes(search)
        );
    });

    // ---------------------------------------------------------
    // Format amount
    // ---------------------------------------------------------
    const formatAmount = (amount) => {
        const number = Number(amount || 0);

        return number.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // ---------------------------------------------------------
    // Balance badge
    // ---------------------------------------------------------
    const getBalanceBadge = (balance) => {
        const amount = Number(balance || 0);

        if (amount > 0) {
            return (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    {formatAmount(amount)}
                </span>
            );
        }

        if (amount < 0) {
            return (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    {formatAmount(amount)}
                </span>
            );
        }

        return (
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                0.00
            </span>
        );
    };

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
                                ادارة الملاك
                            </h2>

                            <p className="text-base md:text-lg text-gray-600 mt-1">
                                إدارة ملاك العقارات وبياناتهم المالية
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center justify-center gap-2 bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                    >
                        <FiPlus size={20} />
                        إضافة مالك
                    </button>

                    <button
                        type="button"
                        onClick={fetchOwners}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-[#6c7a89] cursor-pointer text-white px-5 py-3 rounded-sm font-extrabold transition-all duration-300 hover:bg-[#5a6775] hover:scale-105 disabled:opacity-50"
                    >
                        <FiRefreshCw
                            size={18}
                            className={loading ? "animate-spin" : ""}
                        />
                        تحديث
                    </button>
                </div>
            </div>

            {/* =====================================================
                SEARCH / INFO
            ====================================================== */}
            <div className="max-w-full mx-auto px-4 md:px-3 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:w-1/2">
                        <FiSearch
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                        />

                        <input
                            type="text"
                            placeholder="بحث باسم المالك أو الهاتف أو العنوان..."
                            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white text-right"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <span className="text-gray-600 text-sm">
                            عدد الملاك:{" "}
                            <span className="font-bold text-[#a47d52]">
                                {filteredOwners.length}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* =====================================================
                TABLE
            ====================================================== */}
            <div className="max-w-full mx-auto px-4 md:px-3">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a47d52]" />
                        </div>
                    ) : filteredOwners.length === 0 ? (
                        <div className="text-center py-20">
                            <FaUserTie
                                className="mx-auto text-gray-300 mb-4"
                                size={50}
                            />

                            <p className="text-gray-500 text-lg">
                                لا يوجد ملاك
                            </p>

                            <p className="text-gray-400 text-sm mt-2">
                                قم بإضافة مالك جديد
                            </p>

                            <button
                                type="button"
                                onClick={handleAdd}
                                className="mt-5 bg-[#a47d52] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#8a6a44] transition"
                            >
                                + إضافة مالك
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#e9e6e1] text-[#a47d52]">
                                    <tr>
                                        <th className="px-6 py-4 text-right text-sm font-bold">
                                            #
                                        </th>

                                        <th className="px-6 py-4 text-right text-sm font-bold">
                                            اسم المالك
                                        </th>

                                        <th className="px-6 py-4 text-right text-sm font-bold">
                                            الهاتف
                                        </th>

                                        <th className="px-6 py-4 text-right text-sm font-bold">
                                            العنوان
                                        </th>

                                        <th className="px-6 py-4 text-right text-sm font-bold">
                                            الرصيد الافتتاحي
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
                                    {filteredOwners.map((owner, index) => (
                                        <tr
                                            key={owner.id}
                                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                {index + 1}
                                            </td>

                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-800">
                                                {owner.name || "-"}
                                            </td>

                                            <td
                                                className="px-6 py-4 text-right text-sm text-gray-700"
                                                dir="ltr"
                                            >
                                                {owner.phone || "-"}
                                            </td>

                                            <td className="px-6 py-4 text-right text-sm text-gray-700 max-w-xs truncate">
                                                {owner.address || "-"}
                                            </td>

                                            <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                {formatAmount(
                                                    owner.balance_opening
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right text-sm">
                                                {getBalanceBadge(
                                                    owner.balance
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-1">
                                                    {/* Details */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDetails(
                                                                owner
                                                            )
                                                        }
                                                        className="px-2 py-2 cursor-pointer bg-white rounded-lg transition-all duration-200 hover:scale-110"
                                                        title="التفاصيل"
                                                    >
                                                        <FiEye
                                                            className="text-[#a47d52]"
                                                            size={21}
                                                        />
                                                    </button>

                                                    {/* Edit */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(owner)
                                                        }
                                                        className="px-2 py-2 cursor-pointer bg-white rounded-lg transition-all duration-200 hover:scale-110"
                                                        title="تعديل"
                                                    >
                                                        <CiEdit
                                                            className="text-green-600"
                                                            size={22}
                                                        />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                owner.id
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
                    )}
                </div>
            </div>

            {/* =====================================================
                ADD OWNER
            ====================================================== */}
            {showAddModal && (
                <AddOwner
                    onClose={handleModalClose}
                    onSuccess={handleSuccess}
                />
            )}

            {/* =====================================================
                EDIT OWNER
            ====================================================== */}
            {showEditModal && selectedOwner && (
                <EditOwner
                    ownerData={selectedOwner}
                    onClose={handleModalClose}
                    onSuccess={handleSuccess}
                />
            )}

            {/* =====================================================
                DETAILS
            ====================================================== */}
            {showDetailModal && selectedOwner && (
                <DetailOwner
                    ownerData={selectedOwner}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};

export default Owner;