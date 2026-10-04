import React, { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AddCategory from "../../components/ar/propertymanagement/AddCategory";
import EditCategory from "../../components/ar/propertymanagement/EditCategory";
import DetailCategory from "../../components/ar/propertymanagement/DetailCategory";

import { CiEdit } from "react-icons/ci";
import { MdDeleteForever } from "react-icons/md";
import {
    FiEye,
    FiPlus,
    FiSearch,
    FiRefreshCw,
    FiHome,
    FiBriefcase,
} from "react-icons/fi";
import { FaTags } from "react-icons/fa";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");

    // Default status = residential
    const [selectedStatus, setSelectedStatus] =
        useState("residential");

    // ---------------------------------------------------------
    // Fetch all buildings/categories
    // GET /api/buildings/
    // ---------------------------------------------------------
    const fetchCategories = async () => {
        setLoading(true);

        try {
            const token =
                localStorage.getItem("access_token");

            if (!token) {
                toast.error("يرجى تسجيل الدخول");
                return;
            }

            const response = await fetch(
                `${BASE}/api/buildings/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const responseText =
                await response.text();

            let data = null;

            try {
                data = responseText
                    ? JSON.parse(responseText)
                    : null;
            } catch {
                data = null;
            }

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error(
                        "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى"
                    );
                }

                let message =
                    "فشل تحميل التصنيفات";

                if (
                    data &&
                    typeof data === "object"
                ) {
                    message =
                        data.detail ||
                        data.message ||
                        message;
                }

                throw new Error(message);
            }

            console.log(
                "Fetched buildings:",
                data
            );

            /*
             * Backend response:
             *
             * {
             *     count: 10,
             *     buildings: [...]
             * }
             */
            let categoriesData = [];

            if (
                data &&
                Array.isArray(data.buildings)
            ) {
                categoriesData = data.buildings;
            }

            setCategories(categoriesData);
        } catch (error) {
            console.error(
                "Error fetching buildings:",
                error
            );

            toast.error(
                `❌ ${
                    error.message ||
                    "حدث خطأ أثناء جلب التصنيفات"
                }`
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // ---------------------------------------------------------
    // Delete building/category
    // DELETE /api/buildings/<id>/delete/
    // ---------------------------------------------------------
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "هل أنت متأكد من حذف هذا التصنيف؟"
        );

        if (!confirmed) return;

        try {
            const token =
                localStorage.getItem("access_token");

            if (!token) {
                toast.error("يرجى تسجيل الدخول");
                return;
            }

            const response = await fetch(
                `${BASE}/api/buildings/${id}/delete/`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const responseText =
                await response.text();

            let data = null;

            try {
                data = responseText
                    ? JSON.parse(responseText)
                    : null;
            } catch {
                data = null;
            }

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error(
                        "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى"
                    );
                }

                let message =
                    "فشل حذف التصنيف";

                if (
                    data &&
                    typeof data === "object"
                ) {
                    message =
                        data.detail ||
                        data.message ||
                        data.errors
                            ? typeof data.errors ===
                              "object"
                                ? Object.entries(
                                      data.errors
                                  )
                                      .map(
                                          ([
                                              field,
                                              messages,
                                          ]) =>
                                              `${field}: ${
                                                  Array.isArray(
                                                      messages
                                                  )
                                                      ? messages.join(
                                                            ", "
                                                        )
                                                      : messages
                                              }`
                                      )
                                      .join("; ")
                                : data.message ||
                                  message
                            : message;
                }

                throw new Error(message);
            }

            toast.success(
                data?.message ||
                    "✅ تم حذف التصنيف بنجاح"
            );

            await fetchCategories();
        } catch (error) {
            console.error(
                "Error deleting building:",
                error
            );

            toast.error(
                `❌ ${
                    error.message ||
                    "حدث خطأ أثناء حذف التصنيف"
                }`
            );
        }
    };

    // ---------------------------------------------------------
    // Add
    // ---------------------------------------------------------
    const handleAdd = () => {
        setSelectedCategory(null);
        setShowAddModal(true);
    };

    // ---------------------------------------------------------
    // Edit
    // ---------------------------------------------------------
    const handleEdit = (category) => {
        setSelectedCategory(category);
        setShowEditModal(true);
    };

    // ---------------------------------------------------------
    // Details
    // ---------------------------------------------------------
    const handleDetails = (category) => {
        setSelectedCategory(category);
        setShowDetailModal(true);
    };

    // ---------------------------------------------------------
    // Close all modals
    // ---------------------------------------------------------
    const handleModalClose = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowDetailModal(false);
        setSelectedCategory(null);
    };

    // ---------------------------------------------------------
    // Success
    // ---------------------------------------------------------
    const handleSuccess = () => {
        fetchCategories();
    };

    // ---------------------------------------------------------
    // Filter by status + search
    // ---------------------------------------------------------
    const filteredCategories = useMemo(() => {
        const search = searchTerm
            .trim()
            .toLowerCase();

        return categories.filter((category) => {
            // Status filter
            const matchesStatus =
                String(category.status || "")
                    .toLowerCase() ===
                selectedStatus;

            if (!matchesStatus) {
                return false;
            }

            // Search
            if (!search) {
                return true;
            }

            return (
                String(
                    category.name || ""
                )
                    .toLowerCase()
                    .includes(search) ||
                String(
                    category.area || ""
                )
                    .toLowerCase()
                    .includes(search) ||
                String(
                    category.location || ""
                )
                    .toLowerCase()
                    .includes(search) ||
                String(
                    category.owner_details?.name ||
                        category.owner_name ||
                        ""
                )
                    .toLowerCase()
                    .includes(search)
            );
        });
    }, [
        categories,
        selectedStatus,
        searchTerm,
    ]);

    // ---------------------------------------------------------
    // Status counts
    // ---------------------------------------------------------
    const residentialCount = categories.filter(
        (category) =>
            category.status === "residential"
    ).length;

    const commercialCount = categories.filter(
        (category) =>
            category.status === "commercial"
    ).length;

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
            <div className="flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 gap-4 lg:shadow-lg">
                <div className="text-center sm:text-right">
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex w-12 h-12 rounded-xl bg-[#e9e6e1] items-center justify-center">
                            <FaTags
                                className="text-[#a47d52]"
                                size={24}
                            />
                        </div>

                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                                إدارة التصنيفات
                            </h2>

                            <p className="text-base md:text-lg text-gray-600 mt-1">
                                إدارة المباني والفلل والتصنيفات العقارية
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
                        إضافة تصنيف
                    </button>

                    <button
                        type="button"
                        onClick={fetchCategories}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-[#6c7a89] cursor-pointer text-white px-5 py-3 rounded-sm font-extrabold transition-all duration-300 hover:bg-[#5a6775] hover:scale-105 disabled:opacity-50"
                    >
                        <FiRefreshCw
                            size={18}
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />
                        تحديث
                    </button>
                </div>
            </div>

            {/* =====================================================
                STATUS FILTER BUTTONS
            ====================================================== */}
            <div className="max-w-full mx-auto px-4 md:px-3 mb-7">
                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-5">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 sm:items-center sm:mx-auto gap-3 w-full md:w-auto">
                            {/* Residential */}
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedStatus(
                                        "residential"
                                    )
                                }
                                className={`
                                    flex items-center justify-center gap-3
                                    min-w-[220px]
                                    px-6 py-3
                                    rounded-xl
                                    border-2
                                    cursor-pointer
                                    font-extrabold
                                    transition-all duration-300
                                    ${
                                        selectedStatus ===
                                        "residential"
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg scale-[1.02]"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    }
                                `}
                            >
                                <FiHome size={21} />

                                <span>
                                    سكني
                                </span>

                                <span
                                    className={`
                                        px-2 py-0.5 rounded-full text-xs
                                        ${
                                            selectedStatus ===
                                            "residential"
                                                ? "bg-white/20 text-white"
                                                : "bg-white text-emerald-700"
                                        }
                                    `}
                                >
                                    {residentialCount}
                                </span>
                            </button>

                            {/* Commercial */}
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedStatus(
                                        "commercial"
                                    )
                                }
                                className={`
                                    flex items-center justify-center gap-3
                                    min-w-[220px]
                                    px-6 py-3
                                    rounded-xl
                                    border-2
                                    cursor-pointer
                                    font-extrabold
                                    transition-all duration-300
                                    ${
                                        selectedStatus ===
                                        "commercial"
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]"
                                            : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                    }
                                `}
                            >
                                <FiBriefcase size={21} />

                                <span>
                                    تجاري
                                </span>

                                <span
                                    className={`
                                        px-2 py-0.5 rounded-full text-xs
                                        ${
                                            selectedStatus ===
                                            "commercial"
                                                ? "bg-white/20 text-white"
                                                : "bg-white text-indigo-700"
                                        }
                                    `}
                                >
                                    {commercialCount}
                                </span>
                            </button>
                        </div>
                    </div>
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
                            placeholder="بحث باسم التصنيف أو المنطقة أو الموقع أو المالك..."
                            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white text-right"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <span className="text-gray-600 text-sm">
                            عدد التصنيفات{" "}
                            {selectedStatus ===
                            "residential"
                                ? "السكنية"
                                : "التجارية"}
                            :{" "}
                            <span className="font-bold text-[#a47d52]">
                                {
                                    filteredCategories.length
                                }
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
                    ) : filteredCategories.length ===
                      0 ? (
                        <div className="text-center py-20">
                            <FaTags
                                className="mx-auto text-gray-300 mb-4"
                                size={50}
                            />

                            <p className="text-gray-500 text-lg font-bold">
                                لا يوجد تصنيفات{" "}
                                {selectedStatus ===
                                "residential"
                                    ? "سكنية"
                                    : "تجارية"}
                            </p>

                            <p className="text-gray-400 text-sm mt-2">
                                قم بإضافة تصنيف جديد
                            </p>

                            <button
                                type="button"
                                onClick={handleAdd}
                                className="mt-5 bg-[#a47d52] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#8a6a44] transition"
                            >
                                + إضافة تصنيف
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#e9e6e1] text-[#a47d52]">
                                    <tr>
                                        <th className="px-5 py-4 text-right text-sm font-bold">
                                            #
                                        </th>

                                        <th className="px-5 py-4 text-right text-sm font-bold">
                                            اسم التصنيف
                                        </th>

                                        <th className="px-5 py-4 text-right text-sm font-bold">
                                            النوع
                                        </th>

                                        <th className="px-5 py-4 text-right text-sm font-bold">
                                            الحالة
                                        </th>

                                        <th className="px-5 py-4 text-right text-sm font-bold">
                                            المنطقة
                                        </th>

                                        <th className="px-5 py-4 text-right text-sm font-bold">
                                            الموقع
                                        </th>

                                        <th className="px-5 py-4 text-right text-sm font-bold">
                                            المالك
                                        </th>

                                        <th className="px-5 py-4 text-center text-sm font-bold">
                                            الإجراءات
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredCategories.map(
                                        (
                                            category,
                                            index
                                        ) => (
                                            <tr
                                                key={
                                                    category.id
                                                }
                                                className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                                            >
                                                <td className="px-5 py-4 text-right text-sm text-gray-700">
                                                    {index +
                                                        1}
                                                </td>

                                                {/* Name */}
                                                <td className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-[#e9e6e1] flex items-center justify-center shrink-0">
                                                            <FaTags
                                                                className="text-[#a47d52]"
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </div>

                                                        <span>
                                                            {category.name ||
                                                                "-"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Type */}
                                                <td className="px-5 py-4 text-right text-sm">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#e9e6e1] text-[#8a6a44] font-bold">
                                                        {category.type ===
                                                        "vila"
                                                            ? "فيلا"
                                                            : "مبنى"}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4 text-right text-sm">
                                                    {category.status ===
                                                    "commercial" ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                                                            <FiBriefcase
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                            تجاري
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                                                            <FiHome
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                            سكني
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Area */}
                                                <td className="px-5 py-4 text-right text-sm text-gray-700">
                                                    {category.area ||
                                                        "-"}
                                                </td>

                                                {/* Location */}
                                                <td className="px-5 py-4 text-right text-sm text-gray-700">
                                                    {category.location ||
                                                        "-"}
                                                </td>

                                                {/* Owner */}
                                                <td className="px-5 py-4 text-right text-sm text-gray-700">
                                                    {category
                                                        .owner_details
                                                        ?.name ||
                                                        category.owner_name ||
                                                        "-"}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDetails(
                                                                    category
                                                                )
                                                            }
                                                            className="px-2 py-2 cursor-pointer bg-white rounded-lg transition-all duration-200 hover:scale-110"
                                                            title="التفاصيل"
                                                        >
                                                            <FiEye
                                                                className="text-[#a47d52]"
                                                                size={
                                                                    21
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    category
                                                                )
                                                            }
                                                            className="px-2 py-2 cursor-pointer bg-white rounded-lg transition-all duration-200 hover:scale-110"
                                                            title="تعديل"
                                                        >
                                                            <CiEdit
                                                                className="text-green-600"
                                                                size={
                                                                    22
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    category.id
                                                                )
                                                            }
                                                            className="px-2 py-2 cursor-pointer bg-white rounded-lg transition-all duration-200 hover:scale-110"
                                                            title="حذف"
                                                        >
                                                            <MdDeleteForever
                                                                className="text-red-600"
                                                                size={
                                                                    22
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* =====================================================
                ADD
            ====================================================== */}
            {showAddModal && (
                <AddCategory
                    onClose={handleModalClose}
                    onSuccess={handleSuccess}
                />
            )}

            {/* =====================================================
                EDIT
            ====================================================== */}
            {showEditModal &&
                selectedCategory && (
                    <EditCategory
                        categoryData={
                            selectedCategory
                        }
                        onClose={handleModalClose}
                        onSuccess={handleSuccess}
                    />
                )}

            {/* =====================================================
                DETAILS
            ====================================================== */}
            {showDetailModal &&
                selectedCategory && (
                    <DetailCategory
                        categoryData={
                            selectedCategory
                        }
                        onClose={handleModalClose}
                    />
                )}
        </div>
    );
};

export default Category;
