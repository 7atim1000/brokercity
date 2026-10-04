import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    FaUserTie,
    FaPhone,
    FaIdCard,
    FaEnvelope,
    FaMoneyBillWave,
    FaGlobe,
    FaCheckCircle,
} from "react-icons/fa";

import { MdClose } from "react-icons/md";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const DetailRental = ({
    rentalId,
    rental: passedRental,
    onClose,
}) => {
    const [rental, setRental] = useState(passedRental || null);
    const [loading, setLoading] = useState(!passedRental);

    useEffect(() => {
        let cancelled = false;

        const loadRental = async () => {
            if (passedRental) {
                setRental(passedRental);
                setLoading(false);
                return;
            }

            if (!rentalId) {
                toast.error("معرف المستأجر غير موجود");
                setLoading(false);
                return;
            }

            try {
                const token =
                    localStorage.getItem("access_token");

                const response = await fetch(
                    `${BASE}/api/rentals/${rentalId}/`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "فشل تحميل بيانات المستأجر"
                    );
                }

                const data = await response.json();
                const loadedRental = data?.rental || data;

                if (!cancelled) {
                    setRental(loadedRental);
                }
            } catch (error) {
                console.error(
                    "Error loading rental:",
                    error
                );

                if (!cancelled) {
                    toast.error(
                        error.message ||
                            "حدث خطأ أثناء تحميل البيانات"
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadRental();

        return () => {
            cancelled = true;
        };
    }, [rentalId, passedRental]);

    const formatAmount = (amount) => {
        const number = Number(amount || 0);

        return number.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // ---------------------------------------------------------
    // Info Row
    // ---------------------------------------------------------
    const InfoRow = ({ icon, label, value, dir }) => (
        <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-200 hover:border-[#a47d52] transition-all duration-200">
            <div className="w-10 h-10 rounded-lg bg-[#f8f7f5] text-[#a47d52] flex items-center justify-center shrink-0">
                {icon}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">
                    {label}
                </p>

                <p
                    className="font-bold text-gray-800 break-words"
                    dir={dir || "rtl"}
                >
                    {value || "-"}
                </p>
            </div>
        </div>
    );

    // ---------------------------------------------------------
    // Loading
    // ---------------------------------------------------------
    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-gray-200 border-t-[#a47d52] animate-spin" />

                    <p className="font-bold text-gray-700">
                        جاري تحميل بيانات المستأجر...
                    </p>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------
    // Not found
    // ---------------------------------------------------------
    if (!rental) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                    <p className="font-bold text-gray-700 mb-4">
                        لم يتم العثور على المستأجر
                    </p>

                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-[#a47d52] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#8a6a44] transition"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                dir="rtl"
            >
                {/* HEADER */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-[#f8f7f5] z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#e9e6e1] flex items-center justify-center">
                            <FaUserTie
                                className="text-[#a47d52]"
                                size={21}
                            />
                        </div>

                        <div>
                            <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                                تفاصيل المستأجر
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                عرض كامل بيانات المستأجر
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

                {/* BODY */}
                <div className="p-6">

                    {/* Hero Card */}
                    <div className="rounded-xl bg-[#a47d52]/10 border border-[#a47d52]/30 p-6 mb-6">

                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">

                            <div className="w-20 h-20 rounded-full bg-[#a47d52] text-white flex items-center justify-center shrink-0 shadow-lg">

                                <FaUserTie size={32} />

                            </div>

                            <div className="text-center sm:text-right flex-1">

                                <p className="text-xs text-gray-500 mb-1">
                                    المستأجر
                                </p>

                                <h2 className="text-2xl font-extrabold text-gray-800">
                                    {rental.name || "بدون اسم"}
                                </h2>

                                {rental.nationality && (
                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2 justify-center sm:justify-start">
                                        <FaGlobe className="text-[#a47d52]" />
                                        {rental.nationality}
                                    </p>
                                )}

                                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                    <FaCheckCircle />
                                    مستأجر نشط
                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Contact Info */}
                    <div className="mb-6">

                        <h4 className="font-extrabold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#a47d52] rounded-full" />
                            معلومات التواصل
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <InfoRow
                                icon={<FaPhone />}
                                label="رقم الهاتف 1"
                                value={rental.phone_1}
                                dir="ltr"
                            />

                            <InfoRow
                                icon={<FaPhone />}
                                label="رقم الهاتف 2"
                                value={rental.phone_2}
                                dir="ltr"
                            />

                            <InfoRow
                                icon={<FaIdCard />}
                                label="رقم الهوية"
                                value={rental.id_number}
                                dir="ltr"
                            />

                            <InfoRow
                                icon={<FaEnvelope />}
                                label="البريد الإلكتروني"
                                value={rental.email}
                                dir="ltr"
                            />

                        </div>

                    </div>

                    {/* Financial Info */}
                    <div className="mb-6">

                        <h4 className="font-extrabold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#a47d52] rounded-full" />
                            المعلومات المالية
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="rounded-xl p-5 border-2 bg-blue-50 border-blue-200">

                                <div className="flex items-center gap-3 mb-2">

                                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <FaMoneyBillWave />
                                    </div>

                                    <p className="text-xs font-bold text-blue-700">
                                        رصيد التأمين
                                    </p>

                                </div>

                                <p
                                    className="text-2xl font-extrabold text-blue-800"
                                    dir="ltr"
                                >
                                    {formatAmount(
                                        rental.insurance_balance
                                    )}
                                </p>

                            </div>

                            <div className="rounded-xl p-5 border-2 bg-green-50 border-green-200">

                                <div className="flex items-center gap-3 mb-2">

                                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                        <FaMoneyBillWave />
                                    </div>

                                    <p className="text-xs font-bold text-green-700">
                                        الرصيد الحالي
                                    </p>

                                </div>

                                <p
                                    className="text-2xl font-extrabold text-green-800"
                                    dir="ltr"
                                >
                                    {formatAmount(rental.balance)}
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* Close */}
                    <div className="flex justify-end border-t border-gray-200 pt-6">

                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer font-extrabold bg-gray-300 text-gray-700 px-8 py-3 rounded-lg transition-all duration-300 hover:bg-gray-400"
                        >
                            إغلاق
                        </button>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default DetailRental;