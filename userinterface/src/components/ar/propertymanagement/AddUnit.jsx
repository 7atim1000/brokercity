import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    FaSave,
    FaBuilding,
    FaMapMarkerAlt,
    FaUserTie,
    FaImages,
    FaSearch,
    FaUpload,
    FaTrash,
    FaChevronLeft,
    FaChevronRight,
    FaCheck,
} from "react-icons/fa";

import { MdClose } from "react-icons/md";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const FLOOR_OPTIONS = [
    { value: "first", label: "الأول" },
    { value: "second", label: "الثاني" },
    { value: "third", label: "الثالث" },
    { value: "forth", label: "الرابع" },
    { value: "fifth", label: "الخامس" },
    { value: "sixth", label: "السادس" },
    { value: "seventh", label: "السابع" },
    { value: "eighth", label: "الثامن" },
    { value: "ninth", label: "التاسع" },
    { value: "tenth", label: "العاشر" },
];

const AddUnit = ({ onClose, onSuccess }) => {
    /* =========================================================
       TABS
    ========================================================= */

    const [activeTab, setActiveTab] = useState("main");

    /* =========================================================
       DATA
    ========================================================= */

    const [categories, setCategories] = useState([]);

    const [loadingData, setLoadingData] = useState(true);
    const [loading, setLoading] = useState(false);

    const [categorySearch, setCategorySearch] = useState("");

    /* =========================================================
       FORM DATA
    ========================================================= */

    const [formData, setFormData] = useState({
        category: "",

        name: "",
        type: "apartment",
        status: "available",
        floor: "first",

        price: "",

        // These are inherited from Category.
        // They are NOT submitted to Unit.
        location: "",
        area: "",

        bedrooms: "",
        bathrooms: "",

        has_parking: false,
        parking: "",

        furnished: false,
        unfurnished: false,

        image_1: null,
        image_2: null,
        image_3: null,
        image_4: null,
    });

    /* =========================================================
       ERRORS
    ========================================================= */

    const [errors, setErrors] = useState({});

    /* =========================================================
       IMAGE PREVIEWS
    ========================================================= */

    const [imagePreviews, setImagePreviews] = useState({
        image_1: null,
        image_2: null,
        image_3: null,
        image_4: null,
    });

    /* =========================================================
       CATEGORY HELPERS
    ========================================================= */

    const getCategoryName = (category) => {
        if (!category) return "-";

        if (typeof category === "string") {
            return category;
        }

        return (
            category?.name ||
            category?.title ||
            category?.category_name ||
            `Category #${category?.id || ""}`
        );
    };

    const getCategoryOwner = (category) => {
        if (!category || typeof category === "string") {
            return null;
        }

        return (
            category?.owner_details ||
            category?.owner ||
            null
        );
    };

    const getOwnerName = (category) => {
        const owner = getCategoryOwner(category);

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

    const getOwnerPhone = (category) => {
        const owner = getCategoryOwner(category);

        if (!owner || typeof owner === "string") {
            return "";
        }

        return (
            owner?.phone ||
            owner?.mobile ||
            owner?.phone_number ||
            ""
        );
    };

    const getCategoryLocation = (category) => {
        if (!category || typeof category === "string") {
            return "";
        }

        return (
            category?.location ||
            category?.location_name ||
            ""
        );
    };

    const getCategoryArea = (category) => {
        if (!category || typeof category === "string") {
            return "";
        }

        return (
            category?.area ||
            category?.area_name ||
            ""
        );
    };

    const selectedCategory = useMemo(() => {
        if (!formData.category) {
            return null;
        }

        return (
            categories.find(
                (category) =>
                    String(category?.id) ===
                    String(formData.category)
            ) || null
        );
    }, [categories, formData.category]);

    /* =========================================================
       FETCH CATEGORIES
    ========================================================= */

    useEffect(() => {
        let cancelled = false;

        const fetchCategories = async () => {
            setLoadingData(true);

            try {
                const token =
                    localStorage.getItem("access_token");

                const response = await fetch(
                    `${BASE}/api/buildings/`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                let responseData = {};

                try {
                    responseData = await response.json();
                } catch {
                    responseData = {};
                }

                if (!response.ok) {
                    throw new Error(
                        responseData?.message ||
                        "Failed to fetch buildings."
                    );
                }

                if (cancelled) {
                    return;
                }

                const extractedCategories =
                    Array.isArray(responseData)
                        ? responseData
                        : responseData?.buildings ||
                          responseData?.data ||
                          responseData?.results ||
                          [];

                setCategories(extractedCategories);

            } catch (error) {
                console.error(
                    "Error fetching categories:",
                    error
                );

                if (!cancelled) {
                    toast.error(
                        error.message ||
                        "حدث خطأ أثناء تحميل التصنيفات."
                    );
                }

            } finally {
                if (!cancelled) {
                    setLoadingData(false);
                }
            }
        };

        fetchCategories();

        return () => {
            cancelled = true;
        };
    }, []);

    /* =========================================================
       CATEGORY SEARCH
    ========================================================= */

    const filteredCategories = useMemo(() => {
        const search =
            categorySearch.trim().toLowerCase();

        if (!search) {
            return categories;
        }

        return categories.filter((category) => {
            const categoryName =
                String(
                    getCategoryName(category)
                ).toLowerCase();

            const ownerName =
                String(
                    getOwnerName(category)
                ).toLowerCase();

            const ownerPhone =
                String(
                    getOwnerPhone(category)
                ).toLowerCase();

            const location =
                String(
                    getCategoryLocation(category)
                ).toLowerCase();

            const area =
                String(
                    getCategoryArea(category)
                ).toLowerCase();

            return (
                categoryName.includes(search) ||
                ownerName.includes(search) ||
                ownerPhone.includes(search) ||
                location.includes(search) ||
                area.includes(search)
            );
        });
    }, [categories, categorySearch]);

    /* =========================================================
       CATEGORY SELECT
    ========================================================= */

    const handleCategorySelect = (category) => {
        if (!category) {
            return;
        }

        const categoryId = category?.id;

        setFormData((prev) => ({
            ...prev,

            // This is the ONLY category relationship
            // submitted to Unit.
            category: categoryId,

            // These are inherited only for display.
            location: getCategoryLocation(category),
            area: getCategoryArea(category),
        }));

        setErrors((prev) => ({
            ...prev,
            category: "",
        }));
    };

    /* =========================================================
       INPUT HANDLER
    ========================================================= */

    const handleChange = (e) => {
        const {
            name,
            value,
            type,
            checked,
        } = e.target;

        const newValue =
            type === "checkbox"
                ? checked
                : value;

        /*
         * Category needs special handling because
         * location and area come from Category.
         */
        if (name === "category") {
            const category =
                categories.find(
                    (item) =>
                        String(item?.id) ===
                        String(value)
                );

            if (category) {
                handleCategorySelect(category);
            } else {
                setFormData((prev) => ({
                    ...prev,
                    category: "",
                    location: "",
                    area: "",
                }));

                setErrors((prev) => ({
                    ...prev,
                    category: "",
                }));
            }

            return;
        }

        /*
         * Location and area are inherited from Category.
         * They cannot be manually changed.
         */
        if (
            name === "location" ||
            name === "area"
        ) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    /* =========================================================
       IMAGE HANDLER
    ========================================================= */

    const handleImageChange = (e, fieldName) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error(
                "يرجى اختيار ملف صورة صالح."
            );
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [fieldName]: file,
        }));

        const previewUrl =
            URL.createObjectURL(file);

        setImagePreviews((prev) => {
            if (prev[fieldName]) {
                URL.revokeObjectURL(
                    prev[fieldName]
                );
            }

            return {
                ...prev,
                [fieldName]: previewUrl,
            };
        });

        setErrors((prev) => ({
            ...prev,
            [fieldName]: "",
        }));
    };

    /* =========================================================
       REMOVE IMAGE
    ========================================================= */

    const handleRemoveImage = (fieldName) => {
        if (imagePreviews[fieldName]) {
            URL.revokeObjectURL(
                imagePreviews[fieldName]
            );
        }

        setFormData((prev) => ({
            ...prev,
            [fieldName]: null,
        }));

        setImagePreviews((prev) => ({
            ...prev,
            [fieldName]: null,
        }));
    };

    /* =========================================================
       VALIDATION
    ========================================================= */

    const validateForm = () => {
        const newErrors = {};

        /*
         * Category is required because the Unit
         * now belongs to a Category.
         */
        if (!formData.category) {
            newErrors.category =
                "يرجى اختيار تصنيف الوحدة.";
        }

        if (
            formData.price !== "" &&
            Number(formData.price) < 0
        ) {
            newErrors.price =
                "السعر لا يمكن أن يكون سالباً.";
        }

        if (
            formData.bedrooms !== "" &&
            Number(formData.bedrooms) < 0
        ) {
            newErrors.bedrooms =
                "عدد غرف النوم لا يمكن أن يكون سالباً.";
        }

        if (
            formData.bathrooms !== "" &&
            Number(formData.bathrooms) < 0
        ) {
            newErrors.bathrooms =
                "عدد الحمامات لا يمكن أن يكون سالباً.";
        }

        if (
            formData.parking !== "" &&
            Number(formData.parking) < 0
        ) {
            newErrors.parking =
                "عدد مواقف السيارات لا يمكن أن يكون سالباً.";
        }

        setErrors(newErrors);

        if (
            Object.keys(newErrors).length > 0
        ) {
            toast.error(
                "يرجى مراجعة البيانات المدخلة."
            );

            return false;
        }

        return true;
    };

    /* =========================================================
       SUBMIT
    ========================================================= */

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const token =
                localStorage.getItem(
                    "access_token"
                );

            const data = new FormData();

            /*
             * IMPORTANT:
             *
             * Do NOT submit:
             * owner
             * location
             *
             * because Unit no longer has these fields.
             *
             * category is submitted as the ForeignKey.
             */

            Object.entries(formData).forEach(
                ([key, value]) => {
                    if (
                        key === "location" ||
                        key === "area"
                    ) {
                        /*
                         * Area IS a Unit field, so it must
                         * still be submitted.
                         *
                         * Only location is inherited and
                         * must NOT be submitted.
                         */
                        if (key === "area") {
                            if (
                                value !== null &&
                                value !== undefined &&
                                value !== ""
                            ) {
                                data.append(
                                    key,
                                    value
                                );
                            }
                        }

                        return;
                    }

                    if (
                        value === null ||
                        value === undefined
                    ) {
                        return;
                    }

                    if (value === "") {
                        return;
                    }

                    data.append(key, value);
                }
            );

            const response = await fetch(
                `${BASE}/api/units/create/`,
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: data,
                }
            );

            let responseData = {};

            try {
                responseData =
                    await response.json();
            } catch {
                responseData = {};
            }

            if (!response.ok) {
                console.error(
                    "Create unit error:",
                    responseData
                );

                const backendErrors =
                    responseData?.errors;

                if (
                    backendErrors &&
                    typeof backendErrors ===
                        "object"
                ) {
                    const formattedErrors =
                        {};

                    Object.entries(
                        backendErrors
                    ).forEach(
                        ([key, value]) => {
                            formattedErrors[key] =
                                Array.isArray(value)
                                    ? value.join(" ")
                                    : String(value);
                        }
                    );

                    setErrors(
                        formattedErrors
                    );
                }

                throw new Error(
                    responseData?.message ||
                    "فشل إنشاء الوحدة."
                );
            }

            toast.success(
                responseData?.message ||
                "تم إنشاء الوحدة بنجاح."
            );

            if (onSuccess) {
                onSuccess(
                    responseData?.unit ||
                    responseData
                );
            }

            if (onClose) {
                onClose();
            }

        } catch (error) {
            console.error(
                "Error creating unit:",
                error
            );

            toast.error(
                error.message ||
                "حدث خطأ أثناء حفظ الوحدة."
            );

        } finally {
            setLoading(false);
        }
    };

    /* =========================================================
       TAB NAVIGATION
    ========================================================= */

    const goNext = () => {
        if (activeTab === "main") {
            setActiveTab("pricing");
        } else if (
            activeTab === "pricing"
        ) {
            setActiveTab("owner");
        } else if (
            activeTab === "owner"
        ) {
            setActiveTab("images");
        }
    };

    const goPrevious = () => {
        if (activeTab === "pricing") {
            setActiveTab("main");
        } else if (
            activeTab === "owner"
        ) {
            setActiveTab("pricing");
        } else if (
            activeTab === "images"
        ) {
            setActiveTab("owner");
        }
    };

    /* =========================================================
       INPUT STYLE
    ========================================================= */

    const inputClass = (fieldName) => {
        const hasError =
            Boolean(errors[fieldName]);

        const value =
            formData[fieldName];

        const isFilled =
            value !== "" &&
            value !== null &&
            value !== undefined;

        return `
            w-full
            rounded-lg
            border
            border-gray-200
            border-r-4
            ${
                hasError
                    ? "border-r-red-500"
                    : isFilled
                        ? "border-r-[#a47d52]"
                        : "border-r-gray-300"
            }
            bg-white
            px-4
            py-3
            outline-none
            transition-all
            duration-200
            focus:border-[#a47d52]
            focus:ring-2
            focus:ring-[#a47d52]/10
        `;
    };

    /* =========================================================
       TAB BUTTON
    ========================================================= */

    const tabButtonClass = (tab) => {
        const active =
            activeTab === tab;

        return `
            flex
            items-center
            justify-center
            gap-2
            px-4
            py-3
            rounded-lg
            font-bold
            text-sm
            transition-all
            duration-300
            whitespace-nowrap
            ${
                active
                    ? "bg-[#a47d52] text-white shadow-md"
                    : "bg-[#e9e6e1] text-gray-600 hover:bg-[#ddd8d1]"
            }
        `;
    };

    /* =========================================================
       IMAGE BOX
    ========================================================= */

    const renderImageBox = (
        fieldName,
        label
    ) => {
        const preview =
            imagePreviews[fieldName];

        return (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-[#e9e6e1] px-4 py-3">
                    <h3 className="font-bold text-gray-700">
                        {label}
                    </h3>
                </div>

                <div className="p-4">
                    {preview ? (
                        <div className="relative">
                            <img
                                src={preview}
                                alt={label}
                                className="w-full h-52 object-cover rounded-lg border border-gray-200"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    handleRemoveImage(
                                        fieldName
                                    )
                                }
                                disabled={loading}
                                className="
                                    absolute
                                    top-3
                                    left-3
                                    flex
                                    items-center
                                    justify-center
                                    w-10
                                    h-10
                                    rounded-full
                                    bg-red-500
                                    text-white
                                    cursor-pointer
                                    hover:bg-red-600
                                    transition-all
                                    shadow-lg
                                    disabled:opacity-50
                                "
                                title="حذف الصورة"
                            >
                                <FaTrash size={14} />
                            </button>
                        </div>
                    ) : (
                        <label
                            htmlFor={fieldName}
                            className="
                                flex
                                flex-col
                                items-center
                                justify-center
                                h-52
                                rounded-lg
                                border-2
                                border-dashed
                                border-gray-300
                                bg-[#f8f7f5]
                                cursor-pointer
                                hover:border-[#a47d52]
                                hover:bg-[#f1eee9]
                                transition-all
                            "
                        >
                            <div className="
                                w-14
                                h-14
                                rounded-full
                                bg-[#e9e6e1]
                                flex
                                items-center
                                justify-center
                                text-[#a47d52]
                                mb-3
                            ">
                                <FaUpload size={22} />
                            </div>

                            <span className="font-bold text-gray-700">
                                رفع الصورة
                            </span>

                            <span className="text-xs text-gray-400 mt-1">
                                اختياري
                            </span>

                            <input
                                id={fieldName}
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    handleImageChange(
                                        e,
                                        fieldName
                                    )
                                }
                                className="hidden"
                                disabled={loading}
                            />
                        </label>
                    )}
                </div>
            </div>
        );
    };

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <div
            dir="rtl"
            className="
                fixed
                inset-0
                z-50
                bg-black/50
                flex
                items-center
                justify-center
                p-4
            "
        >
            <div
                className="
                    w-full
                    max-w-6xl
                    max-h-[95vh]
                    bg-[#f8f7f5]
                    rounded-2xl
                    shadow-2xl
                    overflow-hidden
                    flex
                    flex-col
                "
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="
                    bg-white
                    border-b
                    border-gray-200
                    px-6
                    py-4
                    flex
                    items-center
                    justify-between
                    shrink-0
                ">

                    <div className="flex items-center gap-3">

                        <div className="
                            w-12
                            h-12
                            rounded-xl
                            bg-[#e9e6e1]
                            text-[#a47d52]
                            flex
                            items-center
                            justify-center
                        ">
                            <FaBuilding size={22} />
                        </div>

                        <div>
                            <h2 className="
                                text-xl
                                font-extrabold
                                text-gray-800
                            ">
                                إضافة وحدة عقارية
                            </h2>

                            <p className="
                                text-sm
                                text-gray-500
                                mt-1
                            ">
                                إدخال بيانات الوحدة العقارية الجديدة
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="
                            w-10
                            h-10
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            bg-gray-100
                            text-gray-500
                            cursor-pointer
                            hover:bg-red-50
                            hover:text-red-500
                            transition-all
                            disabled:opacity-50
                        "
                    >
                        <MdClose size={24} />
                    </button>

                </div>

                {/* =================================================
                    TABS
                ================================================= */}

                <div className="
                    bg-white
                    border-b
                    border-gray-200
                    px-6
                    py-4
                    shrink-0
                ">

                    <div className="
                        grid
                        grid-cols-2
                        lg:grid-cols-4
                        gap-2
                    ">

                        <button
                            type="button"
                            onClick={() =>
                                setActiveTab(
                                    "main"
                                )
                            }
                            className={tabButtonClass(
                                "main"
                            )}
                            disabled={loading}
                        >
                            <FaBuilding />
                            البيانات الرئيسية
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setActiveTab(
                                    "pricing"
                                )
                            }
                            className={tabButtonClass(
                                "pricing"
                            )}
                            disabled={loading}
                        >
                            <FaMapMarkerAlt />
                            التسعير والموقع
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setActiveTab(
                                    "owner"
                                )
                            }
                            className={tabButtonClass(
                                "owner"
                            )}
                            disabled={loading}
                        >
                            <FaUserTie />
                            بيانات المالك
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setActiveTab(
                                    "images"
                                )
                            }
                            className={tabButtonClass(
                                "images"
                            )}
                            disabled={loading}
                        >
                            <FaImages />
                            الصور التوضيحية
                        </button>

                    </div>

                </div>

                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    id="add-unit-form"
                    onSubmit={handleSubmit}
                    className="
                        flex
                        flex-col
                        flex-1
                        min-h-0
                    "
                >

                    {/* =================================================
                        CONTENT
                    ================================================= */}

                    <div className="
                        overflow-y-auto
                        p-6
                        flex-1
                    ">

                        {/* =================================================
                            MAIN TAB
                        ================================================= */}

                        {activeTab === "main" && (
                            <div className="space-y-6">

                                <div>
                                    <h3 className="
                                        text-lg
                                        font-extrabold
                                        text-gray-800
                                    ">
                                        البيانات الرئيسية
                                    </h3>

                                    <p className="
                                        text-sm
                                        text-gray-500
                                        mt-1
                                    ">
                                        أدخل المعلومات الأساسية للوحدة
                                    </p>
                                </div>

                                <div className="
                                    grid
                                    grid-cols-1
                                    md:grid-cols-2
                                    gap-5
                                ">

                                    {/* Name */}

                                    <div>
                                        <label className="
                                            block
                                            mb-2
                                            font-bold
                                            text-gray-700
                                        ">
                                            اسم الوحدة
                                        </label>

                                        <input
                                            type="text"
                                            name="name"
                                            value={
                                                formData.name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={loading}
                                            placeholder="أدخل اسم الوحدة"
                                            className={inputClass(
                                                "name"
                                            )}
                                        />

                                        {errors.name && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {
                                                    errors.name
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {/* Floor */}

                                    <div>
                                        <label className="
                                            block
                                            mb-2
                                            font-bold
                                            text-gray-700
                                        ">
                                            الطابق
                                        </label>

                                        <select
                                            name="floor"
                                            value={
                                                formData.floor
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={loading}
                                            className={inputClass(
                                                "floor"
                                            )}
                                        >
                                            {FLOOR_OPTIONS.map(
                                                (option) => (
                                                    <option
                                                        key={
                                                            option.value
                                                        }
                                                        value={
                                                            option.value
                                                        }
                                                    >
                                                        {
                                                            option.label
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        {errors.floor && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {
                                                    errors.floor
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {/* Type */}

                                    <div>
                                        <label className="
                                            block
                                            mb-2
                                            font-bold
                                            text-gray-700
                                        ">
                                            نوع الوحدة
                                        </label>

                                        <select
                                            name="type"
                                            value={
                                                formData.type
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={loading}
                                            className={inputClass(
                                                "type"
                                            )}
                                        >
                                            <option value="apartment">
                                                شقة
                                            </option>

                                            <option value="vila">
                                                فيلا
                                            </option>

                                            <option value="room">
                                                غرفة
                                            </option>
                                        </select>
                                    </div>

                                    {/* Status */}

                                    <div>
                                        <label className="
                                            block
                                            mb-2
                                            font-bold
                                            text-gray-700
                                        ">
                                            حالة الوحدة
                                        </label>

                                        <select
                                            name="status"
                                            value={
                                                formData.status
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={loading}
                                            className={inputClass(
                                                "status"
                                            )}
                                        >
                                            <option value="available">
                                                متاحة
                                            </option>

                                            <option value="occupied">
                                                مشغولة
                                            </option>
                                        </select>
                                    </div>

                                    {/* Bedrooms */}

                                    <div>
                                        <label className="
                                            block
                                            mb-2
                                            font-bold
                                            text-gray-700
                                        ">
                                            عدد غرف النوم
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            name="bedrooms"
                                            value={
                                                formData.bedrooms
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={loading}
                                            placeholder="0"
                                            className={inputClass(
                                                "bedrooms"
                                            )}
                                        />

                                        {errors.bedrooms && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {
                                                    errors.bedrooms
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {/* Bathrooms */}

                                    <div>
                                        <label className="
                                            block
                                            mb-2
                                            font-bold
                                            text-gray-700
                                        ">
                                            عدد الحمامات
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            name="bathrooms"
                                            value={
                                                formData.bathrooms
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={loading}
                                            placeholder="0"
                                            className={inputClass(
                                                "bathrooms"
                                            )}
                                        />

                                        {errors.bathrooms && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {
                                                    errors.bathrooms
                                                }
                                            </p>
                                        )}
                                    </div>

                                </div>

                                {/* Parking */}

                                <div className="
                                    border
                                    border-gray-200
                                    rounded-xl
                                    bg-white
                                    p-5
                                ">

                                    <div className="
                                        flex
                                        items-center
                                        justify-between
                                        mb-4
                                    ">

                                        <div>
                                            <h4 className="font-extrabold text-gray-800">
                                                مواقف السيارات
                                            </h4>

                                            <p className="text-xs text-gray-500 mt-1">
                                                تحديد وجود مواقف وعددها
                                            </p>
                                        </div>

                                        <label className="
                                            flex
                                            items-center
                                            gap-2
                                            cursor-pointer
                                            font-bold
                                            text-gray-700
                                        ">

                                            <input
                                                type="checkbox"
                                                name="has_parking"
                                                checked={
                                                    formData.has_parking
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                disabled={
                                                    loading
                                                }
                                                className="
                                                    w-5
                                                    h-5
                                                    accent-[#a47d52]
                                                    cursor-pointer
                                                "
                                            />

                                            يوجد موقف

                                        </label>

                                    </div>

                                    {formData.has_parking && (
                                        <div>

                                            <label className="
                                                block
                                                mb-2
                                                font-bold
                                                text-gray-700
                                            ">
                                                عدد المواقف
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                name="parking"
                                                value={
                                                    formData.parking
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                disabled={
                                                    loading
                                                }
                                                placeholder="عدد المواقف"
                                                className={inputClass(
                                                    "parking"
                                                )}
                                            />

                                            {errors.parking && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {
                                                        errors.parking
                                                    }
                                                </p>
                                            )}

                                        </div>
                                    )}

                                </div>

                                {/* Furnished */}

                                <div className="
                                    grid
                                    grid-cols-1
                                    md:grid-cols-2
                                    gap-4
                                ">

                                    <label className="
                                        flex
                                        items-center
                                        gap-3
                                        p-4
                                        bg-white
                                        border
                                        border-gray-200
                                        rounded-xl
                                        cursor-pointer
                                        hover:border-[#a47d52]
                                    ">

                                        <input
                                            type="checkbox"
                                            name="furnished"
                                            checked={
                                                formData.furnished
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                loading
                                            }
                                            className="
                                                w-5
                                                h-5
                                                accent-[#a47d52]
                                            "
                                        />

                                        <span className="font-bold text-gray-700">
                                            مفروشة
                                        </span>

                                    </label>

                                    <label className="
                                        flex
                                        items-center
                                        gap-3
                                        p-4
                                        bg-white
                                        border
                                        border-gray-200
                                        rounded-xl
                                        cursor-pointer
                                        hover:border-[#a47d52]
                                    ">

                                        <input
                                            type="checkbox"
                                            name="unfurnished"
                                            checked={
                                                formData.unfurnished
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                loading
                                            }
                                            className="
                                                w-5
                                                h-5
                                                accent-[#a47d52]
                                            "
                                        />

                                        <span className="font-bold text-gray-700">
                                            غير مفروشة
                                        </span>

                                    </label>

                                </div>

                            </div>
                        )}

                        {/* =================================================
                            PRICING / CATEGORY TAB
                        ================================================= */}

                        {activeTab === "pricing" && (
                            <div className="space-y-6">

                                <div>
                                    <h3 className="
                                        text-lg
                                        font-extrabold
                                        text-gray-800
                                    ">
                                        التسعير والموقع
                                    </h3>

                                    <p className="
                                        text-sm
                                        text-gray-500
                                        mt-1
                                    ">
                                        اختر تصنيف الوحدة لعرض المالك والموقع والمساحة
                                    </p>
                                </div>

                                {/* Category Search */}

                                <div className="relative">

                                    <FaSearch
                                        className="
                                            absolute
                                            right-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-gray-400
                                        "
                                    />

                                    <input
                                        type="text"
                                        value={
                                            categorySearch
                                        }
                                        onChange={(e) =>
                                            setCategorySearch(
                                                e.target.value
                                            )
                                        }
                                        placeholder="البحث باسم التصنيف أو المالك أو الموقع..."
                                        disabled={
                                            loading ||
                                            loadingData
                                        }
                                        className="
                                            w-full
                                            bg-white
                                            border
                                            border-gray-200
                                            border-r-4
                                            border-r-[#a47d52]
                                            rounded-lg
                                            py-3
                                            pr-11
                                            pl-4
                                            outline-none
                                            focus:ring-2
                                            focus:ring-[#a47d52]/10
                                            focus:border-[#a47d52]
                                        "
                                    />

                                </div>

                                {/* Category Table */}

                                <div className="
                                    bg-white
                                    border
                                    border-gray-200
                                    rounded-xl
                                    overflow-hidden
                                ">

                                    <div className="
                                        overflow-x-auto
                                    ">

                                        <table className="w-full text-right">

                                            <thead className="
                                                bg-[#e9e6e1]
                                                text-gray-700
                                            ">

                                                <tr>

                                                    <th className="
                                                        px-4
                                                        py-4
                                                        w-20
                                                        text-center
                                                        font-extrabold
                                                    ">
                                                        #
                                                    </th>

                                                    <th className="
                                                        px-4
                                                        py-4
                                                        font-extrabold
                                                    ">
                                                        التصنيف
                                                    </th>

                                                    <th className="
                                                        px-4
                                                        py-4
                                                        font-extrabold
                                                    ">
                                                        المالك
                                                    </th>

                                                    <th className="
                                                        px-4
                                                        py-4
                                                        font-extrabold
                                                    ">
                                                        الموقع
                                                    </th>

                                                    <th className="
                                                        px-4
                                                        py-4
                                                        font-extrabold
                                                    ">
                                                        المنطقة
                                                    </th>

                                                    <th className="
                                                        px-4
                                                        py-4
                                                        text-center
                                                        font-extrabold
                                                    ">
                                                        اختيار
                                                    </th>

                                                </tr>

                                            </thead>

                                            <tbody>

                                                {loadingData ? (
                                                    <tr>

                                                        <td
                                                            colSpan="6"
                                                            className="
                                                                text-center
                                                                py-12
                                                                text-gray-500
                                                            "
                                                        >
                                                            جاري تحميل التصنيفات...
                                                        </td>

                                                    </tr>

                                                ) : filteredCategories.length === 0 ? (
                                                    <tr>

                                                        <td
                                                            colSpan="6"
                                                            className="
                                                                text-center
                                                                py-12
                                                                text-gray-500
                                                            "
                                                        >
                                                            لا توجد نتائج
                                                        </td>

                                                    </tr>

                                                ) : (
                                                    filteredCategories.map(
                                                        (
                                                            category,
                                                            index
                                                        ) => {

                                                            const selected =
                                                                String(
                                                                    formData.category
                                                                ) ===
                                                                String(
                                                                    category.id
                                                                );

                                                            return (
                                                                <tr
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    onClick={() =>
                                                                        handleCategorySelect(
                                                                            category
                                                                        )
                                                                    }
                                                                    className={`
                                                                        border-t
                                                                        border-gray-100
                                                                        cursor-pointer
                                                                        transition-all
                                                                        ${
                                                                            selected
                                                                                ? "bg-[#a47d52]/10"
                                                                                : "hover:bg-[#f8f7f5]"
                                                                        }
                                                                    `}
                                                                >

                                                                    {/* Number */}

                                                                    <td className="
                                                                        px-4
                                                                        py-4
                                                                        text-center
                                                                        font-bold
                                                                        text-gray-500
                                                                    ">
                                                                        {
                                                                            index +
                                                                            1
                                                                        }
                                                                    </td>

                                                                    {/* Category */}

                                                                    <td className="
                                                                        px-4
                                                                        py-4
                                                                    ">

                                                                        <div className="
                                                                            flex
                                                                            items-center
                                                                            gap-3
                                                                        ">

                                                                            <div className="
                                                                                w-10
                                                                                h-10
                                                                                rounded-full
                                                                                bg-[#e9e6e1]
                                                                                text-[#a47d52]
                                                                                flex
                                                                                items-center
                                                                                justify-center
                                                                            ">
                                                                                <FaBuilding />
                                                                            </div>

                                                                            <div>

                                                                                <p className="
                                                                                    font-extrabold
                                                                                    text-gray-800
                                                                                ">
                                                                                    {
                                                                                        getCategoryName(
                                                                                            category
                                                                                        )
                                                                                    }
                                                                                </p>

                                                                                {category.id && (
                                                                                    <p className="
                                                                                        text-xs
                                                                                        text-gray-400
                                                                                        mt-1
                                                                                    ">
                                                                                        #{category.id}
                                                                                    </p>
                                                                                )}

                                                                            </div>

                                                                        </div>

                                                                    </td>

                                                                    {/* Owner */}

                                                                    <td className="
                                                                        px-4
                                                                        py-4
                                                                    ">

                                                                        <div className="
                                                                            flex
                                                                            items-center
                                                                            gap-2
                                                                        ">

                                                                            <div className="
                                                                                w-8
                                                                                h-8
                                                                                rounded-full
                                                                                bg-[#e9e6e1]
                                                                                text-[#a47d52]
                                                                                flex
                                                                                items-center
                                                                                justify-center
                                                                            ">
                                                                                <FaUserTie
                                                                                    size={14}
                                                                                />
                                                                            </div>

                                                                            <div>

                                                                                <p className="
                                                                                    font-bold
                                                                                    text-gray-700
                                                                                ">
                                                                                    {
                                                                                        getOwnerName(
                                                                                            category
                                                                                        )
                                                                                    }
                                                                                </p>

                                                                                {getOwnerPhone(
                                                                                    category
                                                                                ) && (
                                                                                    <p className="
                                                                                        text-xs
                                                                                        text-gray-400
                                                                                        mt-1
                                                                                    ">
                                                                                        {
                                                                                            getOwnerPhone(
                                                                                                category
                                                                                            )
                                                                                        }
                                                                                    </p>
                                                                                )}

                                                                            </div>

                                                                        </div>

                                                                    </td>

                                                                    {/* Location */}

                                                                    <td className="
                                                                        px-4
                                                                        py-4
                                                                        text-gray-600
                                                                    ">
                                                                        {
                                                                            getCategoryLocation(
                                                                                category
                                                                            ) ||
                                                                            "-"
                                                                        }
                                                                    </td>

                                                                    {/* Area */}

                                                                    <td className="
                                                                        px-4
                                                                        py-4
                                                                        text-gray-600
                                                                    ">
                                                                        {
                                                                            getCategoryArea(
                                                                                category
                                                                            ) ||
                                                                            "-"
                                                                        }
                                                                    </td>

                                                                    {/* Select */}

                                                                    <td className="
                                                                        px-4
                                                                        py-4
                                                                        text-center
                                                                    ">

                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                selected
                                                                            }
                                                                            onChange={() =>
                                                                                handleCategorySelect(
                                                                                    category
                                                                                )
                                                                            }
                                                                            onClick={(
                                                                                e
                                                                            ) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                            disabled={
                                                                                loading
                                                                            }
                                                                            className="
                                                                                w-5
                                                                                h-5
                                                                                accent-[#a47d52]
                                                                                cursor-pointer
                                                                            "
                                                                        />

                                                                    </td>

                                                                </tr>
                                                            );
                                                        }
                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                </div>

                                {/* Selected Category */}

                                {selectedCategory && (
                                    <div className="
                                        rounded-xl
                                        bg-[#a47d52]/10
                                        border
                                        border-[#a47d52]/30
                                        p-5
                                    ">

                                        <div className="
                                            flex
                                            items-center
                                            justify-between
                                            gap-4
                                        ">

                                            <div className="
                                                flex
                                                items-center
                                                gap-3
                                            ">

                                                <div className="
                                                    w-10
                                                    h-10
                                                    rounded-full
                                                    bg-[#a47d52]
                                                    text-white
                                                    flex
                                                    items-center
                                                    justify-center
                                                ">
                                                    <FaCheck />
                                                </div>

                                                <div>

                                                    <p className="
                                                        text-xs
                                                        text-gray-500
                                                    ">
                                                        التصنيف المحدد
                                                    </p>

                                                    <p className="
                                                        font-extrabold
                                                        text-gray-800
                                                    ">
                                                        {
                                                            getCategoryName(
                                                                selectedCategory
                                                            )
                                                        }
                                                    </p>

                                                </div>

                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            category:
                                                                "",
                                                            location:
                                                                "",
                                                            area:
                                                                "",
                                                        })
                                                    )
                                                }
                                                disabled={
                                                    loading
                                                }
                                                className="
                                                    text-red-500
                                                    hover:text-red-700
                                                    cursor-pointer
                                                    font-bold
                                                "
                                            >
                                                إزالة
                                            </button>

                                        </div>

                                        {/* Inherited information */}

                                        <div className="
                                            grid
                                            grid-cols-1
                                            md:grid-cols-3
                                            gap-4
                                            mt-5
                                        ">

                                            <div className="
                                                bg-white
                                                border
                                                border-gray-200
                                                rounded-lg
                                                p-4
                                            ">

                                                <p className="
                                                    text-xs
                                                    text-gray-400
                                                    mb-1
                                                ">
                                                    المالك
                                                </p>

                                                <p className="
                                                    font-extrabold
                                                    text-gray-800
                                                ">
                                                    {
                                                        getOwnerName(
                                                            selectedCategory
                                                        )
                                                    }
                                                </p>

                                            </div>

                                            <div className="
                                                bg-white
                                                border
                                                border-gray-200
                                                rounded-lg
                                                p-4
                                            ">

                                                <p className="
                                                    text-xs
                                                    text-gray-400
                                                    mb-1
                                                ">
                                                    المنطقة
                                                </p>

                                                <p className="
                                                    font-extrabold
                                                    text-gray-800
                                                ">
                                                    {
                                                        getCategoryLocation(
                                                            selectedCategory
                                                        ) ||
                                                        "-"
                                                    }
                                                </p>

                                            </div>

                                            <div className="
                                                bg-white
                                                border
                                                border-gray-200
                                                rounded-lg
                                                p-4
                                            ">

                                                <p className="
                                                    text-xs
                                                    text-gray-400
                                                    mb-1
                                                ">
                                                    الموقع
                                                </p>

                                                <p className="
                                                    font-extrabold
                                                    text-gray-800
                                                ">
                                                    {
                                                        getCategoryArea(
                                                            selectedCategory
                                                        ) ||
                                                        "-"
                                                    }
                                                </p>

                                            </div>

                                        </div>

                                    </div>
                                )}

                                {/* Price */}

                                <div className="
                                    grid
                                    grid-cols-1
                                    md:grid-cols-2
                                    gap-5
                                ">

                                    <div className="w-full">
    <label
        className="
            block
            mb-2
            font-bold
            text-gray-700
        "
    >
        السعر
    </label>

    <input
        type="number"
        min="10"
        step="0.01"
        name="price"
        
        value={formData.price}
        onChange={handleChange}
        disabled={loading}
        placeholder="0.00"
        className={`!w-full max-w-none ${inputClass("price")}`}
    />

    {errors.price && (
        <p className="text-red-500 text-xs mt-1">
            {errors.price}
        </p>
    )}
</div>

                                    {/* Area inherited from category */}

                                    <div>

                                        {errors.area && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {
                                                    errors.area
                                                }
                                            </p>
                                        )}

                                    </div>

                                </div>

                            </div>
                        )}

                        {/* =================================================
                            OWNER TAB
                        ================================================= */}

                        {activeTab === "owner" && (
                            <div className="space-y-6">

                                <div>
                                    <h3 className="
                                        text-lg
                                        font-extrabold
                                        text-gray-800
                                    ">
                                        بيانات المالك
                                    </h3>

                                    <p className="
                                        text-sm
                                        text-gray-500
                                        mt-1
                                    ">
                                        المالك يتم تحديده تلقائياً من التصنيف المختار
                                    </p>
                                </div>

                                {selectedCategory ? (
                                    <div className="
                                        bg-white
                                        border
                                        border-gray-200
                                        rounded-xl
                                        overflow-hidden
                                    ">

                                        <div className="
                                            bg-[#e9e6e1]
                                            px-5
                                            py-4
                                        ">

                                            <div className="
                                                flex
                                                items-center
                                                gap-3
                                            ">

                                                <div className="
                                                    w-10
                                                    h-10
                                                    rounded-full
                                                    bg-[#a47d52]
                                                    text-white
                                                    flex
                                                    items-center
                                                    justify-center
                                                ">
                                                    <FaUserTie />
                                                </div>

                                                <div>

                                                    <p className="
                                                        text-xs
                                                        text-gray-500
                                                    ">
                                                        المالك المحدد من التصنيف
                                                    </p>

                                                    <p className="
                                                        font-extrabold
                                                        text-gray-800
                                                    ">
                                                        {
                                                            getOwnerName(
                                                                selectedCategory
                                                            )
                                                        }
                                                    </p>

                                                </div>

                                            </div>

                                        </div>

                                        <div className="
                                            p-5
                                            grid
                                            grid-cols-1
                                            md:grid-cols-3
                                            gap-4
                                        ">

                                            <div className="
                                                rounded-lg
                                                bg-[#f8f7f5]
                                                border
                                                border-gray-200
                                                p-4
                                            ">

                                                <p className="
                                                    text-xs
                                                    text-gray-400
                                                    mb-1
                                                ">
                                                    التصنيف
                                                </p>

                                                <p className="
                                                    font-bold
                                                    text-gray-700
                                                ">
                                                    {
                                                        getCategoryName(
                                                            selectedCategory
                                                        )
                                                    }
                                                </p>

                                            </div>

                                            <div className="
                                                rounded-lg
                                                bg-[#f8f7f5]
                                                border
                                                border-gray-200
                                                p-4
                                            ">

                                                <p className="
                                                    text-xs
                                                    text-gray-400
                                                    mb-1
                                                ">
                                                    رقم الهاتف
                                                </p>

                                                <p className="
                                                    font-bold
                                                    text-gray-700
                                                ">
                                                    {
                                                        getOwnerPhone(
                                                            selectedCategory
                                                        ) ||
                                                        "-"
                                                    }
                                                </p>

                                            </div>

                                            <div className="
                                                rounded-lg
                                                bg-[#f8f7f5]
                                                border
                                                border-gray-200
                                                p-4
                                            ">

                                                <p className="
                                                    text-xs
                                                    text-gray-400
                                                    mb-1
                                                ">
                                                    الموقع
                                                </p>

                                                <p className="
                                                    font-bold
                                                    text-gray-700
                                                ">
                                                    {
                                                        getCategoryLocation(
                                                            selectedCategory
                                                        ) ||
                                                        "-"
                                                    }
                                                </p>

                                            </div>

                                        </div>

                                    </div>
                                ) : (
                                    <div className="
                                        bg-white
                                        border
                                        border-dashed
                                        border-gray-300
                                        rounded-xl
                                        p-10
                                        text-center
                                    ">

                                        <div className="
                                            w-14
                                            h-14
                                            mx-auto
                                            rounded-full
                                            bg-[#e9e6e1]
                                            text-[#a47d52]
                                            flex
                                            items-center
                                            justify-center
                                            mb-4
                                        ">
                                            <FaUserTie
                                                size={22}
                                            />
                                        </div>

                                        <p className="
                                            font-extrabold
                                            text-gray-700
                                        ">
                                            لم يتم اختيار تصنيف
                                        </p>

                                        <p className="
                                            text-sm
                                            text-gray-400
                                            mt-1
                                        ">
                                            اختر تصنيفاً من تبويب التسعير والموقع
                                        </p>

                                    </div>
                                )}

                            </div>
                        )}

                        {/* =================================================
                            IMAGES TAB
                        ================================================= */}

                        {activeTab === "images" && (
                            <div className="space-y-6">

                                <div>
                                    <h3 className="
                                        text-lg
                                        font-extrabold
                                        text-gray-800
                                    ">
                                        الصور التوضيحية
                                    </h3>

                                    <p className="
                                        text-sm
                                        text-gray-500
                                        mt-1
                                    ">
                                        يمكنك إضافة حتى أربع صور للوحدة
                                    </p>
                                </div>

                                <div className="
                                    grid
                                    grid-cols-1
                                    md:grid-cols-2
                                    gap-5
                                ">

                                    {renderImageBox(
                                        "image_1",
                                        "الصورة الأولى"
                                    )}

                                    {renderImageBox(
                                        "image_2",
                                        "الصورة الثانية"
                                    )}

                                    {renderImageBox(
                                        "image_3",
                                        "الصورة الثالثة"
                                    )}

                                    {renderImageBox(
                                        "image_4",
                                        "الصورة الرابعة"
                                    )}

                                </div>

                            </div>
                        )}

                    </div>

                    {/* =================================================
                        FOOTER / TAB NAVIGATION
                    ================================================= */}

                    <div className="
                        flex
                        flex-col
                        md:flex-row
                        gap-3
                        border-t
                        border-gray-200
                        p-6
                        bg-white
                        shrink-0
                    ">

                        {/* Previous */}

                        {activeTab !== "main" && (
                            <button
                                type="button"
                                onClick={goPrevious}
                                disabled={loading}
                                className="
                                    flex-1
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    cursor-pointer
                                    font-extrabold
                                    bg-gray-300
                                    text-gray-700
                                    px-6
                                    py-3
                                    rounded-lg
                                    transition-all
                                    duration-300
                                    hover:bg-gray-400
                                    disabled:opacity-50
                                "
                            >
                                <FaChevronRight size={14} />
                                السابق
                            </button>
                        )}

                        {/* Next */}

                        {activeTab !== "images" && (
                            <button
                                type="button"
                                onClick={goNext}
                                disabled={loading}
                                className="
                                    flex-1
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    cursor-pointer
                                    font-extrabold
                                    bg-[#a47d52]
                                    text-white
                                    px-6
                                    py-3
                                    rounded-lg
                                    transition-all
                                    duration-300
                                    hover:bg-[#8a6a44]
                                    hover:scale-[1.02]
                                    disabled:opacity-50
                                    disabled:cursor-not-allowed
                                "
                            >
                                التالي
                                <FaChevronLeft size={14} />
                            </button>
                        )}

                        {/* Save */}

                        {activeTab === "images" && (
                            <button
                                type="submit"
                                form="add-unit-form"
                                disabled={
                                    loading ||
                                    loadingData
                                }
                                className="
                                    flex-1
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    cursor-pointer
                                    font-extrabold
                                    bg-[#a47d52]
                                    text-white
                                    px-6
                                    py-3
                                    rounded-lg
                                    transition-all
                                    duration-300
                                    hover:bg-[#8a6a44]
                                    hover:scale-[1.02]
                                    disabled:opacity-50
                                    disabled:cursor-not-allowed
                                "
                            >
                                <FaSave size={18} />

                                {loading
                                    ? "جاري الحفظ..."
                                    : "حفظ"}
                            </button>
                        )}

                        {/* Cancel */}

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="
                                flex-5
                                cursor-pointer
                                font-extrabold
                                bg-gray-300
                                text-red-600
                                px-6
                                py-3
                                rounded-lg
                                transition-all
                                duration-300
                                hover:bg-gray-400
                                disabled:opacity-50
                            "
                        >
                            <span className="
                                flex
                                items-center
                                justify-center
                                gap-2
                            ">
                                <MdClose size={20} />
                                إلغاء
                            </span>
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
};

export default AddUnit;