import React, {
    useEffect,
    useState,
} from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    FaSave,
    FaTags,
    FaUserTie,
    FaBuilding,
    FaMapMarkerAlt,
    FaMapMarkedAlt,
} from "react-icons/fa";
import { MdClose } from "react-icons/md";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const EditCategory = ({
    categoryData,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState({
        owner: categoryData?.owner || "",
        name: categoryData?.name || "",
        type:
            categoryData?.type ||
            "building",
        status:
            categoryData?.status ||
            "residential",
        area: categoryData?.area || "",
        location:
            categoryData?.location || "",
    });

    const [owners, setOwners] = useState([]);
    const [loadingOwners, setLoadingOwners] =
        useState(false);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // ---------------------------------------------------------
    // Update form when category changes
    // ---------------------------------------------------------
    useEffect(() => {
        if (!categoryData) return;

        /*
         * Backend may return owner as:
         *
         * owner: 5
         *
         * or:
         *
         * owner: {
         *     id: 5,
         *     name: "..."
         * }
         *
         * Support both formats.
         */
        const ownerValue =
            categoryData?.owner &&
            typeof categoryData.owner === "object"
                ? categoryData.owner.id
                : categoryData?.owner || "";

        setFormData({
            owner: ownerValue,
            name:
                categoryData?.name || "",
            type:
                categoryData?.type ||
                "building",
            status:
                categoryData?.status ||
                "residential",
            area:
                categoryData?.area || "",
            location:
                categoryData?.location || "",
        });

        setErrors({});
    }, [categoryData?.id]);

    // ---------------------------------------------------------
    // Fetch owners
    // ---------------------------------------------------------
    useEffect(() => {
        const fetchOwners = async () => {
            setLoadingOwners(true);

            try {
                const token =
                    localStorage.getItem(
                        "access_token"
                    );

                if (!token) {
                    toast.error(
                        "يرجى تسجيل الدخول"
                    );
                    return;
                }

                const response =
                    await fetch(
                        `${BASE}/api/owners/`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                const responseText =
                    await response.text();

                let data = null;

                try {
                    data = responseText
                        ? JSON.parse(
                              responseText
                          )
                        : null;
                } catch {
                    data = null;
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            data?.detail ||
                            "فشل تحميل الملاك"
                    );
                }

                let ownersData = [];

                if (Array.isArray(data)) {
                    ownersData = data;
                } else if (
                    Array.isArray(
                        data?.owners
                    )
                ) {
                    ownersData =
                        data.owners;
                } else if (
                    Array.isArray(
                        data?.results
                    )
                ) {
                    ownersData =
                        data.results;
                } else if (
                    Array.isArray(
                        data?.data
                    )
                ) {
                    ownersData =
                        data.data;
                }

                setOwners(ownersData);
            } catch (error) {
                console.error(
                    "Error fetching owners:",
                    error
                );

                toast.error(
                    "❌ تعذر تحميل قائمة الملاك"
                );
            } finally {
                setLoadingOwners(false);
            }
        };

        fetchOwners();
    }, []);

    // ---------------------------------------------------------
    // Filled
    // ---------------------------------------------------------
    const isFilled = (value) =>
        String(value ?? "").trim() !== "";

    // ---------------------------------------------------------
    // Border
    // ---------------------------------------------------------
    const getFieldBorderColor = (
        filled,
        error
    ) => {
        if (error) return "#ef4444";
        if (filled) return "#a47d52";
        return "#ef4444";
    };

    const getIndicatorColor = (
        filled,
        error
    ) => {
        if (error) return "bg-red-500";
        if (filled)
            return "bg-[#a47d52]";
        return "bg-red-500";
    };

    // ---------------------------------------------------------
    // Change
    // ---------------------------------------------------------
    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

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
    // Backend error formatter
    // ---------------------------------------------------------
    const formatBackendErrors = (
        backendErrors
    ) => {
        if (
            !backendErrors ||
            typeof backendErrors !==
                "object"
        ) {
            return {};
        }

        const formattedErrors = {};

        Object.entries(
            backendErrors
        ).forEach(
            ([field, messages]) => {
                if (
                    Array.isArray(messages)
                ) {
                    formattedErrors[
                        field
                    ] = messages.join(
                        ", "
                    );
                } else if (
                    typeof messages ===
                    "string"
                ) {
                    formattedErrors[
                        field
                    ] = messages;
                } else {
                    formattedErrors[
                        field
                    ] = String(messages);
                }
            }
        );

        return formattedErrors;
    };

    // ---------------------------------------------------------
    // Submit
    // ---------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};

        if (
            !formData.name.trim()
        ) {
            newErrors.name =
                "اسم التصنيف مطلوب";
        }

        if (!formData.type) {
            newErrors.type =
                "نوع التصنيف مطلوب";
        }

        if (!formData.status) {
            newErrors.status =
                "حالة التصنيف مطلوبة";
        }

        if (
            Object.keys(newErrors)
                .length > 0
        ) {
            setErrors(newErrors);

            toast.warning(
                "يرجى تعبئة الحقول المطلوبة"
            );

            return;
        }

        if (!categoryData?.id) {
            toast.error(
                "تعذر تحديد التصنيف المراد تعديله"
            );
            return;
        }

        setLoading(true);

        try {
            const token =
                localStorage.getItem(
                    "access_token"
                );

            if (!token) {
                toast.error(
                    "يرجى تسجيل الدخول"
                );
                return;
            }

            // -------------------------------------------------
            // Request body
            // -------------------------------------------------
            const requestData = {
                name:
                    formData.name.trim(),

                type:
                    formData.type,

                status:
                    formData.status,

                area:
                    formData.area.trim(),

                location:
                    formData.location.trim(),

                owner: formData.owner
                    ? Number(
                          formData.owner
                      )
                    : null,
            };

            console.log(
                "Updating building/category:",
                categoryData.id,
                requestData
            );

            // -------------------------------------------------
            // IMPORTANT:
            // Backend endpoint is:
            // /api/buildings/<id>/update/
            // NOT:
            // /api/categories/<id>/update/
            // -------------------------------------------------
            const response =
                await fetch(
                    `${BASE}/api/buildings/${categoryData.id}/update/`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(
                            requestData
                        ),
                    }
                );

            const responseText =
                await response.text();

            let data = null;

            try {
                data =
                    responseText
                        ? JSON.parse(
                              responseText
                          )
                        : null;
            } catch {
                data = null;
            }

            // -------------------------------------------------
            // Backend error
            // -------------------------------------------------
            if (!response.ok) {
                const backendErrors =
                    formatBackendErrors(
                        data?.errors
                    );

                if (
                    Object.keys(
                        backendErrors
                    ).length > 0
                ) {
                    setErrors(
                        backendErrors
                    );
                }

                let errorMessage =
                    data?.message ||
                    data?.detail ||
                    "حدث خطأ أثناء تعديل التصنيف";

                if (
                    Object.keys(
                        backendErrors
                    ).length > 0
                ) {
                    errorMessage =
                        Object.values(
                            backendErrors
                        ).join("، ");
                }

                throw new Error(
                    errorMessage
                );
            }

            // -------------------------------------------------
            // Success
            // Backend response:
            // {
            //     message: "...",
            //     building: {...}
            // }
            // -------------------------------------------------
            console.log(
                "Building/category updated successfully:",
                data?.building
            );

            toast.success(
                data?.message ||
                    "✅ تم تعديل التصنيف بنجاح"
            );

            // Send the updated building object
            // to the parent when available.
            if (onSuccess) {
                onSuccess(
                    data?.building ||
                        data
                );
            }

            onClose();
        } catch (error) {
            console.error(
                "Error updating category:",
                error
            );

            toast.error(
                `❌ ${
                    error?.message ||
                    "حدث خطأ أثناء تعديل التصنيف"
                }`
            );
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // Input style
    // ---------------------------------------------------------
    const fieldStyle = (
        fieldName,
        value
    ) => ({
        borderTopColor:
            "transparent",

        borderBottomColor:
            "white",

        borderLeftColor:
            "transparent",

        borderRightColor:
            getFieldBorderColor(
                isFilled(value),
                errors[fieldName]
            ),

        borderWidth: "2px",

        borderStyle: "solid",

        boxShadow:
            errors[fieldName]
                ? "0 0 0 3px rgba(239,68,68,.1)"
                : isFilled(value)
                ? "0 0 0 3px rgba(164,125,82,.1)"
                : "0 0 0 3px rgba(239,68,68,.1)",
    });

    if (!categoryData) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto"
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
                                تعديل التصنيف
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                تعديل بيانات التصنيف العقاري
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
                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >
                        {/* NAME */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                اسم التصنيف{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <div className="relative">
                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        formData.name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="أدخل اسم التصنيف"
                                    disabled={
                                        loading
                                    }
                                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                    style={fieldStyle(
                                        "name",
                                        formData.name
                                    )}
                                />

                                <FaTags className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                                <div
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                        isFilled(
                                            formData.name
                                        ),
                                        errors.name
                                    )}`}
                                />
                            </div>

                            {errors.name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {
                                        errors.name
                                    }
                                </p>
                            )}
                        </div>

                        {/* TYPE + STATUS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            {/* Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    نوع التصنيف{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <div className="relative">
                                    <select
                                        name="type"
                                        value={
                                            formData.type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            loading
                                        }
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right appearance-none"
                                        style={fieldStyle(
                                            "type",
                                            formData.type
                                        )}
                                    >
                                        <option value="building">
                                            مبنى
                                        </option>

                                        <option value="vila">
                                            فيلا
                                        </option>
                                    </select>

                                    <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isFilled(
                                                formData.type
                                            ),
                                            errors.type
                                        )}`}
                                    />
                                </div>

                                {errors.type && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {
                                            errors.type
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    حالة التصنيف{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <div className="relative">
                                    <select
                                        name="status"
                                        value={
                                            formData.status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            loading
                                        }
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right appearance-none"
                                        style={fieldStyle(
                                            "status",
                                            formData.status
                                        )}
                                    >
                                        <option value="residential">
                                            سكني
                                        </option>

                                        <option value="commercial">
                                            تجاري
                                        </option>
                                    </select>

                                    <FaTags className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isFilled(
                                                formData.status
                                            ),
                                            errors.status
                                        )}`}
                                    />
                                </div>

                                {errors.status && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {
                                            errors.status
                                        }
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* AREA + LOCATION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            {/* Area */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    المنطقة
                                </label>

                                <div className="relative">
                                    <input
                                        type="text"
                                        name="area"
                                        value={
                                            formData.area
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="أدخل المنطقة"
                                        disabled={
                                            loading
                                        }
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={fieldStyle(
                                            "area",
                                            formData.area
                                        )}
                                    />

                                    <FaMapMarkedAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isFilled(
                                                formData.area
                                            ),
                                            errors.area
                                        )}`}
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    الموقع
                                </label>

                                <div className="relative">
                                    <input
                                        type="text"
                                        name="location"
                                        value={
                                            formData.location
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="أدخل الموقع"
                                        disabled={
                                            loading
                                        }
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={fieldStyle(
                                            "location",
                                            formData.location
                                        )}
                                    />

                                    <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <div
                                        className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                            isFilled(
                                                formData.location
                                            ),
                                            errors.location
                                        )}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* OWNER */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                المالك
                            </label>

                            <div className="relative">
                                <select
                                    name="owner"
                                    value={
                                        formData.owner
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        loading ||
                                        loadingOwners
                                    }
                                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right appearance-none"
                                    style={fieldStyle(
                                        "owner",
                                        formData.owner
                                    )}
                                >
                                    <option value="">
                                        بدون مالك
                                    </option>

                                    {owners.map(
                                        (
                                            owner
                                        ) => (
                                            <option
                                                key={
                                                    owner.id
                                                }
                                                value={
                                                    owner.id
                                                }
                                            >
                                                {owner.name ||
                                                    `مالك #${owner.id}`}
                                                {owner.phone
                                                    ? ` - ${owner.phone}`
                                                    : ""}
                                            </option>
                                        )
                                    )}
                                </select>

                                <FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />

                                <div
                                    className={`absolute right-0 top-0 h-full w-1 rounded-r-lg ${getIndicatorColor(
                                        isFilled(
                                            formData.owner
                                        ),
                                        errors.owner
                                    )}`}
                                />
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div className="flex gap-3 mt-10 border-t border-gray-200 pt-8">
                            <button
                                type="submit"
                                disabled={
                                    loading
                                }
                                className="flex-1 flex items-center justify-center gap-2 cursor-pointer font-extrabold bg-[#a47d52] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 disabled:opacity-50"
                            >
                                <FaSave
                                    size={18}
                                />

                                {loading
                                    ? "جاري الحفظ..."
                                    : "حفظ التعديلات"}
                            </button>

                            <button
                                type="button"
                                onClick={
                                    onClose
                                }
                                disabled={
                                    loading
                                }
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

export default EditCategory;
