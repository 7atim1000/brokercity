import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    FaUserTie,
    FaPhone,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaCalendarAlt,
} from "react-icons/fa";

import { MdClose } from "react-icons/md";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const DetailOwner = ({ ownerData, onClose }) => {
    const [owner, setOwner] = useState(ownerData || null);
    const [loading, setLoading] = useState(true);

    // ---------------------------------------------------------
    // Fetch complete owner details
    // ---------------------------------------------------------
    useEffect(() => {
        const fetchOwnerDetails = async () => {
            if (!ownerData?.id) {
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
                    `${BASE}/api/owners/${ownerData.id}/`,
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

                console.log("Owner details:", data);

                // API can return { owner: {...} }
                setOwner(data?.owner || data);
            } catch (error) {
                console.error(
                    "Error fetching owner details:",
                    error
                );

                toast.error(
                    "❌ حدث خطأ أثناء جلب تفاصيل المالك"
                );

                // Keep original data if detail endpoint fails
                setOwner(ownerData);
            } finally {
                setLoading(false);
            }
        };

        fetchOwnerDetails();
    }, [ownerData?.id]);

    // ---------------------------------------------------------
    // Format amount
    // ---------------------------------------------------------
    const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // ---------------------------------------------------------
    // Date
    // ---------------------------------------------------------
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

    if (!owner) {
        return null;
    }

    const balance = Number(owner.balance || 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                dir="rtl"
            >
                {/* =================================================
                    HEADER
                ================================================== */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-[#f8f7f5] z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#e9e6e1] flex items-center justify-center">
                            <FaUserTie
                                className="text-[#a47d52]"
                                size={24}
                            />
                        </div>

                        <div>
                            <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                                تفاصيل المالك
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                عرض جميع بيانات المالك
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
                            {/* OWNER NAME CARD */}
                            <div className="bg-[#f8f7f5] rounded-xl p-5 mb-5 border border-[#e9e6e1]">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-[#a47d52] flex items-center justify-center">
                                        <FaUserTie
                                            className="text-white"
                                            size={25}
                                        />
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            اسم المالك
                                        </p>

                                        <h4 className="text-2xl font-extrabold text-gray-800">
                                            {owner.name || "-"}
                                        </h4>
                                    </div>
                                </div>
                            </div>

                            {/* DATA GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* PHONE */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FaPhone className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            رقم الهاتف
                                        </span>
                                    </div>

                                    <p
                                        className="text-gray-800 font-semibold"
                                        dir="ltr"
                                    >
                                        {owner.phone || "-"}
                                    </p>
                                </div>

                                {/* ADDRESS */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FaMapMarkerAlt className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            العنوان
                                        </span>
                                    </div>

                                    <p className="text-gray-800 font-semibold">
                                        {owner.address || "-"}
                                    </p>
                                </div>

                                {/* OPENING BALANCE */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FaMoneyBillWave className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            الرصيد الافتتاحي
                                        </span>
                                    </div>

                                    <p
                                        className="text-gray-800 font-bold text-lg"
                                        dir="ltr"
                                    >
                                        {formatAmount(
                                            owner.balance_opening
                                        )}
                                    </p>
                                </div>

                                {/* CURRENT BALANCE */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FaMoneyBillWave className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            الرصيد الحالي
                                        </span>
                                    </div>

                                    <p
                                        dir="ltr"
                                        className={`font-extrabold text-xl ${
                                            balance > 0
                                                ? "text-green-600"
                                                : balance < 0
                                                ? "text-red-600"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {formatAmount(balance)}
                                    </p>
                                </div>

                                {/* CREATED */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FaCalendarAlt className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            تاريخ الإنشاء
                                        </span>
                                    </div>

                                    <p className="text-gray-800 font-semibold">
                                        {formatDate(owner.created_at)}
                                    </p>
                                </div>

                                {/* UPDATED */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FaCalendarAlt className="text-[#a47d52]" />

                                        <span className="text-sm font-bold text-gray-600">
                                            آخر تحديث
                                        </span>
                                    </div>

                                    <p className="text-gray-800 font-semibold">
                                        {formatDate(owner.updated_at)}
                                    </p>
                                </div>
                            </div>

                            {/* BALANCE SUMMARY */}
                            <div className="mt-5 bg-[#e9e6e1] rounded-xl p-5">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            الرصيد الحالي
                                        </p>

                                        <p
                                            dir="ltr"
                                            className={`text-2xl font-extrabold mt-1 ${
                                                balance > 0
                                                    ? "text-green-600"
                                                    : balance < 0
                                                    ? "text-red-600"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {formatAmount(balance)}
                                        </p>
                                    </div>

                                    <FaMoneyBillWave
                                        className="text-[#a47d52]"
                                        size={35}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* FOOTER */}
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

export default DetailOwner;