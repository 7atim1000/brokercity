
// LeadsStagesGuide.jsx
// npm install jspdf html2canvas

import React, { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaFilePdf, FaSpinner, FaPrint } from 'react-icons/fa';

// ⬇️ Adjust this path to wherever your logo lives
import brokerCityLogo from '../../assets/images/logogo-removebg_old.png';

// =============================================================
// STAGE DATA
// =============================================================
const STAGES = [
    { num: 1,  en: 'Fresh Lead',  ar: 'عميل جديد', color: '#d9f2f5', textColor: '#0f3d3e',
      explain: 'عبارة عن عميل جديد ، تم إدخاله إلى النظام للتو.' },
    { num: 2,  en: 'Reassign Lead', ar: 'عميل تم إعادة توزيعه', color: '#3fc6f0', textColor: '#ffffff',
      explain: 'تم إعادة توزيع العميل على موظف آخر' },
    { num: 3,  en: 'Lead Accepted', ar: 'تم قبول الطلب', color: '#0d3f8f', textColor: '#ffffff',
      explain: 'تم قبول العميل من قِبَل الموظف المسؤول، وأصبح مسؤولاً عن متابعته من هذه المرحلة.' },
    { num: 4,  en: 'Contact Attempt', ar: 'محاولة التواصل', color: '#8fd1b0', textColor: '#0f3d3e',
      explain: 'تمت محاولة التواصل مع العميل (اتصال أو رسالة) لكن لم يتم الرد أو لم تكتمل المحادثة بعد.' },
    { num: 5,  en: 'Lead Contacted', ar: 'تم التواصل', color: '#ffe600', textColor: '#3d2f00',
      explain: 'تم التواصل الفعلي مع العميل والتأكد من اهتمامه المبدئي .' },
    { num: 6,  en: 'Hold Lead', ar: 'عميل محتمل', color: '#9c9c9c', textColor: '#ffffff',
      explain: 'العميل مهتم ولكن ليس في الوقت الحالي، تم تأجيل المتابعة معه إلى وقت لاحق.' },
    { num: 7,  en: 'Requirements Identification.', ar: 'تحديد المتطلبات', color: '#f4a26b', textColor: '#3d1f00',
      explain: 'تم تحديد متطلبات العميل بدقة ومعرفة طلبه.' },
    { num: 8,  en: 'Property Matching', ar: 'مطابقة العقار', color: '#f08b1c', textColor: '#ffffff',
      explain: 'تم البحث عن العقارات المتوافقة مع متطلبات العميل وترشيحها له.' },
    { num: 9,  en: 'Client Interested', ar: 'العميل مهتم', color: '#7ac943', textColor: '#1b3d00',
      explain: 'أبدى العميل اهتماماً حقيقياً بعقار أو أكثر من العقارات المُرشحة له.' },
    { num: 10, en: 'Viewing / Meeting Scheduled', ar: 'تحديد موعد معاينة / اجتماع', color: '#00b7a5', textColor: '#ffffff',
      explain: 'تم الاتفاق مع العميل على موعد محدد لمعاينة العقار أو الاجتماع مع المطور' },
    { num: 11, en: 'Viewing / Meeting Completed', ar: 'تمت المعاينة / الاجتماع', color: '#1aa46a', textColor: '#ffffff',
      explain: 'تمت معاينة العقار فعلياً من قِبَل العميل، ونُقلت ملاحظاته وانطباعه.' },
    { num: 12, en: 'Offer & Negotiation', ar: 'العرض والتفاوض', color: '#8d6ad6', textColor: '#ffffff',
      explain: 'تم تقديم عرض السعر للعميل وبدأت مرحلة التفاوض على الشروط والسعر.' },
    { num: 13, en: 'Collecting Documents', ar: 'جمع المستندات', color: '#8d3ba8', textColor: '#ffffff',
      explain: 'تم البدء في جمع المستندات المطلوبة من العميل (جواز السفر - الهوية - البيانات المالية وغيرها).' },
    { num: 14, en: 'Reservation Agreement (MOU / Quotation)', ar: 'اتفاقية الحجز / عرض السعر (MOU / Quotation)', color: '#2fbfa0', textColor: '#ffffff',
      explain: 'تم توقيع اتفاقية الحجز أو إصدار عرض السعر الرسمي بين الطرفين (البائع/المشتري) (المؤجر/المستأجر)' },
    { num: 15, en: 'Continue Sale / Leasing Process', ar: 'استمرار عملية البيع / التأجير', color: '#1f6b3a', textColor: '#ffffff',
      explain: 'تم الانتقال إلى إجراءات البيع أو الإيجار الرسمية حتى الإتمام النهائي.' },
    { num: 16, en: 'Closed (Won)', ar: 'مغلق (ناجح)', color: '#c1e04a', textColor: '#2d3d00',
      explain: 'تمت الصفقة (البيع / التأجير) بنجاح' },
    { num: 17, en: 'Closed (Lost)', ar: 'مغلق (غير ناجح)', color: '#ff4d4d', textColor: '#ffffff',
      explain: 'تم إغلاق الملف دون إتمام الصفقة، إما لعدم رغبة العميل أو لظروف أخرى.' },
];

