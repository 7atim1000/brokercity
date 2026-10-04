import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    FaSave,
    FaUserTie,
    FaPhone,
    FaIdCard,
    FaEnvelope,
    FaMoneyBillWave,
    FaGlobe,
} from "react-icons/fa";

import { MdClose } from "react-icons/md";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const AddRental = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: "",
        nationality: "",
        phone_1: "",
        phone_2: "",
        id_number: "",
        email: "",
        insurance_balance: "",
        balance: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const nameRef = useRef(null);
    const nationalityRef = useRef(null);
    const phone1Ref = useRef(null);
    const phone2Ref = useRef(null);
    const idNumberRef = useRef(null);
    const emailRef = useRef(null);
    const insuranceRef = useRef(null);
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
    const isNationalityFilled =
        formData.nationality.trim() !== "";
    const isPhone1Filled = formData.phone_1.trim() !== "";
    const isPhone2Filled = formData.phone_2.trim() !== "";
    const isIdNumberFilled = formData.id_number.trim() !== "";
    const isEmailFilled = formData.email.trim() !== "";
    const isInsuranceFilled =
        String(formData.insurance_balance).trim() !== "";
    const isBalanceFilled =
        String(formData.balance).trim() !== "";

    // ---------------------------------------------------------
    // Border / indicator helpers
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

    const getFieldBoxShadow = (filled, error) => {
        if (error) return "0 0 0 3px rgba(239,68,68,.1)";
        if (filled) return "0 0 0 3px rgba(164,125,82,.1)";
        return "0 0 0 3px rgba(239,68,68,.1)";
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
            newErrors.name = "اسم المستأجر مطلوب";
        }

        if (
            formData.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                formData.email.trim()
            )
        ) {
            newErrors.email = "يرجى إدخال بريد إلكتروني صحيح";
        }

        if (
            formData.insurance_balance !== "" &&
            Number.isNaN(Number(formData.insurance_balance))
        ) {
            newErrors.insurance_balance =
                "يرجى إدخال قيمة مالية صحيحة";
        }

        if (
            formData.balance !== "" &&
            Number.isNaN(Number(formData.balance))
        ) {
            newErrors.balance =
                "يرجى إدخال قيمة مالية صحيحة";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.warning("يرجى مراجعة البيانات المدخلة");
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
                name: formData.name.trim() || null,
                nationality:
                    formData.nationality.trim() || null,
                phone_1: formData.phone_1.trim() || null,
                phone_2: formData.phone_2.trim() || null,
                id_number: formData.id_number.trim() || null,
                email: formData.email.trim() || null,
                insurance_balance:
                    formData.insurance_balance === ""
                        ? 0
                        : Number(formData.insurance_balance),
                balance:
                    formData.balance === ""
                        ? 0
                        : Number(formData.balance),
            };

            const response = await fetch(
                `${BASE}/api/rentals/create/`,
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
                let errorMessage =
                    "حدث خطأ أثناء إضافة المستأجر";

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

            toast.success("✅ تم إضافة المستأجر بنجاح");

            if (onSuccess) {
                onSuccess(data);
            }

            onClose();
        } catch (error) {
            console.error("Error creating rental:", error);
            toast.error(
                `❌ ${error.message || "حدث خطأ أثناء إضافة المستأجر"}`
            );
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // Reusable style object
    // ---------------------------------------------------------
    const fieldStyle = (filled, error) => ({
        borderTopColor: "transparent",
        borderBottomColor: "white",
        borderLeftColor: "transparent",
        borderRightColor: getFieldBorderColor(filled, error),
        borderWidth: "2px",
        borderStyle: "solid",
        boxShadow: getFieldBoxShadow(filled, error),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
                                إضافة مستأجر جديد
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                إدخال بيانات المستأجر
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

                {/* FORM */}
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* NAME */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    اسم المستأجر{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <div className="relative">
                                    <input
                                        ref={nameRef}
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(
                                                e,
                                                nationalityRef
                                            )
                                        }
                                        placeholder="أدخل اسم المستأجر"
                                        disabled={loading}
                                        className="w-full px-4 py-3 bg-white rounded-sm focus:outline-none transition-all duration-300 text-right"
                                        style={fieldStyle(
                                            isNameFilled,
                                            errors.name
                                        )}
                                    />

                                    <FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

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

                            {/* NATIONALITY */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    الجنسية
                                </label>

                                <div className="relative">
                                    <input
                                        ref={nationalityRef}
                                        type="text"
                                        name="nationality"
                                        value={formData.nationality}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(
                                                e,
                                                phone1Ref
                                            )
                                        }
                                        placeholder="أدخل الجنسية"
                                        disabled={loading}
                                        className="w-full px-4 py-3 bg-white rounded-sm focus:outline-none transition-all duration-300 text-right"
                                        style={fieldStyle(
                                            isNationalityFilled,
                                            errors.nationality
                                        )}
                                    />

                                    <FaGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isNationalityFilled,
                                            errors.nationality
                                        )}`}
                                    />
                                </div>
                            </div>

                            {/* PHONE 1 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    رقم الهاتف 1
                                </label>

                                <div className="relative">
                                    <input
                                        ref={phone1Ref}
                                        type="tel"
                                        name="phone_1"
                                        value={formData.phone_1}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(
                                                e,
                                                phone2Ref
                                            )
                                        }
                                        placeholder="أدخل رقم الهاتف الأول"
                                        disabled={loading}
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-white rounded-sm focus:outline-none transition-all duration-300 text-right"
                                        style={fieldStyle(
                                            isPhone1Filled,
                                            errors.phone_1
                                        )}
                                    />

                                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isPhone1Filled,
                                            errors.phone_1
                                        )}`}
                                    />
                                </div>
                            </div>

                            {/* PHONE 2 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    رقم الهاتف 2
                                </label>

                                <div className="relative">
                                    <input
                                        ref={phone2Ref}
                                        type="tel"
                                        name="phone_2"
                                        value={formData.phone_2}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(
                                                e,
                                                idNumberRef
                                            )
                                        }
                                        placeholder="أدخل رقم الهاتف الثاني"
                                        disabled={loading}
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-white rounded-sm focus:outline-none transition-all duration-300 text-right"
                                        style={fieldStyle(
                                            isPhone2Filled,
                                            errors.phone_2
                                        )}
                                    />

                                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isPhone2Filled,
                                            errors.phone_2
                                        )}`}
                                    />
                                </div>
                            </div>

                            {/* ID NUMBER */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    رقم الهوية
                                </label>

                                <div className="relative">
                                    <input
                                        ref={idNumberRef}
                                        type="text"
                                        name="id_number"
                                        value={formData.id_number}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(
                                                e,
                                                emailRef
                                            )
                                        }
                                        placeholder="أدخل رقم الهوية"
                                        disabled={loading}
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-white rounded-sm focus:outline-none transition-all duration-300 text-right"
                                        style={fieldStyle(
                                            isIdNumberFilled,
                                            errors.id_number
                                        )}
                                    />

                                    <FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isIdNumberFilled,
                                            errors.id_number
                                        )}`}
                                    />
                                </div>
                            </div>

                            {/* EMAIL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    البريد الإلكتروني
                                </label>

                                <div className="relative">
                                    <input
                                        ref={emailRef}
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(
                                                e,
                                                insuranceRef
                                            )
                                        }
                                        placeholder="example@mail.com"
                                        disabled={loading}
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-white rounded-sm focus:outline-none transition-all duration-300 text-right"
                                        style={fieldStyle(
                                            isEmailFilled,
                                            errors.email
                                        )}
                                    />

                                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isEmailFilled,
                                            errors.email
                                        )}`}
                                    />
                                </div>

                                {errors.email && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* INSURANCE BALANCE */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    رصيد التأمين
                                </label>

                                <div className="relative">
                                    <input
                                        ref={insuranceRef}
                                        type="number"
                                        step="0.01"
                                        name="insurance_balance"
                                        value={
                                            formData.insurance_balance
                                        }
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(
                                                e,
                                                balanceRef
                                            )
                                        }
                                        placeholder="0.00"
                                        disabled={loading}
                                        dir="ltr"
                                        className="w-full px-4 py-3 bg-white rounded-sm focus:outline-none transition-all duration-300 text-right"
                                        style={fieldStyle(
                                            isInsuranceFilled,
                                            errors.insurance_balance
                                        )}
                                    />

                                    <FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a47d52]" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isInsuranceFilled,
                                            errors.insurance_balance
                                        )}`}
                                    />
                                </div>

                                {errors.insurance_balance && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.insurance_balance}
                                    </p>
                                )}
                            </div>

                            {/* BALANCE */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    الرصيد
                                </label>

                                <div className="relative">
                                    <input
                                        ref={balanceRef}
                                        type="number"
                                        step="0.01"
                                        name="balance"
                                        value={formData.balance}
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
                                        className="w-full px-4 py-3 bg-white rounded-sm focus:outline-none transition-all duration-300 text-right"
                                        style={fieldStyle(
                                            isBalanceFilled,
                                            errors.balance
                                        )}
                                    />

                                    <FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a47d52]" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isBalanceFilled,
                                            errors.balance
                                        )}`}
                                    />
                                </div>

                                {errors.balance && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.balance}
                                    </p>
                                )}
                            </div>
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
                                    : "إضافة المستأجر"}
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

export default AddRental;