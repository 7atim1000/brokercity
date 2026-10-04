import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const AddOfferSale = ({ offer, onClose, onSuccess }) => {
    const isEdit = Boolean(offer);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        reference_no: '',
        date: '',
        recipient_name: '',
        project: '',
        unit_no: '',
        estimated_completion_date: '',
        listing_title: '',
        unit_type: '',
        unit_model: '',
        bedrooms: '',
        unit_position: '',
        unit_grade: '',
        unit_note: '',
        plot_area: '',
        gross_saleable_area: '',
        total_area: '',
        internal_area: '',
        terrace_area: '',
        currency: 'AED',
        base_price: '',
        selling_price: '',
        premium_amount: '',
        noc_fee: '',
        transfer_fee: '',
        agency_fee: '',
        owner_paid_total: '',
        buyer_total: '',
        promotion: '',
        waiver: '',
        waiver_second: '',
        image_url: '',
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        if (offer) {
            const next = { ...form };
            Object.keys(form).forEach((k) => {
                if (offer[k] !== undefined && offer[k] !== null) {
                    next[k] = offer[k];
                }
            });
            setForm(next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('يرجى تسجيل الدخول أولاً');
                setSaving(false);
                return;
            }

            const fd = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    fd.append(key, value);
                }
            });
            if (imageFile) fd.append('image', imageFile);

            const url = isEdit
                ? `${BASE}/api/offersales/${offer.id}/`
                : `${BASE}/api/offersales/`;

            const response = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                toast.error(err?.detail || 'فشل حفظ العرض');
                setSaving(false);
                return;
            }

            const data = await response.json();
            toast.success(
                isEdit ? '✅ تم تحديث العرض بنجاح!' : '✅ تم إضافة العرض بنجاح!'
            );
            onSuccess?.(data);
            onClose?.();
        } catch (err) {
            console.error('Save offer error:', err);
            toast.error('خطأ في الاتصال بالخادم');
        } finally {
            setSaving(false);
        }
    };

    const inputCls =
        'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#a47d52] focus:ring-1 focus:ring-[#a47d52]';
    const labelCls = 'block text-sm font-bold text-gray-700 mb-1';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4 rtl">
            <div className="bg-white w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-xl shadow-2xl">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sticky top-0 bg-white z-10">
                    <h3 className="text-lg md:text-xl font-extrabold text-gray-800">
                        {isEdit ? 'تعديل العرض' : 'إضافة عرض جديد'}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-500 cursor-pointer"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* ============= معلومات العرض ============= */}
                    <SectionTitle>معلومات العرض</SectionTitle>
                    <Row>
                        <Field label="رقم المرجع" name="reference_no" value={form.reference_no} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="تاريخ العرض" name="date" type="date" value={form.date} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="اسم المستلم" name="recipient_name" value={form.recipient_name} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="المشروع" name="project" value={form.project} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="رقم الوحدة" name="unit_no" value={form.unit_no} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="تاريخ الإنجاز المتوقع" name="estimated_completion_date" value={form.estimated_completion_date} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                    </Row>
                    <Row>
                        <Field label="عنوان الإعلان" name="listing_title" value={form.listing_title} onChange={handleChange} cls={inputCls} labelCls={labelCls} full />
                    </Row>

                    {/* ============= تفاصيل الوحدة ============= */}
                    <SectionTitle>تفاصيل الوحدة</SectionTitle>
                    <Row>
                        <Field label="نوع الوحدة" name="unit_type" value={form.unit_type} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="موديل الوحدة" name="unit_model" value={form.unit_model} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="عدد الغرف" name="bedrooms" value={form.bedrooms} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="موقع الوحدة" name="unit_position" value={form.unit_position} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="درجة الوحدة" name="unit_grade" value={form.unit_grade} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="ملاحظة إضافية" name="unit_note" value={form.unit_note} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                    </Row>

                    {/* ============= المساحات ============= */}
                    <SectionTitle>المساحات</SectionTitle>
                    <Row>
                        <Field label="مساحة الأرض" name="plot_area" value={form.plot_area} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="المساحة البيعية الإجمالية" name="gross_saleable_area" value={form.gross_saleable_area} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="المساحة الكلية" name="total_area" value={form.total_area} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="المساحة الداخلية" name="internal_area" value={form.internal_area} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="مساحة التراس" name="terrace_area" value={form.terrace_area} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                    </Row>

                    {/* ============= الصورة ============= */}
                    <SectionTitle>الصورة</SectionTitle>
                    <Row>
                        <div>
                            <label className={labelCls}>صورة العقار</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                className="w-full text-sm"
                            />
                        </div>
                        <Field label="رابط صورة خارجي" name="image_url" value={form.image_url} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                    </Row>

                    {/* ============= الأسعار ============= */}
                    <SectionTitle>الأسعار</SectionTitle>
                    <Row>
                        <Field label="العملة" name="currency" value={form.currency} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="السعر الأصلي / الأساسي" name="base_price" type="number" value={form.base_price} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="سعر البيع" name="selling_price" type="number" value={form.selling_price} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="قيمة العلاوة" name="premium_amount" type="number" value={form.premium_amount} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="رسوم NOC" name="noc_fee" type="number" value={form.noc_fee} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="رسوم نقل الملكية" name="transfer_fee" type="number" value={form.transfer_fee} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="رسوم الوكالة" name="agency_fee" type="number" value={form.agency_fee} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="إجمالي مدفوعات المالك" name="owner_paid_total" type="number" value={form.owner_paid_total} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="إجمالي مدفوعات المشتري" name="buyer_total" type="number" value={form.buyer_total} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                    </Row>

                    {/* ============= العرض والتنازلات ============= */}
                    <SectionTitle>العرض والتنازلات</SectionTitle>
                    <Row>
                        <Field label="العرض الترويجي" name="promotion" value={form.promotion} onChange={handleChange} cls={inputCls} labelCls={labelCls} full />
                    </Row>
                    <Row>
                        <Field label="التنازل (AMC)" name="waiver" value={form.waiver} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                        <Field label="التنازل (DLP)" name="waiver_second" value={form.waiver_second} onChange={handleChange} cls={inputCls} labelCls={labelCls} />
                    </Row>

                    {/* ============= ACTIONS ============= */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer px-5 py-2 rounded-md bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`cursor-pointer px-6 py-2 rounded-md text-white font-extrabold transition ${
                                saving
                                    ? 'bg-[#c9b39a] cursor-not-allowed'
                                    : 'bg-[#a47d52] hover:bg-[#8a6a44]'
                            }`}
                        >
                            {saving ? 'جاري الحفظ...' : isEdit ? 'تحديث' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// =========================================================
// HELPERS
// =========================================================

// Section header
const SectionTitle = ({ children }) => (
    <h4 className="text-sm font-extrabold text-[#a47d52] uppercase tracking-wider pt-2 pb-1 border-b border-[#f0ebe5]">
        {children}
    </h4>
);

// Responsive row: flex-col on mobile, flex-row (wrap) on sm+
const Row = ({ children }) => (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        {children}
    </div>
);

// Field with fixed responsive width
const Field = ({
    label,
    name,
    value,
    onChange,
    type = 'text',
    cls,
    labelCls,
    full = false,
}) => (
    <div
        className={
            full
                ? 'w-full'
                : 'w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]'
        }
    >
        <label className={labelCls}>{label}</label>
        <input
            type={type}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            className={cls}
            step={type === 'number' ? '0.01' : undefined}
        />
    </div>
);

export default AddOfferSale;