// =============================================================
// HIDDEN PDF RENDER TARGET
// =============================================================
const PdfRenderTarget = React.forwardRef((_, ref) => (
    <div
        ref={ref}
        dir="rtl"
        lang="ar"
        data-pdf-root="true"
        style={{
            width: '794px',
            minHeight: '1123px',
            padding: '40px 40px 56px 40px',
            background: '#ffffff',
            boxSizing: 'border-box',
            fontFamily:
                '"Cairo", "Tajawal", "Segoe UI", "Tahoma", "Arial", sans-serif',
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
                paddingBottom: '18px',
                marginBottom: '22px',
            }}
        >
            <img
                src={brokerCityLogo}
                alt="Broker City Properties"
                style={{
                    height: '80px',
                    objectFit: 'contain',
                    marginBottom: '12px',
                }}
                crossOrigin="anonymous"
            />

            <h1
                style={{
                    color: '#a47d52',
                    fontSize: '22px',
                    fontWeight: 800,
                    margin: 0,
                    lineHeight: 1.5,
                }}
            >
                قسم المتابعة والجودة
            </h1>

            <h2
                style={{
                    color: '#1f2937',
                    fontSize: '17px',
                    fontWeight: 700,
                    marginTop: '6px',
                    lineHeight: 1.6,
                }}
            >
                دليل تحويل حالات التواصل مع العملاء
            </h2>
        </header>

        {/* ================= BODY ================= */}
        <main data-pdf-block="body">
            {STAGES.map((stage) => (
                <div
                    key={stage.num}
                    data-pdf-stage="true"
                    style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #e5e7eb',
                        marginBottom: '8px',
                        pageBreakInside: 'avoid',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: stage.color,
                            color: stage.textColor,
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '14px',
                            fontWeight: 800,
                        }}
                    >
                        <span style={{ fontWeight: 900, fontSize: '14px' }}>
                            {stage.num}.
                        </span>

                        <span style={{ fontWeight: 800 }}>
                            {stage.ar}
                        </span>

                        <span style={{ margin: '0 4px' }}>-</span>

                        <span
                            dir="ltr"
                            style={{ fontWeight: 800, direction: 'ltr' }}
                        >
                            {stage.en}
                        </span>
                    </div>

                    <div
                        style={{
                            background: '#ffffff',
                            padding: '10px 16px',
                            color: '#374151',
                            fontSize: '14px',
                            lineHeight: 2,
                            fontWeight: 500,
                        }}
                    >
                        {stage.explain}
                    </div>
                </div>
            ))}
        </main>

        {/* ================= FOOTER ================= */}
        <footer
            data-pdf-block="footer"
            style={{
                marginTop: '28px',
                paddingTop: '14px',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '11px',
                lineHeight: 1.6,
            }}
        >
            <div
                style={{
                    color: '#a47d52',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    direction: 'ltr',
                }}
            >
                BROKER CITY PROPERTIES - L.L.C - S.P.C
            </div>
            <div style={{ direction: 'ltr', marginTop: '2px' }}>
                P.O.BOX : 7833 Abu Dhabi - U.A.E &nbsp;|&nbsp; +971 50 2000 195 &nbsp;|&nbsp; ☎ +971 2 6666 101
            </div>
        </footer>
    </div>
));
PdfRenderTarget.displayName = 'PdfRenderTarget';

