import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdDeleteForever, MdPictureAsPdf } from 'react-icons/md';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import AddMonitor from '../../components/ar/monitor/AddMonitor';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const COMPANY_NAME_EN = 'Broker City Properties';
const COMPANY_NAME_AR = 'بروكر سيتي العقارية';

const PRINT_FONT = '"Segoe UI", "Tahoma", "Arial", "Cairo", sans-serif';

const Monitor = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const [search, setSearch] = useState('');
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    // ---------- FETCH ----------
    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('يرجى تسجيل الدخول لعرض السجلات');
                setLoading(false);
                return;
            }

            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (day) params.append('day', day);
            if (month) params.append('month', month);
            if (fromDate && toDate) {
                params.append('from_date', fromDate);
                params.append('to_date', toDate);
            }

            const url = `${BASE}/api/monitor/${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                else toast.error('فشل تحميل السجلات');
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            let list = [];
            if (Array.isArray(data)) list = data;
            else if (data && Array.isArray(data.results)) list = data.results;

            setItems(list);
        } catch (err) {
            console.error('Error fetching monitor list:', err);
            setError('فشل تحميل السجلات');
        } finally {
            setLoading(false);
        }
    };

    // ---------- DELETE ----------
    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
        setDeletingId(id);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('يرجى تسجيل الدخول أولاً');
                setDeletingId(null);
                return;
            }
            const response = await fetch(`${BASE}/api/monitor/delete/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) toast.error('انتهت الجلسة');
                else if (response.status === 404) toast.error('السجل غير موجود');
                else toast.error('فشل حذف السجل');
                setDeletingId(null);
                return;
            }

            setItems(prev => prev.filter(i => i.id !== id));
            toast.success('✅ تم حذف السجل بنجاح');
        } catch (err) {
            console.error('Error deleting monitor:', err);
            toast.error('خطأ في الاتصال بالخادم');
        } finally {
            setDeletingId(null);
        }
    };

    // ---------- MODAL ----------
    const handleCloseModal = () => {
        setShowModal(false);
        fetchItems();
    };

    // ---------- FILTERS ----------
    const handleClearFilters = () => {
        setSearch('');
        setDay('');
        setMonth('');
        setFromDate('');
        setToDate('');
        setTimeout(fetchItems, 0);
    };

    const handleApplyFilters = (e) => {
        e.preventDefault();
        fetchItems();
    };

    // =========================================================
    //  PDF DOWNLOAD — html2canvas → jsPDF.addImage
    //  onclone strips CSS so oklch() colors never reach html2canvas
    // =========================================================
    const handleDownloadPDF = async () => {
        if (!items || items.length === 0) {
            toast.warning('لا توجد بيانات لتصديرها');
            return;
        }

        const element = document.querySelector('.print-area');
        if (!element) {
            toast.error('تعذر تجهيز محتوى الطباعة');
            return;
        }

        try {
            setIsGeneratingPdf(true);
            await new Promise((r) => setTimeout(r, 150));

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    // Strip every external/internal stylesheet from the cloned doc.
                    clonedDoc
                        .querySelectorAll('style, link[rel="stylesheet"]')
                        .forEach((n) => n.remove());

                    // Force safe inline values on every node inside the print area.
                    const root = clonedDoc.querySelector('.print-area');
                    if (!root) return;

                    const walk = (el) => {
                        if (el.nodeType === 1) {
                            // Neutralize any oklch colors inherited from Tailwind
                            el.style.color = '#000';
                            el.style.fontFamily = PRINT_FONT;
                            // Keep our explicit backgrounds/borders — they're hex
                            if (!el.style.backgroundColor || el.style.backgroundColor.includes('oklch')) {
                                el.style.backgroundColor = 'transparent';
                            }
                            if (!el.style.borderColor || el.style.borderColor.includes('oklch')) {
                                el.style.borderColor = '#000';
                            }
                        }
                        Array.from(el.children).forEach(walk);
                    };
                    walk(root);
                },
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = `Monitor_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(fileName);
            toast.success('✅ تم تحميل ملف PDF');
        } catch (err) {
            console.error('PDF generation error:', err);
            toast.error('❌ تعذر إنشاء ملف PDF');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // ---------- Print helpers ----------
    const totalLeadNo = items.reduce((sum, it) => sum + (Number(it.lead_no) || 0), 0);
    const printGeneratedAt = new Date().toLocaleString('ar-EG');

    // ---------- LOADING ----------
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-5 rtl">
                <div className="w-12 h-12 border-4 border-[#f0ebe5] border-t-[#a47d52] rounded-full animate-spin"></div>
                <p className="text-[#a47d52] text-lg font-extrabold">جاري تحميل السجلات...</p>
            </div>
        );
    }

    // ---------- ERROR ----------
    if (error) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
                <span className="text-5xl">⚠️</span>
                <p className="text-red-500 text-lg font-extrabold">{error}</p>
                <button
                    className="bg-[#a47d52] text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44]"
                    onClick={fetchItems}
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
            <style>{`
                .print-area {
                    position: absolute;
                    top: -10000px;
                    left: -10000px;
                    width: 1400px;
                    background: #ffffff;
                }
                @media print {
                    body * { visibility: hidden; }
                    .no-print { display: none !important; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area {
                        position: absolute;
                        inset: 0;
                        top: 0;
                        left: 0;
                        width: 100%;
                    }
                    @page { size: landscape; margin: 10mm; }
                    .print-area, .print-area table, .print-area th, .print-area td {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    .print-area table { page-break-inside: auto; }
                    .print-area tr { page-break-inside: avoid; page-break-after: auto; }
                    .print-area thead { display: table-header-group; }
                    .print-area tfoot { display: table-footer-group; }
                }
            `}</style>

            {/* HEADER */}
            <div className="no-print flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4">
                <div className="text-center sm:text-right">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
                        المراقبة
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 mt-1">
                        إدارة سجلات المراقبة الخاصة بشركة بروكر سيتي
                    </p>
                </div>
                <div className="flex flex-row gap-3">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPdf || items.length === 0}
                        className="bg-white border-2 border-[#a47d52] cursor-pointer text-[#a47d52] px-5 md:px-6 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#a47d52] hover:text-white hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <MdPictureAsPdf className="text-xl" />
                        {isGeneratingPdf ? 'جاري التحميل...' : 'تحميل PDF'}
                    </button>
                    <button
                        className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                        onClick={() => setShowModal(true)}
                    >
                        + إضافة سجل
                    </button>
                </div>
            </div>

            {/* FILTERS */}
            <form
                onSubmit={handleApplyFilters}
                className="no-print bg-white rounded-2xl shadow-md border border-gray-100 max-w-7xl mx-auto px-4 md:px-6 py-5 mb-6"
            >
                <div className="flex flex-row flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[180px]">
                        <label className="block text-xs font-bold text-gray-600 mb-1">بحث</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="اسم الوكيل / السبب / Lead No"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-sm focus:outline-none focus:border-[#a47d52] text-right"
                            dir="rtl"
                        />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-600 mb-1">اليوم</label>
                        <input
                            type="date"
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-sm focus:outline-none focus:border-[#a47d52]"
                        />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-600 mb-1">الشهر</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-sm focus:outline-none focus:border-[#a47d52] text-right"
                            dir="rtl"
                        >
                            <option value="">كل الشهور</option>
                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-600 mb-1">من تاريخ</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-sm focus:outline-none focus:border-[#a47d52]"
                        />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-600 mb-1">إلى تاريخ</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-sm focus:outline-none focus:border-[#a47d52]"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="cursor-pointer bg-[#a47d52] text-white px-5 py-2 rounded-sm font-extrabold text-sm hover:bg-[#8a6a44] transition-all"
                        >
                            تطبيق
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="cursor-pointer bg-gray-200 text-gray-700 px-5 py-2 rounded-sm font-extrabold text-sm hover:bg-gray-300 transition-all"
                        >
                            مسح
                        </button>
                    </div>
                </div>
            </form>

            {/* TABLE */}
            <div className="no-print max-w-7xl mx-auto px-4 md:px-6">
                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 py-16 text-center">
                        <span className="text-6xl">📋</span>
                        <h3 className="text-2xl font-extrabold text-gray-800 mt-4">لا توجد سجلات</h3>
                        <p className="text-gray-600 mt-2">لم يتم العثور على أي سجلات مطابقة.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-[#f8f7f5] border-b-2 border-[#a47d52]">
                                    <tr>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">#</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">التاريخ</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">الشهر</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">Lead No</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">الوكيل</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">عدد ليدات الوكيل</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">مدة الاتصال</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">سحوبات</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">عدد السحوبات</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">سبب السحب</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-gray-100 hover:bg-[#faf9f7] transition-colors"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-500 font-bold">{idx + 1}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.date || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.month || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.lead_no ?? '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.agent || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.agent_lead_no ?? '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">
                                                {item.agent_contact_duration != null
                                                    ? `${item.agent_contact_duration} دقيقة`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.draws ?? '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.draws_no ?? '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold max-w-[200px] truncate">
                                                {item.draws_cause || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    disabled={deletingId === item.id}
                                                    className={`p-2 rounded-full transition-all duration-300
                                                        ${deletingId === item.id
                                                            ? 'bg-gray-300 cursor-not-allowed'
                                                            : 'bg-red-50 hover:bg-red-100 hover:scale-110 active:scale-95 cursor-pointer'
                                                        }`}
                                                    title="حذف السجل"
                                                >
                                                    {deletingId === item.id ? (
                                                        <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                    ) : (
                                                        <MdDeleteForever className="text-red-500 text-2xl" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ============ HIDDEN PRINT AREA (used by html2canvas → PDF) ============ */}
            <div className="print-area">
                <table
                    dir="ltr"
                    style={{
                        direction: 'ltr',
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontFamily: PRINT_FONT,
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                colSpan={9}
                                style={{
                                    padding: '12px 8px',
                                    border: '1px solid #000',
                                    background: '#FFFFFF',
                                    fontFamily: PRINT_FONT,
                                }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#000', fontFamily: PRINT_FONT }}>
                                        {COMPANY_NAME_EN} — {COMPANY_NAME_AR}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#000', marginTop: 4, fontFamily: PRINT_FONT }}>
                                        Monitor Report — تقرير المراقبة
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 400, color: '#333', marginTop: 2, fontFamily: PRINT_FONT }}>
                                        Generated: {printGeneratedAt}
                                    </div>
                                </div>
                            </th>
                        </tr>

                        {/* RTL order (rightmost = #) */}
                        <tr>
                            <th style={thStyle}>سبب السحب</th>
                            <th style={thStyle}>عدد السحوبات</th>
                            <th style={thStyle}>مدة الاتصال</th>
                            <th style={thStyle}>عدد ليدات الوكيل</th>
                            <th style={thStyle}>الوكيل</th>
                            <th style={thStyle}>عدد الليد الكلي</th>
                            <th style={thStyle}>الشهر</th>
                            <th style={thStyle}>التاريخ</th>
                            <th style={thStyle}>#</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, index) => (
                            <tr key={it.id} style={{ background: index % 2 === 0 ? '#FFFFFF' : '#FAF7F0' }}>
                                <td style={{ ...tdStyle, textAlign: 'right', maxWidth: 220 }}>{it.draws_cause || '—'}</td>
                                <td style={tdStyle}>{it.draws_no ?? '—'}</td>
                                <td style={tdStyle}>
                                    {it.agent_contact_duration != null
                                        ? `${it.agent_contact_duration} دقيقة`
                                        : '—'}
                                </td>
                                <td style={tdStyle}>{it.agent_lead_no ?? '—'}</td>
                                <td style={tdStyle}>{it.agent || '—'}</td>
                                <td style={tdStyle}>{it.lead_no ?? '—'}</td>
                                <td style={tdStyle}>{it.month || '—'}</td>
                                <td style={tdStyle}>{it.date || '—'}</td>
                                <td style={tdStyle}>{index + 1}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#e6d5c0' }}>
                            <td colSpan={4} style={{ ...tdStyle, fontWeight: 800, textAlign: 'right', background: '#e6d5c0' }}>
                                Gross Total — المجموع الكلي
                            </td>
                            <td style={{ ...tdStyle, background: '#e6d5c0' }}></td>
                            <td style={{ ...tdStyle, fontWeight: 800, color: '#a47d52', background: '#e6d5c0' }}>
                                {totalLeadNo}
                            </td>
                            <td style={{ ...tdStyle, background: '#e6d5c0' }}></td>
                            <td style={{ ...tdStyle, background: '#e6d5c0' }}></td>
                            <td style={{ ...tdStyle, background: '#e6d5c0' }}></td>
                        </tr>
                        <tr>
                            <td
                                colSpan={9}
                                style={{
                                    ...tdStyle,
                                    border: 'none',
                                    paddingTop: 10,
                                    fontSize: 11,
                                    color: '#333',
                                    textAlign: 'center',
                                    fontFamily: PRINT_FONT,
                                }}
                            >
                                {/* إجمالي عدد الليد الكلي: {totalLeadNo} — إجمالي السجلات: {items.length} */}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* MODAL */}
            {showModal && (
                <AddMonitor
                    onClose={handleCloseModal}
                    onSuccess={() => {
                        fetchItems();
                    }}
                />
            )}
        </div>
    );
};

const thStyle = {
    border: '1px solid #000',
    padding: '8px 6px',
    fontSize: 11,
    fontWeight: 700,
    color: '#000',
    textAlign: 'center',
    whiteSpace: 'pre-line',
    background: '#e6d5c0',
    fontFamily: '"Segoe UI", "Tahoma", "Arial", "Cairo", sans-serif',
};

const tdStyle = {
    border: '1px solid #ccc',
    padding: '6px',
    fontSize: 10.5,
    color: '#000',
    textAlign: 'center',
    fontFamily: '"Segoe UI", "Tahoma", "Arial", "Cairo", sans-serif',
};

export default Monitor;