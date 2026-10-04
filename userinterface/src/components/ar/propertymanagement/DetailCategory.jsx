import React from "react";
import {
    FaTags,
    FaUserTie,
    FaBuilding,
    FaMapMarkerAlt,
    FaMapMarkedAlt,
    FaHome,
    FaBriefcase,
    FaCalendarAlt,
    FaClock,
} from "react-icons/fa";
import { MdClose } from "react-icons/md";

const DetailCategory = ({
    categoryData,
    onClose,
}) => {
    if (!categoryData) {
        return null;
    }

    // ---------------------------------------------------------
    // Format date
    // ---------------------------------------------------------
    const formatDate = (value) => {
        if (!value) return "-";

        try {
            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return value;
            }

            return date.toLocaleString(
                "ar-AE",
                {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                }
            );
        } catch {
            return value;
        }
    };

    // ---------------------------------------------------------
    // Get owner name
    // Supports:
    // owner_details.name
    // owner_name
    // owner.name
    // ---------------------------------------------------------
    const getOwnerName = () => {
        if (
            categoryData?.owner_details
                ?.name
        ) {
            return categoryData.owner_details
                .name;
        }

        if (
            categoryData?.owner_name
        ) {
            return categoryData.owner_name;
        }

        if (
            categoryData?.owner &&
            typeof categoryData.owner ===
                "object" &&
            categoryData.owner.name
        ) {
            return categoryData.owner.name;
        }

        return "-";
    };

    // ---------------------------------------------------------
    // Detail item
    // ---------------------------------------------------------
    const DetailItem = ({
        icon,
        label,
        value,
    }) => (
        <div className="bg-[#f8f7f5] rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[#e9e6e1] flex items-center justify-center">
                    {icon}
                </div>

                <span className="text-sm font-bold text-gray-500">
                    {label}
                </span>
            </div>

            <div className="text-base font-extrabold text-gray-800 pr-12">
                {value || "-"}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto"
                dir="rtl"
            >
                {/* =================================================
                    HEADER
                ================================================== */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-[#f8f7f5] z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#e9e6e1] flex items-center justify-center">
                            <FaTags
                                className="text-[#a47d52]"
                                size={21}
                            />
                        </div>

                        <div>
                            <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                                تفاصيل التصنيف
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                عرض بيانات التصنيف كاملة
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="text-red-600 cursor-pointer hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
                        onClick={onClose}
                    >
                        <MdClose size={28} />
                    </button>
                </div>

                {/* =================================================
                    CONTENT
                ================================================== */}
                <div className="p-6">

                    {/* =================================================
                        MAIN INFORMATION
                    ================================================== */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FaTags className="text-[#a47d52]" />

                            <h4 className="text-lg font-extrabold text-gray-800">
                                البيانات الأساسية
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Name */}
                            <DetailItem
                                icon={
                                    <FaTags className="text-[#a47d52]" />
                                }
                                label="اسم التصنيف"
                                value={
                                    categoryData.name
                                }
                            />

                            {/* Type */}
                            <DetailItem
                                icon={
                                    <FaBuilding className="text-[#a47d52]" />
                                }
                                label="نوع التصنيف"
                                value={
                                    categoryData.type ===
                                    "vila"
                                        ? "فيلا"
                                        : categoryData.type ===
                                          "building"
                                        ? "مبنى"
                                        : categoryData.type ||
                                          "-"
                                }
                            />

                            {/* Status */}
                            <div className="bg-[#f8f7f5] rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-9 h-9 rounded-lg bg-[#e9e6e1] flex items-center justify-center">
                                        {categoryData.status ===
                                        "commercial" ? (
                                            <FaBriefcase className="text-indigo-600" />
                                        ) : (
                                            <FaHome className="text-emerald-600" />
                                        )}
                                    </div>

                                    <span className="text-sm font-bold text-gray-500">
                                        حالة التصنيف
                                    </span>
                                </div>

                                <div className="pr-12">
                                    {categoryData.status ===
                                    "commercial" ? (
                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold">
                                            <FaBriefcase
                                                size={
                                                    14
                                                }
                                            />
                                            تجاري
                                        </span>
                                    ) : categoryData.status ===
                                      "residential" ? (
                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold">
                                            <FaHome
                                                size={
                                                    14
                                                }
                                            />
                                            سكني
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 font-extrabold">
                                            {categoryData.status ||
                                                "-"}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Owner */}
                            <DetailItem
                                icon={
                                    <FaUserTie className="text-[#a47d52]" />
                                }
                                label="المالك"
                                value={getOwnerName()}
                            />
                        </div>
                    </div>

                    {/* =================================================
                        LOCATION INFORMATION
                    ================================================== */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FaMapMarkerAlt className="text-[#a47d52]" />

                            <h4 className="text-lg font-extrabold text-gray-800">
                                بيانات الموقع
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Area */}
                            <DetailItem
                                icon={
                                    <FaMapMarkedAlt className="text-[#a47d52]" />
                                }
                                label="المنطقة"
                                value={
                                    categoryData.area
                                }
                            />

                            {/* Location */}
                            <DetailItem
                                icon={
                                    <FaMapMarkerAlt className="text-[#a47d52]" />
                                }
                                label="الموقع"
                                value={
                                    categoryData.location
                                }
                            />
                        </div>
                    </div>

                    {/* =================================================
                        SYSTEM INFORMATION
                    ================================================== */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FaCalendarAlt className="text-[#a47d52]" />

                            <h4 className="text-lg font-extrabold text-gray-800">
                                معلومات النظام
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {/* ID */}
                            <DetailItem
                                icon={
                                    <FaTags className="text-[#a47d52]" />
                                }
                                label="رقم التصنيف"
                                value={
                                    categoryData.id
                                }
                            />

                            {/* Created */}
                            <DetailItem
                                icon={
                                    <FaCalendarAlt className="text-[#a47d52]" />
                                }
                                label="تاريخ الإنشاء"
                                value={formatDate(
                                    categoryData.created_at
                                )}
                            />

                            {/* Updated */}
                            <DetailItem
                                icon={
                                    <FaClock className="text-[#a47d52]" />
                                }
                                label="آخر تحديث"
                                value={formatDate(
                                    categoryData.updated_at
                                )}
                            />
                        </div>
                    </div>

                    {/* =================================================
                        CLOSE
                    ================================================== */}
                    <div className="border-t border-gray-200 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full cursor-pointer font-extrabold bg-gray-300 text-red-600 px-6 py-3 rounded-lg transition-all duration-300 hover:bg-gray-400"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailCategory;
