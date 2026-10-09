import React, { useState, useEffect, useRef, forwardRef } from 'react';
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

const PRINT_FONT =
    '"Cairo", "Tajawal", "Segoe UI", "Tahoma", "Arial", sans-serif';

// =============================================================
// HIDDEN PDF RENDER TARGET
// A4 LANDSCAPE = 1123 x 794 px @ 96dpi
// =============================================================
const PdfRenderTarget = forwardRef(
    ({ items, totalLeadNo, totalReassignedLeadNo, generatedAt }, ref) => (
        <div
            ref={ref}
            dir="rtl"
            lang="ar"
            data-pdf-root="true"
            style={{
                width: '1123px',
                padding: '18px 22px 24px 22px',
                background: '#ffffff',
                boxSizing: 'border-box',
                fontFamily: PRINT_FONT,
                color: '#1f2937',
                position: 'fixed',
                left: '-10000px',
                top: 0,
                zIndex: -1,
            }}
        >
            {/* ================= HEADER ================= */}
            <header
                data-pdf-block="header"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderBottom: '2px solid #a47d52',
                    paddingBottom: '8px',
                    marginBottom: '10px',
                }}
            >
                <h1
                    style={{
                        color: '#a47d52',
                        fontSize: '20px',
                        fontWeight: 800,
                        margin: 0,
                        lineHeight: 1.25,
                        fontFamily: PRINT_FONT,
                    }}
                >
                    {COMPANY_NAME_EN} — {COMPANY_NAME_AR}
                </h1>
                <h2
                    style={{
                        color: '#1f2937',
                        fontSize: '16px',
                        fontWeight: 700,
                        marginTop: '4px',
                        lineHeight: 1.3,
                        fontFamily: PRINT_FONT,
                    }}
                >
                    Monitor Report — تقرير المراقبة
                </h2>
                <p
                    style={{
                        color: '#6b7280',
                        fontSize: '12px',
                        marginTop: '4px',
                        fontFamily: PRINT_FONT,
                    }}
                >
                    Generated: {generatedAt}
                </p>
            </header>

            {/* ================= TABLE (RTL) ================= */}
            <main data-pdf-block="body">
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        tableLayout: 'fixed',
                        fontFamily: PRINT_FONT,
                        direction: 'rtl',
                    }}
                >
                    <thead>
                        <tr>
                            <th style={thPdf}>#</th>
                            <th style={thPdf}>التاريخ</th>
                            <th style={thPdf}>الشهر</th>
                            <th style={thPdf}>عدد ليدات الوكيل</th>
                            <th style={thPdf}>ليدات معاد توزيعها</th>
                            <th style={thPdf}>الوكيل</th>
                            <th style={thPdf}>مدة الاتصال</th>
                            <th style={thPdf}>تعليق الوكيل</th>
                            {/* ✅ NEW PDF COLUMNS */}
                            <th style={thPdf}>مدة التعيين</th>
                            <th style={thPdf}>تعليق إعادة التعيين</th>
                            <th style={thPdf}>عدد السحوبات</th>
                            <th style={thPdf}>سبب السحب</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, index) => {
                            const durationNum = Number(it.agent_contact_duration);
                            const isLongDuration =
                                it.agent_contact_duration != null &&
                                !isNaN(durationNum) &&
                                durationNum > 30;

                            const assignedDurationNum = Number(it.agent_assigned_duration);
                            const isLongAssignedDuration =
                                it.agent_assigned_duration != null &&
                                !isNaN(assignedDurationNum) &&
                                assignedDurationNum > 30;

                            return (
                                <tr
                                    key={it.id}
                                    data-pdf-row="true"
                                    style={{
                                        background:
                                            index % 2 === 0 ? '#FFFFFF' : '#FAF7F0',
                                    }}
                                >
                                    <td style={tdPdf}>{index + 1}</td>
                                    <td style={tdPdf}>{it.date || '—'}</td>
                                    <td style={tdPdf}>{it.month || '—'}</td>
                                    <td style={tdPdf}>
                                        {it.agent_lead_no ?? '—'}
                                    </td>
                                    <td style={tdPdf}>
                                        {it.lead_reassigned_no ?? '—'}
                                    </td>
                                    <td style={tdPdf}>{it.agent || '—'}</td>
                                    <td
                                        style={{
                                            ...tdPdf,
                                            color: isLongDuration
                                                ? '#dc2626'
                                                : '#000',
                                            fontWeight: isLongDuration
                                                ? 800
                                                : 500,
                                        }}
                                    >
                                        {it.agent_contact_duration != null
                                            ? `${it.agent_contact_duration} دقيقة`
                                            : '—'}
                                    </td>
                                    <td
                                        style={{
                                            ...tdPdf,
                                            textAlign: 'right',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {it.agent_contact_comment || '—'}
                                    </td>

                                    {/* ✅ NEW PDF CELLS */}
                                    <td
                                        style={{
                                            ...tdPdf,
                                            color: isLongAssignedDuration
                                                ? '#dc2626'
                                                : '#000',
                                            fontWeight: isLongAssignedDuration
                                                ? 800
                                                : 500,
                                        }}
                                    >
                                        {it.agent_assigned_duration != null
                                            ? `${it.agent_assigned_duration} دقيقة`
                                            : '—'}
                                    </td>
                                    <td
                                        style={{
                                            ...tdPdf,
                                            textAlign: 'right',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {it.agent_reassigned_comment || '—'}
                                    </td>

                                    <td
                                        style={{
                                            ...tdPdf,
                                            color:
                                                it.draws_no != null
                                                    ? '#dc2626'
                                                    : '#000',
                                            fontWeight:
                                                it.draws_no != null
                                                    ? 800
                                                    : 500,
                                        }}
                                    >
                                        {it.draws_no ?? '—'}
                                    </td>
                                    <td
                                        style={{
                                            ...tdPdf,
                                            textAlign: 'right',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {it.draws_cause || '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#e6d5c0' }}>
                            <td
                                colSpan={3}
                                style={{
                                    ...tdFooterPdf,
                                    textAlign: 'right',
                                }}
                            >
                                المجموع الكلي — Gross Total
                            </td>
                            <td
                                style={{
                                    ...tdFooterPdf,
                                    color: '#a47d52',
                                }}
                            >
                                {totalLeadNo}
                            </td>
                            <td
                                style={{
                                    ...tdFooterPdf,
                                    color: '#a47d52',
                                }}
                            >
                                {totalReassignedLeadNo}
                            </td>
                            {/* Empty cells for: agent, contact_duration, contact_comment,
                                assigned_duration, reassigned_comment, draws_no, draws_cause */}
                            <td style={tdFooterPdf}></td>
                            <td style={tdFooterPdf}></td>
                            <td style={tdFooterPdf}></td>
                            <td style={tdFooterPdf}></td>
                            <td style={tdFooterPdf}></td>
                            <td style={tdFooterPdf}></td>
                            <td style={tdFooterPdf}></td>
                        </tr>
                    </tfoot>
                </table>
            </main>
        </div>
    )
);
PdfRenderTarget.displayName = 'PdfRenderTarget';

// ✅ Increased header font size + padding (unchanged)
const thPdf = {
    border: '1px solid #000',
    padding: '10px 8px',
    fontSize: 13,
    fontWeight: 800,
    color: '#000',
    textAlign: 'center',
    background: '#e6d5c0',
    fontFamily: PRINT_FONT,
    whiteSpace: 'pre-line',
};

// ✅ Increased row font size + padding (unchanged)
const tdPdf = {
    border: '1px solid #ccc',
    padding: '10px 8px',
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    fontFamily: PRINT_FONT,
    wordBreak: 'break-word',
    lineHeight: 1.5,
};

// ✅ Footer cell style (unchanged)
const tdFooterPdf = {
    border: '1px solid #ccc',
    padding: '14px 10px',
    fontSize: 15,
    fontWeight: 800,
    color: '#000',
    textAlign: 'center',
    fontFamily: PRINT_FONT,
    wordBreak: 'break-word',
    lineHeight: 1.5,
    background: '#e6d5c0',
};

// =============================================================
// MAIN COMPONENT
// =============================================================
const Monitor = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfReady, setPdfReady] = useState(false);

    const [search, setSearch] = useState('');
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const renderRef = useRef(null);
    const isGeneratingRef = useRef(false);

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        const ensureFonts = async () => {
            if (document.fonts?.ready) {
                try {
                    await document.fonts.load('700 16px Cairo');
                    await document.fonts.load('400 16px Cairo');
                } catch {
                    /* font may not be installed — fine */
                }
                await document.fonts.ready;
            }
            setPdfReady(true);
        };
        ensureFonts();
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
    //  PDF DOWNLOAD (logic unchanged)
    // =========================================================
    const handleDownloadPDF = async () => {
        if (!items || items.length === 0) {
            toast.warning('لا توجد بيانات لتصديرها');
            return;
        }
        if (isGeneratingRef.current || !renderRef.current) return;

        isGeneratingRef.current = true;
        setIsGeneratingPdf(true);

        try {
            const node = renderRef.current;

            const rootRect = node.getBoundingClientRect();
            const rowEls = node.querySelectorAll('[data-pdf-row="true"]');

            const cssRowRects = Array.from(rowEls).map((el) => {
                const r = el.getBoundingClientRect();
                return {
                    top: r.top - rootRect.top,
                    bottom: r.bottom - rootRect.top,
                };
            });

            const scale = 2.5;
            const canvas = await html2canvas(node, {
                scale,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: node.scrollWidth,
                windowHeight: node.scrollHeight,
            });

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
                compress: true,
            });

            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();

            const FOOTER_RESERVED_MM = 10;
            const usablePageH = pageH - FOOTER_RESERVED_MM;

            const pxToMm = pageW / canvas.width;
            const usablePagePx = usablePageH / pxToMm;

            const candidateBreaks = cssRowRects.map(
                (r) => r.top * scale
            );
            candidateBreaks.push(canvas.height);

            const pageBreakPx = [];
            let currentStart = 0;
            let lastChosen = 0;

            for (let i = 0; i < candidateBreaks.length; i++) {
                const candidateEnd = candidateBreaks[i];

                if (candidateEnd - currentStart > usablePagePx) {
                    if (lastChosen > currentStart) {
                        pageBreakPx.push(lastChosen);
                        currentStart = lastChosen;
                        i--;
                        lastChosen = currentStart;
                        continue;
                    } else {
                        const forced = currentStart + usablePagePx;
                        pageBreakPx.push(forced);
                        currentStart = forced;
                        lastChosen = currentStart;
                        continue;
                    }
                }

                lastChosen = candidateEnd;
            }

            if (pageBreakPx[pageBreakPx.length - 1] !== canvas.height) {
                if (canvas.height - currentStart > usablePagePx) {
                    pageBreakPx.push(currentStart + usablePagePx);
                }
                pageBreakPx.push(canvas.height);
            }

            const uniqueBreaks = Array.from(new Set(pageBreakPx))
                .filter((v) => v > 0)
                .sort((a, b) => a - b);

            let prevY = 0;
            const pageCanvases = [];

            for (const breakY of uniqueBreaks) {
                const sliceH = Math.round(breakY - prevY);
                if (sliceH <= 0) continue;

                const slice = document.createElement('canvas');
                slice.width = canvas.width;
                slice.height = sliceH;
                const sctx = slice.getContext('2d');
                sctx.fillStyle = '#ffffff';
                sctx.fillRect(0, 0, slice.width, slice.height);
                sctx.drawImage(
                    canvas,
                    0,
                    Math.round(prevY),
                    canvas.width,
                    sliceH,
                    0,
                    0,
                    canvas.width,
                    sliceH
                );

                pageCanvases.push({ canvas: slice, cssHeight: sliceH / scale });
                prevY = breakY;
            }

            const totalPages = pageCanvases.length;

            for (let page = 0; page < totalPages; page++) {
                if (page > 0) doc.addPage();

                const { canvas: sliceCanvas } = pageCanvases[page];

                const sliceHmm = (sliceCanvas.height * pageW) / sliceCanvas.width;
                const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.95);

                doc.addImage(
                    sliceImgData,
                    'JPEG',
                    0,
                    0,
                    pageW,
                    sliceHmm,
                    undefined,
                    'FAST'
                );

                const footerY = pageH - 5;
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.3);
                doc.line(15, footerY - 3, pageW - 15, footerY - 3);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(164, 125, 82);
                doc.text(
                    'BROKER CITY PROPERTIES',
                    pageW / 2,
                    footerY,
                    { align: 'center' }
                );

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6.5);
                doc.setTextColor(140, 140, 140);
                doc.text(
                    `Page ${page + 1} / ${totalPages}`,
                    pageW - 15,
                    footerY,
                    { align: 'right' }
                );
            }

            doc.save(`Monitor_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
            toast.success('✅ تم تحميل ملف PDF');
        } catch (err) {
            console.error('PDF generation error:', err);
            toast.error('❌ تعذر إنشاء ملف PDF');
        } finally {
            isGeneratingRef.current = false;
            setIsGeneratingPdf(false);
        }
    };

    // ---------- Totals ----------
    const totalLeadNo = items.reduce((sum, it) => sum + (Number(it.lead_no) || 0), 0);
    const totalReassignedLeadNo = items.reduce(
        (sum, it) => sum + (Number(it.lead_reassigned_no) || 0),
        0
    );
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
                        disabled={isGeneratingPdf || items.length === 0 || !pdfReady}
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
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">Lead Reassigned No</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">الوكيل</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">عدد ليدات الوكيل</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">مدة الاتصال</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">تعليق الوكيل</th>
                                        {/* ✅ NEW COLUMNS */}
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">مدة التعيين</th>
                                        <th className="px-4 py-3 text-sm font-extrabold text-gray-700">تعليق إعادة التعيين</th>
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
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.lead_reassigned_no ?? '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.agent || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.agent_lead_no ?? '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">
                                                {item.agent_contact_duration != null
                                                    ? `${item.agent_contact_duration} دقيقة`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold max-w-[220px] truncate">
                                                {item.agent_contact_comment || '—'}
                                            </td>
                                            {/* ✅ NEW CELLS */}
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">
                                                {item.agent_assigned_duration != null
                                                    ? `${item.agent_assigned_duration} دقيقة`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold max-w-[220px] truncate">
                                                {item.agent_reassigned_comment || '—'}
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

            {/* HIDDEN PDF RENDER TARGET */}
            {pdfReady && (
                <PdfRenderTarget
                    ref={renderRef}
                    items={items}
                    totalLeadNo={totalLeadNo}
                    totalReassignedLeadNo={totalReassignedLeadNo}
                    generatedAt={printGeneratedAt}
                />
            )}

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

export default Monitor;

// import React, { useState, useEffect, useRef, forwardRef } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { MdDeleteForever, MdPictureAsPdf } from 'react-icons/md';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
// import AddMonitor from '../../components/ar/monitor/AddMonitor';

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// const MONTHS = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December',
// ];

// const COMPANY_NAME_EN = 'Broker City Properties';
// const COMPANY_NAME_AR = 'بروكر سيتي العقارية';

// const PRINT_FONT =
//     '"Cairo", "Tajawal", "Segoe UI", "Tahoma", "Arial", sans-serif';

// // =============================================================
// // HIDDEN PDF RENDER TARGET
// // A4 LANDSCAPE = 1123 x 794 px @ 96dpi
// // =============================================================
// const PdfRenderTarget = forwardRef(
//     ({ items, totalLeadNo, totalReassignedLeadNo, generatedAt }, ref) => (
//         <div
//             ref={ref}
//             dir="rtl"
//             lang="ar"
//             data-pdf-root="true"
//             style={{
//                 width: '1123px',
//                 padding: '18px 22px 24px 22px',
//                 background: '#ffffff',
//                 boxSizing: 'border-box',
//                 fontFamily: PRINT_FONT,
//                 color: '#1f2937',
//                 position: 'fixed',
//                 left: '-10000px',
//                 top: 0,
//                 zIndex: -1,
//             }}
//         >
//             {/* ================= HEADER ================= */}
//             <header
//                 data-pdf-block="header"
//                 style={{
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center',
//                     textAlign: 'center',
//                     borderBottom: '2px solid #a47d52',
//                     paddingBottom: '8px',
//                     marginBottom: '10px',
//                 }}
//             >
//                 <h1
//                     style={{
//                         color: '#a47d52',
//                         fontSize: '20px',
//                         fontWeight: 800,
//                         margin: 0,
//                         lineHeight: 1.25,
//                         fontFamily: PRINT_FONT,
//                     }}
//                 >
//                     {COMPANY_NAME_EN} — {COMPANY_NAME_AR}
//                 </h1>
//                 <h2
//                     style={{
//                         color: '#1f2937',
//                         fontSize: '16px',
//                         fontWeight: 700,
//                         marginTop: '4px',
//                         lineHeight: 1.3,
//                         fontFamily: PRINT_FONT,
//                     }}
//                 >
//                     Monitor Report — تقرير المراقبة
//                 </h2>
//                 <p
//                     style={{
//                         color: '#6b7280',
//                         fontSize: '12px',
//                         marginTop: '4px',
//                         fontFamily: PRINT_FONT,
//                     }}
//                 >
//                     Generated: {generatedAt}
//                 </p>
//             </header>

//             {/* ================= TABLE (RTL) ================= */}
//             <main data-pdf-block="body">
//                 <table
//                     style={{
//                         width: '100%',
//                         borderCollapse: 'collapse',
//                         tableLayout: 'fixed',
//                         fontFamily: PRINT_FONT,
//                         direction: 'rtl',
//                     }}
//                 >
//                     <thead>
//                         <tr>
//                             <th style={thPdf}>#</th>
//                             <th style={thPdf}>التاريخ</th>
//                             <th style={thPdf}>الشهر</th>
//                             <th style={thPdf}>عدد ليدات الوكيل</th>
//                             <th style={thPdf}>ليدات معاد توزيعها</th>
//                             <th style={thPdf}>الوكيل</th>
//                             <th style={thPdf}>مدة الاتصال</th>
//                             <th style={thPdf}>تعليق الوكيل</th>
//                             <th style={thPdf}>عدد السحوبات</th>
//                             <th style={thPdf}>سبب السحب</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {items.map((it, index) => {
//                             const durationNum = Number(it.agent_contact_duration);
//                             const isLongDuration =
//                                 it.agent_contact_duration != null &&
//                                 !isNaN(durationNum) &&
//                                 durationNum > 30;

//                             return (
//                                 <tr
//                                     key={it.id}
//                                     data-pdf-row="true"
//                                     style={{
//                                         background:
//                                             index % 2 === 0 ? '#FFFFFF' : '#FAF7F0',
//                                     }}
//                                 >
//                                     <td style={tdPdf}>{index + 1}</td>
//                                     <td style={tdPdf}>{it.date || '—'}</td>
//                                     <td style={tdPdf}>{it.month || '—'}</td>
//                                     <td style={tdPdf}>
//                                         {it.agent_lead_no ?? '—'}
//                                     </td>
//                                     <td style={tdPdf}>
//                                         {it.lead_reassigned_no ?? '—'}
//                                     </td>
//                                     <td style={tdPdf}>{it.agent || '—'}</td>
//                                     <td
//                                         style={{
//                                             ...tdPdf,
//                                             color: isLongDuration
//                                                 ? '#dc2626'
//                                                 : '#000',
//                                             fontWeight: isLongDuration
//                                                 ? 800
//                                                 : 500,
//                                         }}
//                                     >
//                                         {it.agent_contact_duration != null
//                                             ? `${it.agent_contact_duration} دقيقة`
//                                             : '—'}
//                                     </td>
//                                     <td
//                                         style={{
//                                             ...tdPdf,
//                                             textAlign: 'right',
//                                             wordBreak: 'break-word',
//                                         }}
//                                     >
//                                         {it.agent_contact_comment || '—'}
//                                     </td>
//                                     <td
//                                         style={{
//                                             ...tdPdf,
//                                             color:
//                                                 it.draws_no != null
//                                                     ? '#dc2626'
//                                                     : '#000',
//                                             fontWeight:
//                                                 it.draws_no != null
//                                                     ? 800
//                                                     : 500,
//                                         }}
//                                     >
//                                         {it.draws_no ?? '—'}
//                                     </td>
//                                     <td
//                                         style={{
//                                             ...tdPdf,
//                                             textAlign: 'right',
//                                             wordBreak: 'break-word',
//                                         }}
//                                     >
//                                         {it.draws_cause || '—'}
//                                     </td>
//                                 </tr>
//                             );
//                         })}
//                     </tbody>
//                     <tfoot>
//                         <tr style={{ background: '#e6d5c0' }}>
//                             <td
//                                 colSpan={3}
//                                 style={{
//                                     ...tdFooterPdf,
//                                     textAlign: 'right',
//                                 }}
//                             >
//                                 المجموع الكلي — Gross Total
//                             </td>
//                             <td
//                                 style={{
//                                     ...tdFooterPdf,
//                                     color: '#a47d52',
//                                 }}
//                             >
//                                 {totalLeadNo}
//                             </td>
//                             <td
//                                 style={{
//                                     ...tdFooterPdf,
//                                     color: '#a47d52',
//                                 }}
//                             >
//                                 {totalReassignedLeadNo}
//                             </td>
//                             <td style={tdFooterPdf}></td>
//                             <td style={tdFooterPdf}></td>
//                             <td style={tdFooterPdf}></td>
//                             <td style={tdFooterPdf}></td>
//                             <td style={tdFooterPdf}></td>
//                         </tr>
//                     </tfoot>
//                 </table>
//             </main>
//         </div>
//     )
// );
// PdfRenderTarget.displayName = 'PdfRenderTarget';

// // ✅ Increased header font size + padding
// const thPdf = {
//     border: '1px solid #000',
//     padding: '10px 8px',
//     fontSize: 13,
//     fontWeight: 800,
//     color: '#000',
//     textAlign: 'center',
//     background: '#e6d5c0',
//     fontFamily: PRINT_FONT,
//     whiteSpace: 'pre-line',
// };

// // ✅ Increased row font size + padding
// const tdPdf = {
//     border: '1px solid #ccc',
//     padding: '10px 8px',
//     fontSize: 12,
//     color: '#000',
//     textAlign: 'center',
//     fontFamily: PRINT_FONT,
//     wordBreak: 'break-word',
//     lineHeight: 1.5,
// };

// // ✅ New: dedicated footer cell style — bigger font + more padding
// const tdFooterPdf = {
//     border: '1px solid #ccc',
//     padding: '14px 10px',
//     fontSize: 15,
//     fontWeight: 800,
//     color: '#000',
//     textAlign: 'center',
//     fontFamily: PRINT_FONT,
//     wordBreak: 'break-word',
//     lineHeight: 1.5,
//     background: '#e6d5c0',
// };

// // =============================================================
// // MAIN COMPONENT
// // =============================================================
// const Monitor = () => {
//     const [items, setItems] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [showModal, setShowModal] = useState(false);
//     const [deletingId, setDeletingId] = useState(null);
//     const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
//     const [pdfReady, setPdfReady] = useState(false);

//     const [search, setSearch] = useState('');
//     const [day, setDay] = useState('');
//     const [month, setMonth] = useState('');
//     const [fromDate, setFromDate] = useState('');
//     const [toDate, setToDate] = useState('');

//     const renderRef = useRef(null);
//     const isGeneratingRef = useRef(false);

//     useEffect(() => {
//         fetchItems();
//     }, []);

//     useEffect(() => {
//         const ensureFonts = async () => {
//             if (document.fonts?.ready) {
//                 try {
//                     await document.fonts.load('700 16px Cairo');
//                     await document.fonts.load('400 16px Cairo');
//                 } catch {
//                     /* font may not be installed — fine */
//                 }
//                 await document.fonts.ready;
//             }
//             setPdfReady(true);
//         };
//         ensureFonts();
//     }, []);

//     // ---------- FETCH ----------
//     const fetchItems = async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             const token = localStorage.getItem('access_token');
//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول لعرض السجلات');
//                 setLoading(false);
//                 return;
//             }

//             const params = new URLSearchParams();
//             if (search) params.append('search', search);
//             if (day) params.append('day', day);
//             if (month) params.append('month', month);
//             if (fromDate && toDate) {
//                 params.append('from_date', fromDate);
//                 params.append('to_date', toDate);
//             }

//             const url = `${BASE}/api/monitor/${params.toString() ? '?' + params.toString() : ''}`;
//             const response = await fetch(url, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`,
//                 },
//             });

//             if (!response.ok) {
//                 if (response.status === 401) toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
//                 else toast.error('فشل تحميل السجلات');
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();
//             let list = [];
//             if (Array.isArray(data)) list = data;
//             else if (data && Array.isArray(data.results)) list = data.results;

//             setItems(list);
//         } catch (err) {
//             console.error('Error fetching monitor list:', err);
//             setError('فشل تحميل السجلات');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ---------- DELETE ----------
//     const handleDelete = async (id) => {
//         if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
//         setDeletingId(id);
//         try {
//             const token = localStorage.getItem('access_token');
//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول أولاً');
//                 setDeletingId(null);
//                 return;
//             }
//             const response = await fetch(`${BASE}/api/monitor/delete/${id}/`, {
//                 method: 'DELETE',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`,
//                 },
//             });

//             if (!response.ok) {
//                 if (response.status === 401) toast.error('انتهت الجلسة');
//                 else if (response.status === 404) toast.error('السجل غير موجود');
//                 else toast.error('فشل حذف السجل');
//                 setDeletingId(null);
//                 return;
//             }

//             setItems(prev => prev.filter(i => i.id !== id));
//             toast.success('✅ تم حذف السجل بنجاح');
//         } catch (err) {
//             console.error('Error deleting monitor:', err);
//             toast.error('خطأ في الاتصال بالخادم');
//         } finally {
//             setDeletingId(null);
//         }
//     };

//     // ---------- MODAL ----------
//     const handleCloseModal = () => {
//         setShowModal(false);
//         fetchItems();
//     };

//     // ---------- FILTERS ----------
//     const handleClearFilters = () => {
//         setSearch('');
//         setDay('');
//         setMonth('');
//         setFromDate('');
//         setToDate('');
//         setTimeout(fetchItems, 0);
//     };

//     const handleApplyFilters = (e) => {
//         e.preventDefault();
//         fetchItems();
//     };

//     // =========================================================
//     //  PDF DOWNLOAD
//     // =========================================================
//     const handleDownloadPDF = async () => {
//         if (!items || items.length === 0) {
//             toast.warning('لا توجد بيانات لتصديرها');
//             return;
//         }
//         if (isGeneratingRef.current || !renderRef.current) return;

//         isGeneratingRef.current = true;
//         setIsGeneratingPdf(true);

//         try {
//             const node = renderRef.current;

//             // -------------------------------------------------
//             // 1) Measure row positions relative to root node
//             // -------------------------------------------------
//             const rootRect = node.getBoundingClientRect();
//             const rowEls = node.querySelectorAll('[data-pdf-row="true"]');

//             const cssRowRects = Array.from(rowEls).map((el) => {
//                 const r = el.getBoundingClientRect();
//                 return {
//                     top: r.top - rootRect.top,
//                     bottom: r.bottom - rootRect.top,
//                 };
//             });

//             // -------------------------------------------------
//             // 2) Rasterize the full HTML block ONCE
//             // -------------------------------------------------
//             const scale = 2.5;
//             const canvas = await html2canvas(node, {
//                 scale,
//                 useCORS: true,
//                 backgroundColor: '#ffffff',
//                 logging: false,
//                 windowWidth: node.scrollWidth,
//                 windowHeight: node.scrollHeight,
//             });

//             // -------------------------------------------------
//             // 3) jsPDF A4 landscape
//             // -------------------------------------------------
//             const doc = new jsPDF({
//                 orientation: 'landscape',
//                 unit: 'mm',
//                 format: 'a4',
//                 compress: true,
//             });

//             const pageW = doc.internal.pageSize.getWidth();   // 297mm
//             const pageH = doc.internal.pageSize.getHeight();  // 210mm

//             const FOOTER_RESERVED_MM = 10;
//             const usablePageH = pageH - FOOTER_RESERVED_MM;

//             const pxToMm = pageW / canvas.width;
//             const usablePagePx = usablePageH / pxToMm;

//             // -------------------------------------------------
//             // 4) Candidate break points = tops of each row + end
//             // -------------------------------------------------
//             const candidateBreaks = cssRowRects.map(
//                 (r) => r.top * scale
//             );
//             candidateBreaks.push(canvas.height);

//             const pageBreakPx = [];
//             let currentStart = 0;
//             let lastChosen = 0;

//             for (let i = 0; i < candidateBreaks.length; i++) {
//                 const candidateEnd = candidateBreaks[i];

//                 if (candidateEnd - currentStart > usablePagePx) {
//                     if (lastChosen > currentStart) {
//                         pageBreakPx.push(lastChosen);
//                         currentStart = lastChosen;
//                         i--;
//                         lastChosen = currentStart;
//                         continue;
//                     } else {
//                         const forced = currentStart + usablePagePx;
//                         pageBreakPx.push(forced);
//                         currentStart = forced;
//                         lastChosen = currentStart;
//                         continue;
//                     }
//                 }

//                 lastChosen = candidateEnd;
//             }

//             if (pageBreakPx[pageBreakPx.length - 1] !== canvas.height) {
//                 if (canvas.height - currentStart > usablePagePx) {
//                     pageBreakPx.push(currentStart + usablePagePx);
//                 }
//                 pageBreakPx.push(canvas.height);
//             }

//             const uniqueBreaks = Array.from(new Set(pageBreakPx))
//                 .filter((v) => v > 0)
//                 .sort((a, b) => a - b);

//             // -------------------------------------------------
//             // 5) Slice the canvas into per-page canvases
//             // -------------------------------------------------
//             let prevY = 0;
//             const pageCanvases = [];

//             for (const breakY of uniqueBreaks) {
//                 const sliceH = Math.round(breakY - prevY);
//                 if (sliceH <= 0) continue;

//                 const slice = document.createElement('canvas');
//                 slice.width = canvas.width;
//                 slice.height = sliceH;
//                 const sctx = slice.getContext('2d');
//                 sctx.fillStyle = '#ffffff';
//                 sctx.fillRect(0, 0, slice.width, slice.height);
//                 sctx.drawImage(
//                     canvas,
//                     0,
//                     Math.round(prevY),
//                     canvas.width,
//                     sliceH,
//                     0,
//                     0,
//                     canvas.width,
//                     sliceH
//                 );

//                 pageCanvases.push({ canvas: slice, cssHeight: sliceH / scale });
//                 prevY = breakY;
//             }

//             // -------------------------------------------------
//             // 6) Place each slice into a page
//             // -------------------------------------------------
//             const totalPages = pageCanvases.length;

//             for (let page = 0; page < totalPages; page++) {
//                 if (page > 0) doc.addPage();

//                 const { canvas: sliceCanvas } = pageCanvases[page];

//                 const sliceHmm = (sliceCanvas.height * pageW) / sliceCanvas.width;
//                 const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.95);

//                 doc.addImage(
//                     sliceImgData,
//                     'JPEG',
//                     0,
//                     0,
//                     pageW,
//                     sliceHmm,
//                     undefined,
//                     'FAST'
//                 );

//                 // ---- Page footer ----
//                 const footerY = pageH - 5;
//                 doc.setDrawColor(220, 220, 220);
//                 doc.setLineWidth(0.3);
//                 doc.line(15, footerY - 3, pageW - 15, footerY - 3);

//                 doc.setFont('helvetica', 'bold');
//                 doc.setFontSize(7.5);
//                 doc.setTextColor(164, 125, 82);
//                 doc.text(
//                     'BROKER CITY PROPERTIES',
//                     pageW / 2,
//                     footerY,
//                     { align: 'center' }
//                 );

//                 doc.setFont('helvetica', 'normal');
//                 doc.setFontSize(6.5);
//                 doc.setTextColor(140, 140, 140);
//                 doc.text(
//                     `Page ${page + 1} / ${totalPages}`,
//                     pageW - 15,
//                     footerY,
//                     { align: 'right' }
//                 );
//             }

//             // -------------------------------------------------
//             // 7) Save
//             // -------------------------------------------------
//             doc.save(`Monitor_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
//             toast.success('✅ تم تحميل ملف PDF');
//         } catch (err) {
//             console.error('PDF generation error:', err);
//             toast.error('❌ تعذر إنشاء ملف PDF');
//         } finally {
//             isGeneratingRef.current = false;
//             setIsGeneratingPdf(false);
//         }
//     };

//     // ---------- Totals ----------
//     const totalLeadNo = items.reduce((sum, it) => sum + (Number(it.lead_no) || 0), 0);
//     const totalReassignedLeadNo = items.reduce(
//         (sum, it) => sum + (Number(it.lead_reassigned_no) || 0),
//         0
//     );
//     const printGeneratedAt = new Date().toLocaleString('ar-EG');

//     // ---------- LOADING ----------
//     if (loading) {
//         return (
//             <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-5 rtl">
//                 <div className="w-12 h-12 border-4 border-[#f0ebe5] border-t-[#a47d52] rounded-full animate-spin"></div>
//                 <p className="text-[#a47d52] text-lg font-extrabold">جاري تحميل السجلات...</p>
//             </div>
//         );
//     }

//     // ---------- ERROR ----------
//     if (error) {
//         return (
//             <div className="min-h-screen bg-[#f8f7f5] flex flex-col justify-center items-center gap-4 p-5 text-center rtl">
//                 <span className="text-5xl">⚠️</span>
//                 <p className="text-red-500 text-lg font-extrabold">{error}</p>
//                 <button
//                     className="bg-[#a47d52] text-white px-8 py-3 rounded-full font-extrabold transition-colors hover:bg-[#8a6a44]"
//                     onClick={fetchItems}
//                 >
//                     إعادة المحاولة
//                 </button>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
//             {/* HEADER */}
//             <div className="no-print flex flex-col sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-8 md:mb-10 lg:mb-12 gap-4">
//                 <div className="text-center sm:text-right">
//                     <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-wide">
//                         المراقبة
//                     </h2>
//                     <p className="text-base md:text-lg text-gray-600 mt-1">
//                         إدارة سجلات المراقبة الخاصة بشركة بروكر سيتي
//                     </p>
//                 </div>
//                 <div className="flex flex-row gap-3">
//                     <button
//                         onClick={handleDownloadPDF}
//                         disabled={isGeneratingPdf || items.length === 0 || !pdfReady}
//                         className="bg-white border-2 border-[#a47d52] cursor-pointer text-[#a47d52] px-5 md:px-6 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#a47d52] hover:text-white hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                     >
//                         <MdPictureAsPdf className="text-xl" />
//                         {isGeneratingPdf ? 'جاري التحميل...' : 'تحميل PDF'}
//                     </button>
//                     <button
//                         className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
//                         onClick={() => setShowModal(true)}
//                     >
//                         + إضافة سجل
//                     </button>
//                 </div>
//             </div>

//             {/* FILTERS */}
//             <form
//                 onSubmit={handleApplyFilters}
//                 className="no-print bg-white rounded-2xl shadow-md border border-gray-100 max-w-7xl mx-auto px-4 md:px-6 py-5 mb-6"
//             >
//                 <div className="flex flex-row flex-wrap gap-3 items-end">
//                     <div className="flex-1 min-w-[180px]">
//                         <label className="block text-xs font-bold text-gray-600 mb-1">بحث</label>
//                         <input
//                             type="text"
//                             value={search}
//                             onChange={(e) => setSearch(e.target.value)}
//                             placeholder="اسم الوكيل / السبب / Lead No"
//                             className="w-full px-3 py-2 border-2 border-gray-200 rounded-sm focus:outline-none focus:border-[#a47d52] text-right"
//                             dir="rtl"
//                         />
//                     </div>

//                     <div className="flex-1 min-w-[150px]">
//                         <label className="block text-xs font-bold text-gray-600 mb-1">اليوم</label>
//                         <input
//                             type="date"
//                             value={day}
//                             onChange={(e) => setDay(e.target.value)}
//                             className="w-full px-3 py-2 border-2 border-gray-200 rounded-sm focus:outline-none focus:border-[#a47d52]"
//                         />
//                     </div>

//                     <div className="flex-1 min-w-[150px]">
//                         <label className="block text-xs font-bold text-gray-600 mb-1">الشهر</label>
//                         <select
//                             value={month}
//                             onChange={(e) => setMonth(e.target.value)}
//                             className="w-full px-3 py-2 border-2 border-gray-200 rounded-sm focus:outline-none focus:border-[#a47d52] text-right"
//                             dir="rtl"
//                         >
//                             <option value="">كل الشهور</option>
//                             {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
//                         </select>
//                     </div>

//                     <div className="flex-1 min-w-[150px]">
//                         <label className="block text-xs font-bold text-gray-600 mb-1">من تاريخ</label>
//                         <input
//                             type="date"
//                             value={fromDate}
//                             onChange={(e) => setFromDate(e.target.value)}
//                             className="w-full px-3 py-2 border-2 border-gray-200 rounded-sm focus:outline-none focus:border-[#a47d52]"
//                         />
//                     </div>

//                     <div className="flex-1 min-w-[150px]">
//                         <label className="block text-xs font-bold text-gray-600 mb-1">إلى تاريخ</label>
//                         <input
//                             type="date"
//                             value={toDate}
//                             onChange={(e) => setToDate(e.target.value)}
//                             className="w-full px-3 py-2 border-2 border-gray-200 rounded-sm focus:outline-none focus:border-[#a47d52]"
//                         />
//                     </div>

//                     <div className="flex gap-2">
//                         <button
//                             type="submit"
//                             className="cursor-pointer bg-[#a47d52] text-white px-5 py-2 rounded-sm font-extrabold text-sm hover:bg-[#8a6a44] transition-all"
//                         >
//                             تطبيق
//                         </button>
//                         <button
//                             type="button"
//                             onClick={handleClearFilters}
//                             className="cursor-pointer bg-gray-200 text-gray-700 px-5 py-2 rounded-sm font-extrabold text-sm hover:bg-gray-300 transition-all"
//                         >
//                             مسح
//                         </button>
//                     </div>
//                 </div>
//             </form>

//             {/* TABLE */}
//             <div className="no-print max-w-7xl mx-auto px-4 md:px-6">
//                 {items.length === 0 ? (
//                     <div className="bg-white rounded-2xl shadow-md border border-gray-100 py-16 text-center">
//                         <span className="text-6xl">📋</span>
//                         <h3 className="text-2xl font-extrabold text-gray-800 mt-4">لا توجد سجلات</h3>
//                         <p className="text-gray-600 mt-2">لم يتم العثور على أي سجلات مطابقة.</p>
//                     </div>
//                 ) : (
//                     <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
//                         <div className="overflow-x-auto">
//                             <table className="w-full text-right">
//                                 <thead className="bg-[#f8f7f5] border-b-2 border-[#a47d52]">
//                                     <tr>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">#</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">التاريخ</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">الشهر</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">Lead No</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">Lead Reassigned No</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">الوكيل</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">عدد ليدات الوكيل</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">مدة الاتصال</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">تعليق الوكيل</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">سحوبات</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">عدد السحوبات</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">سبب السحب</th>
//                                         <th className="px-4 py-3 text-sm font-extrabold text-gray-700">إجراءات</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {items.map((item, idx) => (
//                                         <tr
//                                             key={item.id}
//                                             className="border-b border-gray-100 hover:bg-[#faf9f7] transition-colors"
//                                         >
//                                             <td className="px-4 py-3 text-sm text-gray-500 font-bold">{idx + 1}</td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.date || '—'}</td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.month || '—'}</td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.lead_no ?? '—'}</td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.lead_reassigned_no ?? '—'}</td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.agent || '—'}</td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.agent_lead_no ?? '—'}</td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold">
//                                                 {item.agent_contact_duration != null
//                                                     ? `${item.agent_contact_duration} دقيقة`
//                                                     : '—'}
//                                             </td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold max-w-[220px] truncate">
//                                                 {item.agent_contact_comment || '—'}
//                                             </td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.draws ?? '—'}</td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.draws_no ?? '—'}</td>
//                                             <td className="px-4 py-3 text-sm text-gray-800 font-semibold max-w-[200px] truncate">
//                                                 {item.draws_cause || '—'}
//                                             </td>
//                                             <td className="px-4 py-3">
//                                                 <button
//                                                     onClick={() => handleDelete(item.id)}
//                                                     disabled={deletingId === item.id}
//                                                     className={`p-2 rounded-full transition-all duration-300
//                                                         ${deletingId === item.id
//                                                             ? 'bg-gray-300 cursor-not-allowed'
//                                                             : 'bg-red-50 hover:bg-red-100 hover:scale-110 active:scale-95 cursor-pointer'
//                                                         }`}
//                                                     title="حذف السجل"
//                                                 >
//                                                     {deletingId === item.id ? (
//                                                         <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                                                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                                                         </svg>
//                                                     ) : (
//                                                         <MdDeleteForever className="text-red-500 text-2xl" />
//                                                     )}
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 )}
//             </div>

//             {/* HIDDEN PDF RENDER TARGET */}
//             {pdfReady && (
//                 <PdfRenderTarget
//                     ref={renderRef}
//                     items={items}
//                     totalLeadNo={totalLeadNo}
//                     totalReassignedLeadNo={totalReassignedLeadNo}
//                     generatedAt={printGeneratedAt}
//                 />
//             )}

//             {/* MODAL */}
//             {showModal && (
//                 <AddMonitor
//                     onClose={handleCloseModal}
//                     onSuccess={() => {
//                         fetchItems();
//                     }}
//                 />
//             )}
//         </div>
//     );
// };

// export default Monitor;


