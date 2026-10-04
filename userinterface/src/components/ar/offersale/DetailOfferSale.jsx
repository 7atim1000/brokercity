import React from 'react';
import { FaTimes, FaPlus, FaFileInvoiceDollar } from 'react-icons/fa';

const DetailOfferSale = ({ offer, onClose, onAddPaymentPlan, onOpenOfferSale }) => {
    if (!offer) return null;

    const Row = ({ label, value }) => (
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
            <span className="text-sm text-gray-500 font-semibold">{label}</span>
            <span className="text-sm font-bold text-gray-800 text-left break-all max-w-[60%]">
                {value || '—'}
            </span>
        </div>
    );

    const SectionTitle = ({ children }) => (
        <h4 className="text-sm font-extrabold text-[#a47d52] uppercase tracking-wider pt-4 pb-2 border-b border-[#f0ebe5]">
            {children}
        </h4>
    );

    const fmt = (val, currency = 'AED') =>
        val ? `${Number(val).toLocaleString()} ${currency}` : '—';

    const imgSrc = offer.image_display || offer.image_url || null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4 rtl">
            <div className="bg-white w-full max-w-3xl max-h-[95vh] overflow-y-auto rounded-xl shadow-2xl">

                {/* =====================================================
                    HEADER — Title + 2 Action Buttons + Close
                    ===================================================== */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 sticky top-0 bg-white z-10">
                    <h3 className="text-base md:text-xl font-extrabold text-gray-800">
                        تفاصيل العرض
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Button 1 — Add Payment Plan */}
                        <button
                            type="button"
                            onClick={() => onAddPaymentPlan?.(offer)}
                            className="flex cursor-pointer items-center gap-2 rounded-md bg-[#a47d52] px-3 py-2 text-xs md:text-sm font-extrabold text-white transition hover:bg-[#8a6a44] hover:scale-105 active:scale-95"
                        >
                            <FaFileInvoiceDollar />
                            <span>إضافة خطة دفع</span>
                        </button>

                        {/* Button 2 — Offer Sale */}
                        <button
                            type="button"
                            onClick={() => onOpenOfferSale?.(offer)}
                            className="flex cursor-pointer items-center gap-2 rounded-md bg-white border-2 border-[#a47d52] px-3 py-2 text-xs md:text-sm font-extrabold text-[#a47d52] transition hover:bg-[#f8f7f5] hover:scale-105 active:scale-95"
                        >
                            <FaPlus />
                            <span>عرض البيع</span>
                        </button>

                        {/* Close */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-500"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <div className="p-5">
                    {/* =====================================================
                        IMAGE
                        ===================================================== */}
                    <div className="w-full h-56 md:h-64 rounded-xl bg-[#f8f7f5] flex items-center justify-center mb-4 overflow-hidden border-b-2 border-[#a47d52]">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={offer.reference_no || 'Offer'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-6xl">🏢</span>
                        )}
                    </div>

                    {/* =====================================================
                        TITLE
                        ===================================================== */}
                    <h3 className="text-2xl font-extrabold text-gray-800 mb-1">
                        {offer.listing_title || offer.reference_no || 'بدون عنوان'}
                    </h3>
                    <p className="text-[#a47d52] font-bold mb-4">
                        {offer.project || '—'}
                    </p>

                    {/* =====================================================
                        SECTIONS
                        ===================================================== */}
                    <SectionTitle>معلومات العرض</SectionTitle>
                    <Row label="رقم المرجع" value={offer.reference_no} />
                    <Row label="التاريخ" value={offer.date} />
                    <Row label="اسم المستلم" value={offer.recipient_name} />

                    <SectionTitle>المشروع والوحدة</SectionTitle>
                    <Row label="المشروع" value={offer.project} />
                    <Row label="رقم الوحدة" value={offer.unit_no} />
                    <Row label="تاريخ الإنجاز المتوقع" value={offer.estimated_completion_date} />

                    <SectionTitle>تفاصيل الوحدة</SectionTitle>
                    <Row label="النوع" value={offer.unit_type} />
                    <Row label="الموديل" value={offer.unit_model} />
                    <Row label="عدد الغرف" value={offer.bedrooms} />
                    <Row label="الموقع" value={offer.unit_position} />
                    <Row label="الدرجة" value={offer.unit_grade} />
                    <Row label="ملاحظة" value={offer.unit_note} />

                    <SectionTitle>المساحات</SectionTitle>
                    <Row label="مساحة الأرض" value={offer.plot_area} />
                    <Row label="المساحة البيعية الإجمالية" value={offer.gross_saleable_area} />
                    <Row label="المساحة الكلية" value={offer.total_area} />
                    <Row label="المساحة الداخلية" value={offer.internal_area} />
                    <Row label="مساحة التراس" value={offer.terrace_area} />

                    <SectionTitle>الأسعار</SectionTitle>
                    <Row label="العملة" value={offer.currency} />
                    <Row label="السعر الأساسي" value={fmt(offer.base_price, offer.currency)} />
                    <Row label="سعر البيع" value={fmt(offer.selling_price, offer.currency)} />
                    <Row label="العلاوة" value={fmt(offer.premium_amount, offer.currency)} />
                    <Row label="رسوم NOC" value={fmt(offer.noc_fee, offer.currency)} />
                    <Row label="رسوم نقل الملكية" value={fmt(offer.transfer_fee, offer.currency)} />
                    <Row label="رسوم الوكالة" value={fmt(offer.agency_fee, offer.currency)} />
                    <Row label="إجمالي المدفوع للمطور" value={fmt(offer.owner_paid_total, offer.currency)} />
                    <Row label="إجمالي المشتري" value={fmt(offer.buyer_total, offer.currency)} />

                    <SectionTitle>العرض والتنازلات</SectionTitle>
                    <Row label="العرض الترويجي" value={offer.promotion} />
                    <Row label="تنازل (AMC)" value={offer.waiver} />
                    <Row label="تنازل (DLP)" value={offer.waiver_second} />

                    {/* =====================================================
                        FOOTER — Close button
                        ===================================================== */}
                    <div className="flex items-center justify-end gap-2 pt-5 border-t border-gray-200 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer px-6 py-2 rounded-md bg-[#a47d52] text-white font-extrabold hover:bg-[#8a6a44] transition"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailOfferSale;