import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    FaBuilding,
    FaUserTie,
    FaTag,
    FaMapMarkerAlt,
    FaHome,
    FaBed,
    FaBath,
    FaCar,
    FaMoneyBillWave,
    FaCalendarAlt,
    FaCouch,
} from "react-icons/fa";

import { MdClose } from "react-icons/md";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const DetailUnit = ({ unitData, onClose }) => {
    const [unit, setUnit] = useState(unitData || null);
    const [loading, setLoading] = useState(true);

    // =========================================================
    // Fetch complete unit details
    // =========================================================
    useEffect(() => {
        const fetchUnitDetails = async () => {
            if (!unitData?.id) {
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem("access_token");

                if (!token) {
                    toast.error("يرجى تسجيل الدخول");
                    setLoading(false);
                    return;
                }

                const response = await fetch(
                    `${BASE}/api/units/${unitData.id}/`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `HTTP error! status: ${response.status}`
                    );
                }

                const data = await response.json();

                console.log("Unit details:", data);

                // API can return { unit: {...} }
                setUnit(data?.unit || data);
            } catch (error) {
                console.error(
                    "Error fetching unit details:",
                    error
                );

                toast.error(
                    "❌ حدث خطأ أثناء جلب تفاصيل الوحدة"
                );

                // Keep original data if detail endpoint fails
                setUnit(unitData);
            } finally {
                setLoading(false);
            }
        };

        fetchUnitDetails();
    }, [unitData?.id]);

    // =========================================================
    // Format amount
    // =========================================================
    const formatAmount = (amount) => {
        if (
            amount === null ||
            amount === undefined ||
            amount === ""
        ) {
            return "-";
        }

        const number = Number(amount);

        if (Number.isNaN(number)) {
            return "-";
        }

        return number.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // =========================================================
    // Date
    // =========================================================
    const formatDate = (date) => {
        if (!date) return "-";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return "-";
        }

        return parsed.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // =========================================================
    // Type label
    // =========================================================
    const getTypeLabel = (type) => {
        const types = {
            apartment: "شقة",
            vila: "فيلا",
            villa: "فيلا",
            room: "غرفة",
        };

        return types[type] || type || "-";
    };

    // =========================================================
    // Status
    // =========================================================
    const getStatusBadge = (status) => {
        const statusConfig = {
            available: {
                label: "متاحة",
                className:
                    "bg-blue-100 text-blue-700",
            },

            occupied: {
                label: "مشغولة",
                className:
                    "bg-red-100 text-red-700",
            },

            rented: {
                label: "مؤجرة",
                className:
                    "bg-green-100 text-green-700",
            },

            sold: {
                label: "مباعة",
                className:
                    "bg-purple-100 text-purple-700",
            },

            reserved: {
                label: "محجوزة",
                className:
                    "bg-yellow-100 text-yellow-700",
            },
        };

        const config = statusConfig[status];

        if (!config) {
            return (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                    {status || "-"}
                </span>
            );
        }

        return (
            <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${config.className}`}
            >
                {config.label}
            </span>
        );
    };

    // =========================================================
    // Furnished
    // =========================================================
    const getFurnishedStatus = () => {
        if (unit?.furnished === true) {
            return (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    مفروشة
                </span>
            );
        }

        if (unit?.unfurnished === true) {
            return (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                    غير مفروشة
                </span>
            );
        }

        return (
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                -
            </span>
        );
    };

    // =========================================================
    // Category
    //
    // Unit no longer has owner/location directly.
    //
    // Everything comes from:
    //
    // Unit
    //   -> category
    //       -> owner
    //       -> location
    // =========================================================
    const getCategory = () => {
        return (
            unit?.category_details ||
            unit?.category ||
            null
        );
    };

    // =========================================================
    // Owner inherited from Category
    // =========================================================
    const getOwnerFromCategory = (category) => {
        if (!category) {
            return null;
        }

        return (
            category?.owner_details ||
            category?.owner ||
            null
        );
    };

    // =========================================================
    // Owner name helper
    // =========================================================
    const getOwnerName = (owner) => {
        if (!owner) {
            return "-";
        }

        if (typeof owner === "string") {
            return owner;
        }

        return (
            owner?.name ||
            owner?.full_name ||
            owner?.owner_name ||
            "-"
        );
    };

    // =========================================================
    // Owner phone helper
    // =========================================================
    const getOwnerPhone = (owner) => {
        if (!owner || typeof owner === "string") {
            return "-";
        }

        return (
            owner?.phone ||
            owner?.mobile ||
            owner?.phone_number ||
            "-"
        );
    };

    // =========================================================
    // Owner address helper
    // =========================================================
    const getOwnerAddress = (owner) => {
        if (!owner || typeof owner === "string") {
            return "-";
        }

        return owner?.address || "-";
    };

    // =========================================================
    // Owner opening balance helper
    // =========================================================
    const getOwnerOpeningBalance = (owner) => {
        if (!owner || typeof owner === "string") {
            return "-";
        }

        return formatAmount(owner?.balance_opening);
    };

    // =========================================================
    // Owner current balance helper
    // =========================================================
    const getOwnerBalance = (owner) => {
        if (!owner || typeof owner === "string") {
            return 0;
        }

        return Number(owner?.balance || 0);
    };

    // =========================================================
    // Loading / empty
    // =========================================================
    if (!unit) {
        return null;
    }

    const category = getCategory();

    // Owner now comes from Category
    const owner = getOwnerFromCategory(category);

    // Location now comes from Category
    const categoryLocation =
        category?.location ||
        category?.location_name ||
        "-";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

            <div
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                dir="rtl"
            >

                {/* =================================================
                    HEADER
                ================================================== */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-[#f8f7f5] z-10">

                    <div className="flex items-center gap-3">

                        <div className="w-12 h-12 rounded-xl bg-[#e9e6e1] flex items-center justify-center">

                            <FaBuilding
                                className="text-[#a47d52]"
                                size={24}
                            />

                        </div>

                        <div>

                            <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                                تفاصيل الوحدة
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                عرض جميع بيانات الوحدة
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-red-600 cursor-pointer hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
                    >
                        <MdClose size={28} />
                    </button>

                </div>

                {/* =================================================
                    CONTENT
                ================================================== */}
                <div className="p-6">

                    {loading ? (

                        <div className="flex justify-center items-center py-16">

                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a47d52]" />

                        </div>

                    ) : (

                        <>

                            {/* =================================================
                                UNIT NAME CARD
                            ================================================== */}
                            <div className="bg-[#f8f7f5] rounded-xl p-5 mb-5 border border-[#e9e6e1]">

                                <div className="flex items-center gap-4">

                                    <div className="w-14 h-14 rounded-full bg-[#a47d52] flex items-center justify-center">

                                        <FaBuilding
                                            className="text-white"
                                            size={25}
                                        />

                                    </div>

                                    <div>

                                        <p className="text-sm text-gray-500">
                                            اسم الوحدة
                                        </p>

                                        <h4 className="text-2xl font-extrabold text-gray-800">
                                            {unit.name || "-"}
                                        </h4>

                                    </div>

                                </div>

                            </div>

                            {/* =================================================
                                BASIC DATA
                            ================================================== */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* TYPE */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                    <div className="flex items-center gap-3 mb-2">

                                        <FaHome className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            نوع الوحدة
                                        </span>

                                    </div>

                                    <p className="text-gray-800 font-semibold">
                                        {getTypeLabel(unit.type)}
                                    </p>

                                </div>

                                {/* STATUS */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                    <div className="flex items-center gap-3 mb-2">

                                        <FaTag className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            حالة الوحدة
                                        </span>

                                    </div>

                                    <div>
                                        {getStatusBadge(
                                            unit.status
                                        )}
                                    </div>

                                </div>

                                {/* PRICE */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                    <div className="flex items-center gap-3 mb-2">

                                        <FaMoneyBillWave className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            السعر
                                        </span>

                                    </div>

                                    <p
                                        className="text-gray-800 font-bold text-lg"
                                        dir="ltr"
                                    >
                                        {formatAmount(
                                            unit.price
                                        )}
                                    </p>

                                </div>

                                {/* AREA */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                    <div className="flex items-center gap-3 mb-2">

                                        <FaMapMarkerAlt className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            المساحة
                                        </span>

                                    </div>

                                    <p className="text-gray-800 font-semibold">
                                        {unit.area || "-"}
                                    </p>

                                </div>

                                {/* BEDROOMS */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                    <div className="flex items-center gap-3 mb-2">

                                        <FaBed className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            عدد غرف النوم
                                        </span>

                                    </div>

                                    <p className="text-gray-800 font-semibold">
                                        {unit.bedrooms ?? "-"}
                                    </p>

                                </div>

                                {/* BATHROOMS */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                    <div className="flex items-center gap-3 mb-2">

                                        <FaBath className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            عدد الحمامات
                                        </span>

                                    </div>

                                    <p className="text-gray-800 font-semibold">
                                        {unit.bathrooms ?? "-"}
                                    </p>

                                </div>

                                {/* PARKING */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                    <div className="flex items-center gap-3 mb-2">

                                        <FaCar className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            مواقف السيارات
                                        </span>

                                    </div>

                                    <p className="text-gray-800 font-semibold">

                                        {unit.has_parking
                                            ? `${unit.parking ?? 0} موقف`
                                            : "لا يوجد"}

                                    </p>

                                </div>

                                {/* FURNISHED */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

                                    <div className="flex items-center gap-3 mb-2">

                                        <FaCouch className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            حالة التأثيث
                                        </span>

                                    </div>

                                    <div>
                                        {getFurnishedStatus()}
                                    </div>

                                </div>

                            </div>

                            {/* =================================================
                                CATEGORY
                            ================================================== */}
                            <div className="mt-5 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

                                <div className="flex items-center gap-3 mb-4">

                                    <FaTag
                                        className="text-[#a47d52]"
                                        size={18}
                                    />

                                    <h4 className="font-extrabold text-gray-800 text-lg">
                                        بيانات التصنيف
                                    </h4>

                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* CATEGORY NAME */}
                                    <div>

                                        <p className="text-sm text-gray-500 mb-1">
                                            اسم التصنيف
                                        </p>

                                        <p className="font-semibold text-gray-800">
                                            {category?.name ||
                                                category?.title ||
                                                "-"}
                                        </p>

                                    </div>

                                    {/* CATEGORY TYPE */}
                                    <div>

                                        <p className="text-sm text-gray-500 mb-1">
                                            النوع
                                        </p>

                                        <p className="font-semibold text-gray-800">
                                            {category?.type
                                                ? getTypeLabel(
                                                      category.type
                                                  )
                                                : "-"}
                                        </p>

                                    </div>

                                    {/* CATEGORY AREA */}
                                    <div>

                                        <p className="text-sm text-gray-500 mb-1">
                                            المساحة
                                        </p>

                                        <p className="font-semibold text-gray-800">
                                            {category?.area ?? "-"}
                                        </p>

                                    </div>

                                    {/* LOCATION */}
                                    <div>

                                        <div className="flex items-center gap-2 mb-1">

                                            <FaMapMarkerAlt
                                                className="text-[#a47d52]"
                                                size={13}
                                            />

                                            <p className="text-sm text-gray-500">
                                                الموقع
                                            </p>

                                        </div>

                                        <p className="font-semibold text-gray-800">
                                            {categoryLocation}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* =================================================
                                OWNER
                                OWNER IS INHERITED FROM CATEGORY
                            ================================================== */}
                            <div className="mt-5 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

                                <div className="flex items-center gap-3 mb-4">

                                    <FaUserTie
                                        className="text-[#a47d52]"
                                        size={19}
                                    />

                                    <div>

                                        <h4 className="font-extrabold text-gray-800 text-lg">
                                            بيانات المالك
                                        </h4>

                                        <p className="text-xs text-gray-500 mt-1">
                                            المالك المرتبط بالتصنيف
                                        </p>

                                    </div>

                                </div>

                                {owner ? (

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* OWNER NAME */}
                                        <div>

                                            <p className="text-sm text-gray-500 mb-1">
                                                اسم المالك
                                            </p>

                                            <p className="font-bold text-gray-800">
                                                {getOwnerName(owner)}
                                            </p>

                                        </div>

                                        {/* PHONE */}
                                        <div>

                                            <p className="text-sm text-gray-500 mb-1">
                                                رقم الهاتف
                                            </p>

                                            <p
                                                className="font-semibold text-gray-800"
                                                dir="ltr"
                                            >
                                                {getOwnerPhone(owner)}
                                            </p>

                                        </div>

                                        {/* ADDRESS */}
                                        <div>

                                            <p className="text-sm text-gray-500 mb-1">
                                                العنوان
                                            </p>

                                            <p className="font-semibold text-gray-800">
                                                {getOwnerAddress(owner)}
                                            </p>

                                        </div>

                                        {/* OPENING BALANCE */}
                                        <div>

                                            <p className="text-sm text-gray-500 mb-1">
                                                الرصيد الافتتاحي
                                            </p>

                                            <p
                                                className="font-bold text-gray-800"
                                                dir="ltr"
                                            >
                                                {getOwnerOpeningBalance(
                                                    owner
                                                )}
                                            </p>

                                        </div>

                                        {/* CURRENT BALANCE */}
                                        <div>

                                            <p className="text-sm text-gray-500 mb-1">
                                                الرصيد الحالي
                                            </p>

                                            <p
                                                dir="ltr"
                                                className={`font-extrabold text-lg ${
                                                    getOwnerBalance(
                                                        owner
                                                    ) > 0
                                                        ? "text-green-600"
                                                        : getOwnerBalance(
                                                              owner
                                                          ) < 0
                                                        ? "text-red-600"
                                                        : "text-gray-700"
                                                }`}
                                            >
                                                {formatAmount(
                                                    getOwnerBalance(
                                                        owner
                                                    )
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                ) : (

                                    <div className="text-center py-5 bg-[#f8f7f5] rounded-lg">

                                        <FaUserTie
                                            className="mx-auto text-gray-300 mb-2"
                                            size={30}
                                        />

                                        <p className="text-gray-500">
                                            لا يوجد مالك مرتبط بتصنيف هذه الوحدة
                                        </p>

                                    </div>

                                )}

                            </div>

                            {/* =================================================
                                ADDITIONAL INFORMATION
                            ================================================== */}
                            <div className="mt-5 bg-[#e9e6e1] rounded-xl p-5">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* CREATED */}
                                    <div className="flex items-center gap-3">

                                        <FaCalendarAlt
                                            className="text-[#a47d52]"
                                            size={18}
                                        />

                                        <div>

                                            <p className="text-sm text-gray-600">
                                                تاريخ الإنشاء
                                            </p>

                                            <p className="text-gray-800 font-semibold">
                                                {formatDate(
                                                    unit.created_at
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                    {/* UPDATED */}
                                    <div className="flex items-center gap-3">

                                        <FaCalendarAlt
                                            className="text-[#a47d52]"
                                            size={18}
                                        />

                                        <div>

                                            <p className="text-sm text-gray-600">
                                                آخر تحديث
                                            </p>

                                            <p className="text-gray-800 font-semibold">
                                                {formatDate(
                                                    unit.updated_at
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </>

                    )}

                </div>

                {/* =================================================
                    FOOTER
                ================================================== */}
                <div className="border-t border-gray-200 p-5 bg-[#f8f7f5]">

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
    );
};

export default DetailUnit;