import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    FaSave,
    FaUserTie,
    FaPhone,
    FaMapMarkerAlt,
    FaMoneyBillWave,
} from "react-icons/fa";

import { MdClose } from "react-icons/md";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const AddOwner = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        balance_opening: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const nameRef = useRef(null);
    const phoneRef = useRef(null);
    const addressRef = useRef(null);
    const balanceRef = useRef(null);

    useEffect(() => {
        if (nameRef.current) {
            nameRef.current.focus();
        }
    }, []);

    // ---------------------------------------------------------
    // Filled states
    // ---------------------------------------------------------
    const isNameFilled = formData.name.trim() !== "";
    const isPhoneFilled = formData.phone.trim() !== "";
    const isAddressFilled = formData.address.trim() !== "";
    const isBalanceFilled =
        String(formData.balance_opening).trim() !== "";

    // ---------------------------------------------------------
    // Border
    // ---------------------------------------------------------
    const getFieldBorderColor = (filled, error) => {
        if (error) return "#ef4444";
        if (filled) return "#a47d52";
        return "#ef4444";
    };

    const getIndicatorColor = (filled, error) => {
        if (error) return "bg-red-500";
        if (filled) return "bg-[#a47d52]";
        return "bg-red-500";
    };

    // ---------------------------------------------------------
    // Change
    // ---------------------------------------------------------
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    // ---------------------------------------------------------
    // Enter navigation
    // ---------------------------------------------------------
    const handleKeyDown = (e, nextRef) => {
        if (e.key === "Enter" && nextRef?.current) {
            e.preventDefault();
            nextRef.current.focus();
        }
    };

    // ---------------------------------------------------------
    // Submit
    // ---------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "اسم المالك مطلوب";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "رقم الهاتف مطلوب";
        }

        if (!formData.address.trim()) {
            newErrors.address = "العنوان مطلوب";
        }

        if (
            formData.balance_opening !== "" &&
            Number.isNaN(Number(formData.balance_opening))
        ) {
            newErrors.balance_opening =
                "يرجى إدخال قيمة مالية صحيحة";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.warning("يرجى تعبئة جميع الحقول المطلوبة");
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                toast.error("يرجى تسجيل الدخول");
                return;
            }

            const requestData = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                balance_opening:
                    formData.balance_opening === ""
                        ? 0
                        : Number(formData.balance_opening),
            };

            console.log("Creating owner:", requestData);

            const response = await fetch(
                `${BASE}/api/owners/create/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestData),
                }
            );

            const responseText = await response.text();

            let data;

            try {
                data = responseText
                    ? JSON.parse(responseText)
                    : null;
            } catch {
                data = null;
            }

            if (!response.ok) {
                let errorMessage = "حدث خطأ أثناء إضافة المالك";

                if (data && typeof data === "object") {
                    errorMessage =
                        data.detail ||
                        data.message ||
                        Object.entries(data)
                            .map(
                                ([field, messages]) =>
                                    `${field}: ${
                                        Array.isArray(messages)
                                            ? messages.join(", ")
                                            : messages
                                    }`
                            )
                            .join("; ") ||
                        errorMessage;
                }

                throw new Error(errorMessage);
            }

            toast.success("✅ تم إضافة المالك بنجاح");

            if (onSuccess) {
                onSuccess(data);
            }

            onClose();
        } catch (error) {
            console.error("Error creating owner:", error);
            toast.error(
                `❌ ${error.message || "حدث خطأ أثناء إضافة المالك"}`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                dir="rtl"
            >
                {/* =================================================
                    HEADER
                ================================================== */}
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
                                إضافة مالك جديد
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                إدخال بيانات المالك
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="text-red-600 cursor-pointer hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <MdClose size={28} />
                    </button>
                </div>

                {/* =================================================
                    FORM
                ================================================== */}
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        {/* NAME */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                اسم المالك{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <div className="relative">
                                <input
                                    ref={nameRef}
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onKeyDown={(e) =>
                                        handleKeyDown(e, phoneRef)
                                    }
                                    placeholder="أدخل اسم المالك"
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                    style={{
                                        borderTopColor: "transparent",
                                        borderBottomColor: "white",
                                        borderLeftColor: "transparent",
                                        borderRightColor:
                                            getFieldBorderColor(
                                                isNameFilled,
                                                errors.name
                                            ),
                                        borderWidth: "2px",
                                        borderStyle: "solid",
                                        boxShadow: errors.name
                                            ? "0 0 0 3px rgba(239,68,68,.1)"
                                            : isNameFilled
                                            ? "0 0 0 3px rgba(164,125,82,.1)"
                                            : "0 0 0 3px rgba(239,68,68,.1)",
                                    }}
                                />

                                <div
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                        isNameFilled,
                                        errors.name
                                    )}`}
                                />
                            </div>

                            {errors.name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* PHONE */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                رقم الهاتف{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <div className="relative">
                                <input
                                    ref={phoneRef}
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    onKeyDown={(e) =>
                                        handleKeyDown(e, addressRef)
                                    }
                                    placeholder="أدخل رقم الهاتف"
                                    disabled={loading}
                                    dir="ltr"
                                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                    style={{
                                        borderTopColor: "transparent",
                                        borderBottomColor: "white",
                                        borderLeftColor: "transparent",
                                        borderRightColor:
                                            getFieldBorderColor(
                                                isPhoneFilled,
                                                errors.phone
                                            ),
                                        borderWidth: "2px",
                                        borderStyle: "solid",
                                        boxShadow: errors.phone
                                            ? "0 0 0 3px rgba(239,68,68,.1)"
                                            : isPhoneFilled
                                            ? "0 0 0 3px rgba(164,125,82,.1)"
                                            : "0 0 0 3px rgba(239,68,68,.1)",
                                    }}
                                />

                                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                                <div
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                        isPhoneFilled,
                                        errors.phone
                                    )}`}
                                />
                            </div>

                            {errors.phone && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        {/* ADDRESS */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                العنوان{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <div className="relative">
                                <textarea
                                    ref={addressRef}
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    onKeyDown={(e) =>
                                        handleKeyDown(e, balanceRef)
                                    }
                                    rows={3}
                                    placeholder="أدخل عنوان المالك"
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right resize-none"
                                    style={{
                                        borderTopColor: "transparent",
                                        borderBottomColor: "white",
                                        borderLeftColor: "transparent",
                                        borderRightColor:
                                            getFieldBorderColor(
                                                isAddressFilled,
                                                errors.address
                                            ),
                                        borderWidth: "2px",
                                        borderStyle: "solid",
                                    }}
                                />

                                <FaMapMarkerAlt className="absolute left-4 top-4 text-gray-400" />

                                <div
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                        isAddressFilled,
                                        errors.address
                                    )}`}
                                />
                            </div>

                            {errors.address && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        {/* OPENING BALANCE */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                الرصيد الافتتاحي
                            </label>

                            <div className="relative">
                                <input
                                    ref={balanceRef}
                                    type="number"
                                    step="0.01"
                                    name="balance_opening"
                                    value={formData.balance_opening}
                                    onChange={handleChange}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                    placeholder="0.00"
                                    disabled={loading}
                                    dir="ltr"
                                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                    style={{
                                        borderTopColor: "transparent",
                                        borderBottomColor: "white",
                                        borderLeftColor: "transparent",
                                        borderRightColor:
                                            getFieldBorderColor(
                                                isBalanceFilled,
                                                errors.balance_opening
                                            ),
                                        borderWidth: "2px",
                                        borderStyle: "solid",
                                    }}
                                />

                                <FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a47d52]" />

                                <div
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                        isBalanceFilled,
                                        errors.balance_opening
                                    )}`}
                                />
                            </div>

                            <p className="text-xs text-gray-500 mt-1">
                                يمكن ترك الحقل فارغاً إذا لم يوجد رصيد
                                افتتاحي.
                            </p>

                            {errors.balance_opening && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.balance_opening}
                                </p>
                            )}
                        </div>

                        {/* BUTTONS */}
                        <div className="flex gap-3 mt-10 border-t border-gray-200 pt-8">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 cursor-pointer font-extrabold bg-[#a47d52] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 disabled:opacity-50"
                            >
                                <FaSave size={18} />

                                {loading
                                    ? "جاري الحفظ..."
                                    : "إضافة المالك"}
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 cursor-pointer font-extrabold bg-gray-300 text-red-600 px-6 py-3 rounded-lg transition-all duration-300 hover:bg-gray-400"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddOwner;