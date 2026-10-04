import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdClose, MdCloudUpload } from 'react-icons/md';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

const IMAGE_FIELDS = [
    { key: 'image',   label: 'الصورة الرئيسية' },
    { key: 'image_1', label: 'الصورة الأولى' },
    { key: 'image_2', label: 'الصورة الثانية' },
    { key: 'image_3', label: 'الصورة الثالثة' },
    { key: 'image_4', label: 'الصورة الرابعة' },
];

const TEXT_FIELDS = [
    { key: 'name',           label: 'اسم السلايدر',     required: true  },
    { key: 'location',       label: 'الموقع',            required: false },
    { key: 'starting_price', label: 'السعر الابتدائي',   required: false },
    { key: 'payment_plan',   label: 'خطة الدفع',         required: false },
    { key: 'booking_fee',    label: 'رسوم الحجز',        required: false },
    { key: 'handover',       label: 'التسليم',           required: false },
    { key: 'developer',      label: 'المطور',            required: false },
    { key: 'area_from',      label: 'المساحة من',        required: false },
    { key: 'studios',        label: 'استوديوهات',        required: false },
    { key: 'apartments',     label: 'شقق',               required: false },
    { key: 'townhouses',     label: 'تاون هاوس',         required: false },
    { key: 'duplexes',       label: 'دوبلكس',            required: false },
    { key: 'penthouses',     label: 'بنتهاوس',           required: false },
    { key: 'license_number', label: 'رقم الترخيص',       required: false },
    { key: 'project_number', label: 'رقم المشروع',       required: false },
];

const EditSlider = ({ slider, onClose, onSuccess }) => {
    const [textValues, setTextValues] = useState(
        TEXT_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})
    );
    const [description, setDescription] = useState('');
    const [images, setImages] = useState({});          // { key: File } only for newly picked
    const [previews, setPreviews] = useState({});      // { key: url or existing url }
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!slider) return;

        // Populate text values
        const initial = {};
        TEXT_FIELDS.forEach((f) => {
            initial[f.key] = slider[f.key] ?? '';
        });
        setTextValues(initial);

        setDescription(slider.description ?? '');

        // Populate image previews from server
        const previewInit = {};
        IMAGE_FIELDS.forEach((f) => {
            if (slider[f.key]) previewInit[f.key] = slider[f.key];
        });
        setPreviews(previewInit);
        setImages({});
    }, [slider]);

    const handleTextChange = (key, value) => {
        setTextValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleImageChange = (key, e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('يرجى اختيار ملف صورة صالح');
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            toast.error(`حجم الصورة يجب أن يكون أقل من ${MAX_IMAGE_MB} ميجابايت`);
            return;
        }

        setImages((prev) => ({ ...prev, [key]: file }));
        setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!textValues.name?.trim()) {
            toast.error('يرجى إدخال اسم السلايدر');
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('يرجى تسجيل الدخول أولاً');
                setSubmitting(false);
                return;
            }

            const formData = new FormData();

            // Text fields (send as-is, even empty to allow clearing)
            Object.entries(textValues).forEach(([key, val]) => {
                formData.append(key, val ?? '');
            });

            // Description
            formData.append('description', description ?? '');

            // Only send new image files
            Object.entries(images).forEach(([key, file]) => {
                if (file) formData.append(key, file);
            });

            const response = await fetch(`${BASE}/api/sliders/${slider.id}/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else if (response.status === 404) {
                    toast.error('السلايدر غير موجود');
                } else {
                    const errData = await response.json().catch(() => ({}));
                    console.error('Server error:', errData);
                    toast.error('فشل تحديث السلايدر');
                }
                setSubmitting(false);
                return;
            }

            const data = await response.json();
            toast.success('✅ تم تحديث السلايدر بنجاح!');
            onSuccess?.(data);
            onClose?.();
        } catch (err) {
            console.error('Error updating slider:', err);
            toast.error('خطأ في الاتصال بالخادم');
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 rtl"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-extrabold text-gray-800">
                        تعديل السلايدر
                    </h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer p-2 rounded-full hover:bg-[#f8f7f5] transition-colors"
                        title="إغلاق"
                    >
                        <MdClose className="text-gray-500 text-2xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Text fields grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {TEXT_FIELDS.map((field) => (
                            <div key={field.key} className={field.key === 'name' ? 'md:col-span-2' : ''}>
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    {field.label}
                                    {field.required && <span className="text-red-500"> *</span>}
                                </label>
                                <input
                                    type="text"
                                    value={textValues[field.key]}
                                    onChange={(e) => handleTextChange(field.key, e.target.value)}
                                    maxLength={200}
                                    disabled={submitting}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#a47d52] focus:ring-2 focus:ring-[#a47d52]/20 outline-none transition-all text-gray-800"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-extrabold text-gray-700 mb-2">
                            الوصف
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            disabled={submitting}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#a47d52] focus:ring-2 focus:ring-[#a47d52]/20 outline-none transition-all text-gray-800 resize-none"
                        />
                    </div>

                    {/* Images */}
                    <div>
                        <h3 className="text-sm font-extrabold text-gray-700 mb-3">
                            الصور
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {IMAGE_FIELDS.map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-xs font-extrabold text-gray-500 mb-2">
                                        {label}
                                    </label>
                                    <label
                                        htmlFor={`edit-img-${key}`}
                                        className="cursor-pointer block w-full aspect-video rounded-xl border-2 border-dashed border-[#e6cba8] hover:border-[#a47d52] bg-[#f8f7f5] hover:bg-[#f2ddc2]/30 transition-all overflow-hidden relative group"
                                    >
                                        {previews[key] ? (
                                            <>
                                                <img
                                                    src={previews[key]}
                                                    alt={label}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white font-extrabold text-xs">
                                                        تغيير
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-center p-2">
                                                <MdCloudUpload className="text-[#a47d52] text-3xl" />
                                                <p className="text-gray-500 text-[10px] font-bold">
                                                    اختر صورة
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                    <input
                                        id={`edit-img-${key}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(key, e)}
                                        className="hidden"
                                        disabled={submitting}
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            اترك الصور بدون تغيير للإبقاء على الصور الحالية
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-extrabold text-sm transition-all disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 cursor-pointer bg-[#a47d52] hover:bg-[#8a6a44] text-white py-3 px-4 rounded-xl font-extrabold text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? 'جاري التحديث...' : 'حفظ التعديلات'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSlider;