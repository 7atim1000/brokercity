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

const EditUnit = ({
    unitId,
    onClose,
    onSuccess,
}) => {

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
       FORM
    ========================================================= */

    const [formData, setFormData] = useState({

        category: "",

        name: "",
        type: "apartment",
        status: "occupied",
        floor: "first",

        price: "",
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
       ORIGINAL IMAGES
    ========================================================= */

    const [existingImages, setExistingImages] = useState({
        image_1: null,
        image_2: null,
        image_3: null,
        image_4: null,
    });

    /* =========================================================
       PREVIEWS
    ========================================================= */

    const [imagePreviews, setImagePreviews] = useState({
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
       FETCH UNIT + CATEGORIES
    ========================================================= */

    useEffect(() => {

        let cancelled = false;

        const fetchData = async () => {

            setLoadingData(true);

            try {

                const token =
                    localStorage.getItem(
                        "access_token"
                    );

                const headers = {
                    Authorization:
                        `Bearer ${token}`,
                };

                const [
                    unitResponse,
                    categoriesResponse,
                ] = await Promise.all([

                    fetch(
                        `${BASE}/api/units/${unitId}/`,
                        {
                            method: "GET",
                            headers,
                        }
                    ),

                    fetch(
                        `${BASE}/api/categories/`,
                        {
                            method: "GET",
                            headers,
                        }
                    ),
                ]);

                if (!unitResponse.ok) {

                    let errorData = {};

                    try {
                        errorData =
                            await unitResponse.json();
                    } catch {
                        errorData = {};
                    }

                    throw new Error(
                        errorData?.message ||
                        "Failed to fetch unit."
                    );
                }

                if (!categoriesResponse.ok) {

                    let errorData = {};

                    try {
                        errorData =
                            await categoriesResponse.json();
                    } catch {
                        errorData = {};
                    }

                    throw new Error(
                        errorData?.message ||
                        "Failed to fetch categories."
                    );
                }

                const unitData =
                    await unitResponse.json();

                const categoriesData =
                    await categoriesResponse.json();

                if (cancelled) {
                    return;
                }

                const unit =
                    unitData?.unit ||
                    unitData;

                const extractedCategories =
                    Array.isArray(categoriesData)
                        ? categoriesData
                        : categoriesData?.categories ||
                          categoriesData?.data ||
                          categoriesData?.results ||
                          [];

                setCategories(
                    extractedCategories
                );

                /* =================================================
                   LOAD UNIT DATA
                ================================================= */

                setFormData({
                    category:
                        unit?.category?.id ??
                        unit?.category ??
                        "",

                    name:
                        unit?.name ?? "",

                    type:
                        unit?.type ??
                        "apartment",

                    status:
                        unit?.status ??
                        "occupied",

                    floor:
                        unit?.floor ??
                        "first",

                    price:
                        unit?.price ?? "",

                    area:
                        unit?.area ?? "",

                    bedrooms:
                        unit?.bedrooms ?? "",

                    bathrooms:
                        unit?.bathrooms ?? "",

                    has_parking:
                        Boolean(
                            unit?.has_parking
                        ),

                    parking:
                        unit?.parking ?? "",

                    furnished:
                        Boolean(
                            unit?.furnished
                        ),

                    unfurnished:
                        Boolean(
                            unit?.unfurnished
                        ),

                    image_1: null,
                    image_2: null,
                    image_3: null,
                    image_4: null,
                });

                /* =================================================
                   LOAD EXISTING IMAGES
                ================================================= */

                const images = {
                    image_1:
                        unit?.image_1 ||
                        null,

                    image_2:
                        unit?.image_2 ||
                        null,

                    image_3:
                        unit?.image_3 ||
                        null,

                    image_4:
                        unit?.image_4 ||
                        null,
                };

                setExistingImages(images);

                setImagePreviews(images);

            } catch (error) {

                console.error(
                    "Error fetching edit unit data:",
                    error
                );

                if (!cancelled) {

                    toast.error(
                        error.message ||
                        "حدث خطأ أثناء تحميل بيانات الوحدة."
                    );
                }

            } finally {

                if (!cancelled) {
                    setLoadingData(false);
                }
            }
        };

        if (unitId) {
            fetchData();
        }

        return () => {
            cancelled = true;
        };

    }, [unitId]);

    /* =========================================================
       SELECTED CATEGORY
    ========================================================= */

    const selectedCategory = useMemo(() => {

        return categories.find(
            (category) =>
                String(category?.id) ===
                String(formData.category)
        );

    }, [
        categories,
        formData.category,
    ]);

    /* =========================================================
       CATEGORY SEARCH
    ========================================================= */

    const filteredCategories = useMemo(() => {

        const search =
            categorySearch
                .trim()
                .toLowerCase();

        if (!search) {
            return categories;
        }

        return categories.filter(
            (category) => {

                const name =
                    String(
                        category?.name || ""
                    ).toLowerCase();

                const owner =
                    category?.owner?.name ||
                    category?.owner_name ||
                    "";

                const location =
                    category?.location ||
                    "";

                return (
                    name.includes(search) ||
                    String(owner)
                        .toLowerCase()
                        .includes(search) ||
                    String(location)
                        .toLowerCase()
                        .includes(search)
                );
            }
        );

    }, [
        categories,
        categorySearch,
    ]);

    /* =========================================================
       CHANGE HANDLER
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
       CATEGORY SELECT
    ========================================================= */

    const handleCategorySelect = (
        categoryId
    ) => {

        setFormData((prev) => ({
            ...prev,
            category:
                String(prev.category) ===
                String(categoryId)
                    ? ""
                    : categoryId,
        }));

        setErrors((prev) => ({
            ...prev,
            category: "",
        }));
    };

    /* =========================================================
       IMAGE CHANGE
    ========================================================= */

    const handleImageChange = (
        e,
        fieldName
    ) => {

        const file =
            e.target.files?.[0];

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

            if (
                prev[fieldName] &&
                prev[fieldName].startsWith(
                    "blob:"
                )
            ) {
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

       For existing image:
       sending empty value tells Django to clear it.

       For newly selected image:
       simply removes the new file.
    ========================================================= */

    const handleRemoveImage = (
        fieldName
    ) => {

        const currentPreview =
            imagePreviews[fieldName];

        if (
            currentPreview &&
            currentPreview.startsWith("blob:")
        ) {

            URL.revokeObjectURL(
                currentPreview
            );
        }

        setFormData((prev) => ({
            ...prev,
            [fieldName]: null,
        }));

        setExistingImages((prev) => ({
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

        if (!formData.category) {

            newErrors.category =
                "التصنيف مطلوب.";
        }

        if (
            formData.name.trim() === ""
        ) {

            newErrors.name =
                "اسم الوحدة مطلوب.";
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
       SUBMIT UPDATE
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

            Object.entries(formData).forEach(
                ([key, value]) => {

                    if (
                        value === null ||
                        value === undefined
                    ) {
                        return;
                    }

                    if (
                        value === "" &&
                        typeof value !== "boolean"
                    ) {
                        return;
                    }

                    data.append(
                        key,
                        value
                    );
                }
            );

            /*
             * If an existing image was removed,
             * explicitly send an empty value.
             */

            [
                "image_1",
                "image_2",
                "image_3",
                "image_4",
            ].forEach((field) => {

                if (
                    !existingImages[field] &&
                    !formData[field]
                ) {
                    data.append(
                        field,
                        ""
                    );
                }
            });

            const response = await fetch(
                `${BASE}/api/units/${unitId}/update/`,
                {
                    method: "PUT",

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
                    "Update unit error:",
                    responseData
                );

                const backendErrors =
                    responseData?.errors;

                if (
                    backendErrors &&
                    typeof backendErrors ===
                        "object"
                ) {

                    const formattedErrors = {};

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
                    "فشل تحديث الوحدة."
                );
            }

            toast.success(
                responseData?.message ||
                "تم تحديث الوحدة بنجاح."
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
                "Error updating unit:",
                error
            );

            toast.error(
                error.message ||
                "حدث خطأ أثناء تحديث الوحدة."
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

            setActiveTab("category");

        } else if (
            activeTab === "category"
        ) {

            setActiveTab("images");
        }
    };

    const goPrevious = () => {

        if (
            activeTab === "pricing"
        ) {

            setActiveTab("main");

        } else if (
            activeTab === "category"
        ) {

            setActiveTab("pricing");

        } else if (
            activeTab === "images"
        ) {

            setActiveTab("category");
        }
    };

    /* =========================================================
       INPUT STYLE
    ========================================================= */

    const inputClass = (
        fieldName
    ) => {

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
       TAB STYLE
    ========================================================= */

    const tabButtonClass = (
        tab
    ) => {

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

            <div className="
                border
                border-gray-200
                rounded-xl
                overflow-hidden
                bg-white
            ">

                <div className="
                    bg-[#e9e6e1]
                    px-4
                    py-3
                ">

                    <h3 className="
                        font-bold
                        text-gray-700
                    ">
                        {label}
                    </h3>

                </div>

                <div className="p-4">

                    {preview ? (

                        <div className="relative">

                            <img
                                src={preview}
                                alt={label}
                                className="
                                    w-full
                                    h-52
                                    object-cover
                                    rounded-lg
                                    border
                                    border-gray-200
                                "
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
                            htmlFor={`edit-${fieldName}`}
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

                            <span className="
                                font-bold
                                text-gray-700
                            ">
                                رفع الصورة
                            </span>

                            <span className="
                                text-xs
                                text-gray-400
                                mt-1
                            ">
                                اختياري
                            </span>

                            <input
                                id={`edit-${fieldName}`}
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
       LOADING
    ========================================================= */

    if (loadingData) {

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

                <div className="
                    w-full
                    max-w-md
                    bg-white
                    rounded-2xl
                    shadow-2xl
                    p-8
                    text-center
                ">

                    <div className="
                        w-12
                        h-12
                        mx-auto
                        mb-4
                        rounded-full
                        border-4
                        border-gray-200
                        border-t-[#a47d52]
                        animate-spin
                    " />

                    <p className="
                        font-bold
                        text-gray-700
                    ">
                        جاري تحميل بيانات الوحدة...
                    </p>

                </div>

            </div>
        );
    }

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

            <div className="
                w-full
                max-w-6xl
                max-h-[95vh]
                bg-[#f8f7f5]
                rounded-2xl
                shadow-2xl
                overflow-hidden
                flex
                flex-col
            ">

                {/* HEADER */}

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

                    <div className="
                        flex
                        items-center
                        gap-3
                    ">

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
                                تعديل الوحدة العقارية
                            </h2>

                            <p className="
                                text-sm
                                text-gray-500
                                mt-1
                            ">
                                تعديل بيانات الوحدة العقارية
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

                {/* TABS */}

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
                                setActiveTab("main")
                            }
                            className={
                                tabButtonClass("main")
                            }
                            disabled={loading}
                        >
                            <FaBuilding />
                            البيانات الرئيسية
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setActiveTab("pricing")
                            }
                            className={
                                tabButtonClass("pricing")
                            }
                            disabled={loading}
                        >
                            <FaMapMarkerAlt />
                            التسعير والمساحة
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setActiveTab("category")
                            }
                            className={
                                tabButtonClass("category")
                            }
                            disabled={loading}
                        >
                            <FaUserTie />
                            التصنيف والمالك
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setActiveTab("images")
                            }
                            className={
                                tabButtonClass("images")
                            }
                            disabled={loading}
                        >
                            <FaImages />
                            الصور التوضيحية
                        </button>

                    </div>

                </div>

                {/* FORM */}

                <form
                    id="edit-unit-form"
                    onSubmit={handleSubmit}
                    className="
                        flex
                        flex-col
                        flex-1
                        min-h-0
                    "
                >

                    <div className="
                        overflow-y-auto
                        p-6
                        flex-1
                    ">

                        {/* =================================================
                            MAIN
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
                                        تعديل المعلومات الأساسية للوحدة
                                    </p>

                                </div>

                                <div className="
                                    grid
                                    grid-cols-1
                                    md:grid-cols-2
                                    gap-5
                                ">

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
                                            className={
                                                inputClass("name")
                                            }
                                        />

                                        {errors.name && (
                                            <p className="
                                                text-red-500
                                                text-xs
                                                mt-1
                                            ">
                                                {errors.name}
                                            </p>
                                        )}

                                    </div>

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
                                            className={
                                                inputClass("floor")
                                            }
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
                                            <p className="
                                                text-red-500
                                                text-xs
                                                mt-1
                                            ">
                                                {errors.floor}
                                            </p>
                                        )}

                                    </div>

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
                                            className={
                                                inputClass("type")
                                            }
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
                                            className={
                                                inputClass("status")
                                            }
                                        >

                                            <option value="occupied">
                                                مشغولة
                                            </option>

                                            <option value="available">
                                                متاحة
                                            </option>

                                        </select>

                                    </div>

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
                                            className={
                                                inputClass(
                                                    "bedrooms"
                                                )
                                            }
                                        />

                                        {errors.bedrooms && (
                                            <p className="
                                                text-red-500
                                                text-xs
                                                mt-1
                                            ">
                                                {errors.bedrooms}
                                            </p>
                                        )}

                                    </div>

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
                                            className={
                                                inputClass(
                                                    "bathrooms"
                                                )
                                            }
                                        />

                                        {errors.bathrooms && (
                                            <p className="
                                                text-red-500
                                                text-xs
                                                mt-1
                                            ">
                                                {errors.bathrooms}
                                            </p>
                                        )}

                                    </div>

                                </div>

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

                                            <h4 className="
                                                font-extrabold
                                                text-gray-800
                                            ">
                                                مواقف السيارات
                                            </h4>

                                            <p className="
                                                text-xs
                                                text-gray-500
                                                mt-1
                                            ">
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
                                                disabled={loading}
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
                                                disabled={loading}
                                                placeholder="عدد المواقف"
                                                className={
                                                    inputClass(
                                                        "parking"
                                                    )
                                                }
                                            />

                                            {errors.parking && (
                                                <p className="
                                                    text-red-500
                                                    text-xs
                                                    mt-1
                                                ">
                                                    {errors.parking}
                                                </p>
                                            )}

                                        </div>
                                    )}

                                </div>

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
                                            disabled={loading}
                                            className="
                                                w-5
                                                h-5
                                                accent-[#a47d52]
                                            "
                                        />

                                        <span className="
                                            font-bold
                                            text-gray-700
                                        ">
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
                                            disabled={loading}
                                            className="
                                                w-5
                                                h-5
                                                accent-[#a47d52]
                                            "
                                        />

                                        <span className="
                                            font-bold
                                            text-gray-700
                                        ">
                                            غير مفروشة
                                        </span>

                                    </label>

                                </div>

                            </div>
                        )}

                        {/* =================================================
                            PRICING
                        ================================================= */}

                        {activeTab === "pricing" && (

                            <div className="space-y-6">

                                <div>

                                    <h3 className="
                                        text-lg
                                        font-extrabold
                                        text-gray-800
                                    ">
                                        التسعير والمساحة
                                    </h3>

                                    <p className="
                                        text-sm
                                        text-gray-500
                                        mt-1
                                    ">
                                        تعديل السعر والمساحة
                                    </p>

                                </div>

                                <div className="
                                    grid
                                    grid-cols-1
                                    md:grid-cols-2
                                    gap-5
                                ">

                                    <div>

                                        <label className="
                                            block
                                            mb-2
                                            font-bold
                                            text-gray-700
                                        ">
                                            السعر
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="price"
                                            value={
                                                formData.price
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={loading}
                                            placeholder="0.00"
                                            className={
                                                inputClass("price")
                                            }
                                        />

                                        {errors.price && (
                                            <p className="
                                                text-red-500
                                                text-xs
                                                mt-1
                                            ">
                                                {errors.price}
                                            </p>
                                        )}

                                    </div>

                                    <div>

                                        <label className="
                                            block
                                            mb-2
                                            font-bold
                                            text-gray-700
                                        ">
                                            المساحة
                                        </label>

                                        <input
                                            type="text"
                                            name="area"
                                            value={
                                                formData.area
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={loading}
                                            placeholder="مثال: 120 متر"
                                            className={
                                                inputClass("area")
                                            }
                                        />

                                    </div>

                                </div>

                            </div>
                        )}

                        {/* =================================================
                            CATEGORY
                        ================================================= */}

                        {activeTab === "category" && (

                            <div className="space-y-6">

                                <div>

                                    <h3 className="
                                        text-lg
                                        font-extrabold
                                        text-gray-800
                                    ">
                                        التصنيف والمالك
                                    </h3>

                                    <p className="
                                        text-sm
                                        text-gray-500
                                        mt-1
                                    ">
                                        تغيير تصنيف الوحدة سيؤدي تلقائياً
                                        إلى تغيير المالك والموقع المرتبطين
                                        بها
                                    </p>

                                </div>

                                <div className="relative">

                                    <FaSearch className="
                                        absolute
                                        right-4
                                        top-1/2
                                        -translate-y-1/2
                                        text-gray-400
                                    " />

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
                                        disabled={loading}
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

                                {selectedCategory && (

                                    <div className="
                                        bg-[#a47d52]/10
                                        border
                                        border-[#a47d52]/30
                                        rounded-xl
                                        p-5
                                    ">

                                        <div className="
                                            flex
                                            items-center
                                            gap-3
                                            mb-5
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
                                                    التصنيف الحالي
                                                </p>

                                                <p className="
                                                    font-extrabold
                                                    text-gray-800
                                                ">
                                                    {
                                                        selectedCategory.name ||
                                                        "-"
                                                    }
                                                </p>

                                            </div>

                                        </div>

                                        <div className="
                                            grid
                                            grid-cols-1
                                            md:grid-cols-2
                                            gap-4
                                        ">

                                            <div className="
                                                bg-white
                                                rounded-xl
                                                p-4
                                                border
                                                border-gray-200
                                            ">

                                                <div className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                ">

                                                    <div className="
                                                        w-10
                                                        h-10
                                                        rounded-lg
                                                        bg-[#e9e6e1]
                                                        text-[#a47d52]
                                                        flex
                                                        items-center
                                                        justify-center
                                                    ">
                                                        <FaUserTie />
                                                    </div>

                                                    <div>

                                                        <p className="
                                                            text-xs
                                                            text-gray-400
                                                        ">
                                                            المالك
                                                        </p>

                                                        <p className="
                                                            font-extrabold
                                                            text-gray-800
                                                        ">
                                                            {
                                                                selectedCategory?.owner?.name ||
                                                                selectedCategory?.owner_name ||
                                                                "-"
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>

                                            <div className="
                                                bg-white
                                                rounded-xl
                                                p-4
                                                border
                                                border-gray-200
                                            ">

                                                <div className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                ">

                                                    <div className="
                                                        w-10
                                                        h-10
                                                        rounded-lg
                                                        bg-[#e9e6e1]
                                                        text-[#a47d52]
                                                        flex
                                                        items-center
                                                        justify-center
                                                    ">
                                                        <FaMapMarkerAlt />
                                                    </div>

                                                    <div>

                                                        <p className="
                                                            text-xs
                                                            text-gray-400
                                                        ">
                                                            الموقع
                                                        </p>

                                                        <p className="
                                                            font-extrabold
                                                            text-gray-800
                                                        ">
                                                            {
                                                                selectedCategory?.location ||
                                                                "-"
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    </div>
                                )}

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

                                        <table className="
                                            w-full
                                            text-right
                                        ">

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
                                                        text-center
                                                        font-extrabold
                                                    ">
                                                        اختيار
                                                    </th>

                                                </tr>

                                            </thead>

                                            <tbody>

                                                {filteredCategories.map(
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
                                                                        category.id
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

                                                                <td className="
                                                                    px-4
                                                                    py-4
                                                                    text-center
                                                                    font-bold
                                                                    text-gray-500
                                                                ">
                                                                    {index + 1}
                                                                </td>

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
                                                                            rounded-lg
                                                                            bg-[#e9e6e1]
                                                                            text-[#a47d52]
                                                                            flex
                                                                            items-center
                                                                            justify-center
                                                                        ">

                                                                            <FaBuilding />

                                                                        </div>

                                                                        <p className="
                                                                            font-extrabold
                                                                            text-gray-800
                                                                        ">
                                                                            {
                                                                                category.name ||
                                                                                "-"
                                                                            }
                                                                        </p>

                                                                    </div>

                                                                </td>

                                                                <td className="
                                                                    px-4
                                                                    py-4
                                                                    text-gray-600
                                                                ">
                                                                    {
                                                                        category?.owner?.name ||
                                                                        category?.owner_name ||
                                                                        "-"
                                                                    }
                                                                </td>

                                                                <td className="
                                                                    px-4
                                                                    py-4
                                                                    text-gray-600
                                                                ">
                                                                    {
                                                                        category?.location ||
                                                                        "-"
                                                                    }
                                                                </td>

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
                                                                                category.id
                                                                            )
                                                                        }
                                                                        onClick={(e) =>
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
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                </div>

                                {errors.category && (

                                    <p className="
                                        text-red-500
                                        text-xs
                                        mt-1
                                    ">
                                        {errors.category}
                                    </p>
                                )}

                            </div>
                        )}

                        {/* =================================================
                            IMAGES
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
                                        يمكنك إضافة أو تغيير حتى أربع صور
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

                    {/* FOOTER */}

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
                                "
                            >

                                التالي

                                <FaChevronLeft size={14} />

                            </button>
                        )}

                        {activeTab === "images" && (

                            <button
                                type="submit"
                                form="edit-unit-form"
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
                                "
                            >

                                <FaSave size={18} />

                                {
                                    loading
                                        ? "جاري التحديث..."
                                        : "حفظ التعديلات"
                                }

                            </button>
                        )}

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

export default EditUnit;