// =============================================================
// MAIN COMPONENT
// =============================================================
const LeadsStagesGuide = () => {
    const renderRef = useRef(null);
    const isGenerating = useRef(false);
    const [generating, setGenerating] = useState(false);
    const [ready, setReady] = useState(false);

    // Wait for fonts (Cairo) to load before rasterizing
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
            setReady(true);
        };
        ensureFonts();
    }, []);

    // =========================================================
    // GENERATE PDF — jsPDF + html2canvas (Arabic-safe + smart slicing)
    // =========================================================
    const generatePDF = async () => {
        if (isGenerating.current || !renderRef.current) return;
        isGenerating.current = true;
        setGenerating(true);

        try {
            const node = renderRef.current;

            // -------------------------------------------------
            // 1) Measure exact Y positions of each stage card
            //    relative to the root node's top, so we can slice
            //    the canvas in the gaps BETWEEN cards.
            // -------------------------------------------------
            const rootRect = node.getBoundingClientRect();
            const stageEls = node.querySelectorAll('[data-pdf-stage="true"]');

            // CSS px positions -> convert to canvas px via scale
            const cssStageRects = Array.from(stageEls).map((el) => {
                const r = el.getBoundingClientRect();
                return {
                    top: r.top - rootRect.top,
                    bottom: r.bottom - rootRect.top,
                };
            });

            const totalCssHeight = node.scrollHeight;

            // -------------------------------------------------
            // 2) Rasterize the full HTML block ONCE
            // -------------------------------------------------
            const scale = 2.5;
            const canvas = await html2canvas(node, {
                scale,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: node.scrollWidth,
                windowHeight: node.scrollHeight,
            });

            // -------------------------------------------------
            // 3) Compute the pixel-per-mm ratio for A4
            //    We fit the whole document width to A4 width.
            // -------------------------------------------------
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true,
            });

            const pageW = doc.internal.pageSize.getWidth();  // 210mm
            const pageH = doc.internal.pageSize.getHeight(); // 297mm

            // Reserve space at bottom for the PDF footer (drawn by jsPDF)
            const FOOTER_RESERVED_MM = 12;
            const usablePageH = pageH - FOOTER_RESERVED_MM;

            // Canvas px -> mm conversion
            const pxToMm = pageW / canvas.width;

            // -------------------------------------------------
            // 4) Build page break positions (in canvas px)
            //    We want the break to land in the GAP between
            //    two stage cards, close to usablePageH.
            // -------------------------------------------------
            const usablePagePx = usablePageH / pxToMm;

            // Candidate break points = the "top" of each stage minus a small gap,
            // plus the very end of the document.
            const candidateBreaks = cssStageRects.map(
                (r) => r.top * scale
            );
            candidateBreaks.push(canvas.height);

            const pageBreakPx = []; // collection of Y positions where a page should end
            let currentStart = 0;
            let lastChosen = 0;

            // Walk through candidates, greedily pick the farthest
            // candidate that still fits on the current page.
            for (let i = 0; i < candidateBreaks.length; i++) {
                const candidateEnd = candidateBreaks[i];

                if (candidateEnd - currentStart > usablePagePx) {
                    // Candidate doesn't fit — use the previous one as page end
                    if (lastChosen > currentStart) {
                        pageBreakPx.push(lastChosen);
                        currentStart = lastChosen;
                        // restart scanning from this candidate
                        i--;
                        lastChosen = currentStart;
                        continue;
                    } else {
                        // No candidate fits at all — force break at usable height
                        const forced = currentStart + usablePagePx;
                        pageBreakPx.push(forced);
                        currentStart = forced;
                        lastChosen = currentStart;
                        continue;
                    }
                }

                lastChosen = candidateEnd;
            }

            // Ensure the final break lands exactly at the end of canvas
            if (pageBreakPx[pageBreakPx.length - 1] !== canvas.height) {
                if (canvas.height - currentStart > usablePagePx) {
                    pageBreakPx.push(currentStart + usablePagePx);
                }
                pageBreakPx.push(canvas.height);
            }

            // Remove duplicates and sort
            const uniqueBreaks = Array.from(new Set(pageBreakPx))
                .filter((v) => v > 0)
                .sort((a, b) => a - b);

            // -------------------------------------------------
            // 5) Slice the canvas into per-page canvases
            // -------------------------------------------------
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

            // -------------------------------------------------
            // 6) Place each slice into a page
            // -------------------------------------------------
            const totalPages = pageCanvases.length;

            for (let page = 0; page < totalPages; page++) {
                if (page > 0) doc.addPage();

                const { canvas: sliceCanvas } = pageCanvases[page];

                // Slice height in mm at A4 width
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

                // ---- Page footer (drawn by jsPDF, always crisp) ----
                const footerY = pageH - 6;
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.3);
                doc.line(15, footerY - 4, pageW - 15, footerY - 4);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(164, 125, 82);
                doc.text(
                    'BROKER CITY PROPERTIES',
                    pageW / 2,
                    footerY,
                    { align: 'center' }
                );

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(140, 140, 140);
                doc.text(
                    `Page ${page + 1} / ${totalPages}`,
                    pageW - 15,
                    footerY,
                    { align: 'right' }
                );
            }

            // -------------------------------------------------
            // 7) Save
            // -------------------------------------------------
            doc.save('دليل_مراحل_العملاء_BrokerCity.pdf');
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('حدث خطأ أثناء إنشاء ملف PDF.');
        } finally {
            isGenerating.current = false;
            setGenerating(false);
        }
    };

    const handlePrint = () => window.print();

    return (
        <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8" dir="rtl">
            {/* Toolbar */}
            <div className="max-w-[210mm] mx-auto mb-4 flex flex-wrap items-center justify-center gap-3 no-print">
                <button
                    onClick={generatePDF}
                    disabled={generating || !ready}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#a47d52] text-white font-extrabold shadow-md hover:bg-[#8a6a44] active:scale-95 transition disabled:opacity-60"
                >
                    {generating ? (
                        <>
                            <FaSpinner className="animate-spin" />
                            جاري إنشاء PDF...
                        </>
                    ) : (
                        <>
                            <FaFilePdf />
                            تحميل PDF
                        </>
                    )}
                </button>

                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[#a47d52] border-2 border-[#a47d52]/40 font-extrabold shadow-sm hover:bg-[#a47d52]/10 active:scale-95 transition"
                >
                    <FaPrint />
                    طباعة
                </button>
            </div>

            {/* On-screen A4 preview — same design as PDF */}
            <div
                className="mx-auto bg-white shadow-xl"
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '14mm 14mm 16mm 14mm',
                    boxSizing: 'border-box',
                }}
            >
                <header className="flex flex-col items-center text-center border-b-2 border-[#a47d52] pb-5 mb-6">
                    <img
                        src={brokerCityLogo}
                        alt="Broker City Properties"
                        style={{
                            height: '80px',
                            objectFit: 'contain',
                            marginBottom: '12px',
                        }}
                    />
                    <h1
                        className="font-extrabold text-[#a47d52]"
                        style={{ fontSize: '20px', margin: 0, lineHeight: 1.5 }}
                    >
                        قسم المتابعة والجودة
                    </h1>
                    <h2
                        className="font-bold text-gray-800"
                        style={{ fontSize: '16px', marginTop: '6px', lineHeight: 1.6 }}
                    >
                        إرشادات تحويل حالات التواصل مع العملاء
                    </h2>
                </header>

                <main className="space-y-2">
                    {STAGES.map((stage) => (
                        <div
                            key={stage.num}
                            className="rounded-lg overflow-hidden border border-slate-200"
                            style={{ pageBreakInside: 'avoid' }}
                        >
                            <div
                                className="px-3 py-2 flex items-center gap-2 font-extrabold"
                                style={{
                                    backgroundColor: stage.color,
                                    color: stage.textColor,
                                    fontSize: '13px',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.35)',
                                        color: stage.textColor,
                                        fontWeight: 900,
                                        fontSize: '12px',
                                    }}
                                >
                                    {stage.num}
                                </span>
                                <span>{stage.ar}</span>
                                <span className="mx-1">-</span>
                                <span style={{ direction: 'ltr' }}>{stage.en}</span>
                            </div>
                            <div
                                className="bg-white px-4 py-2 text-gray-700"
                                style={{ fontSize: '12.5px', lineHeight: '1.75' }}
                            >
                                {stage.explain}
                            </div>
                        </div>
                    ))}
                </main>

                <footer
                    className="mt-8 pt-4 border-t border-slate-200 text-center text-slate-500"
                    style={{ fontSize: '10px', lineHeight: '1.6' }}
                >
                    <div
                        className="font-extrabold text-[#a47d52] tracking-wide"
                        style={{ direction: 'ltr' }}
                    >
                        BROKER CITY PROPERTIES - L.L.C - S.P.C
                    </div>
                    <div style={{ direction: 'ltr' }}>
                        P.O.BOX : 7833 Abu Dhabi - U.A.E &nbsp;|&nbsp; +971 50 2000 195 &nbsp;|&nbsp; ☎ +971 2 6666 101
                    </div>
                </footer>
            </div>

            {/* Hidden render target for PDF */}
            {ready && <PdfRenderTarget ref={renderRef} />}

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; }
                    @page { size: A4; margin: 0; }
                }
            `}</style>
        </div>
    );
};

export default LeadsStagesGuide;