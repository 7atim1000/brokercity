// LeadsStagesGuide.jsx
// npm install jspdf jspdf-autotable

import React, { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFilePdf, FaSpinner, FaPrint } from 'react-icons/fa';

// ⬇️ Adjust this path to wherever your logo lives
import brokerCityLogo from '../assets/images/logogo-removebg_old.png';

// =============================================================
// STAGE DATA — Full list with Arabic explanations
// =============================================================
const STAGES = [
    {
        num: 1,
        en: 'Fresh Lead',
        ar: 'عميل جديد',
        color: [217, 242, 245],
        textColor: [15, 61, 62],
        explain:
            'عبارة عن عميل جديد لم يسبق التواصل معه، تم إدخاله إلى النظام للتو. لا توجد أي محاولة تواصل سابقة معه.',
    },
    {
        num: 2,
        en: 'Reassign Lead',
        ar: 'عميل تم إعادة توزيعه',
        color: [63, 198, 240],
        textColor: [255, 255, 255],
        explain:
            'تم إعادة توزيع العميل على موظف مبيعات آخر، إما بسبب عدم التمكن من متابعته أو لتغيير مسؤول المتابعة.',
    },
    {
        num: 3,
        en: 'Lead Accepted',
        ar: 'تم قبول الطلب',
        color: [13, 63, 143],
        textColor: [255, 255, 255],
        explain:
            'تم قبول العميل من قِبَل موظف المبيعات المسؤول، وأصبح مسؤولاً عن متابعته من هذه المرحلة.',
    },
    {
        num: 4,
        en: 'Contact Attempt',
        ar: 'محاولة التواصل',
        color: [143, 209, 176],
        textColor: [15, 61, 62],
        explain:
            'تمت محاولة التواصل مع العميل (اتصال أو رسالة) لكن لم يتم الرد أو لم تكتمل المحادثة بعد.',
    },
    {
        num: 5,
        en: 'Lead Contacted',
        ar: 'تم التواصل',
        color: [255, 230, 0],
        textColor: [61, 47, 0],
        explain:
            'تم التواصل الفعلي مع العميل وتم الرد عليه، وتم التأكد من اهتمامه المبدئي بالعقار.',
    },
    {
        num: 6,
        en: 'Hold Lead',
        ar: 'عميل مستقبلي',
        color: [156, 156, 156],
        textColor: [255, 255, 255],
        explain:
            'العميل مهتم ولكن ليس في الوقت الحالي، تم تأجيل المتابعة معه إلى وقت لاحق.',
    },
    {
        num: 7,
        en: 'Requirements Ident.',
        ar: 'تحديد المتطلبات',
        color: [244, 162, 107],
        textColor: [61, 31, 0],
        explain:
            'تم تحديد متطلبات العميل بدقة (النوع، المساحة، الموقع، الميزانية، طريقة الدفع).',
    },
    {
        num: 8,
        en: 'Property Matching',
        ar: 'مطابقة العقار',
        color: [240, 139, 28],
        textColor: [255, 255, 255],
        explain:
            'تم البحث عن العقارات المتوافقة مع متطلبات العميل وترشيحها له.',
    },
    {
        num: 9,
        en: 'Client Interested',
        ar: 'العميل مهتم',
        color: [122, 201, 67],
        textColor: [27, 61, 0],
        explain:
            'أبدى العميل اهتماماً حقيقياً بعقار أو أكثر من العقارات المُرشحة له.',
    },
    {
        num: 10,
        en: 'Viewing Scheduled',
        ar: 'تحديد موعد المعاينة',
        color: [0, 183, 165],
        textColor: [255, 255, 255],
        explain:
            'تم الاتفاق مع العميل على موعد محدد لمعاينة العقار.',
    },
    {
        num: 11,
        en: 'Viewing Completed',
        ar: 'تمت المعاينة',
        color: [26, 164, 106],
        textColor: [255, 255, 255],
        explain:
            'تمت معاينة العقار فعلياً من قِبَل العميل، ونُقلت ملاحظاته وانطباعه.',
    },
    {
        num: 12,
        en: 'Offer & Negotiation',
        ar: 'العرض والتفاوض',
        color: [141, 106, 214],
        textColor: [255, 255, 255],
        explain:
            'تم تقديم عرض السعر للعميل وبدأت مرحلة التفاوض على الشروط والأسعار.',
    },
    {
        num: 13,
        en: 'Collecting Documents',
        ar: 'جمع المستندات',
        color: [141, 59, 168],
        textColor: [255, 255, 255],
        explain:
            'تم البدء في جمع المستندات المطلوبة من العميل (الهوية، البيانات المالية، وغيرها).',
    },
    {
        num: 14,
        en: 'Reservation Agreement (MOU / Quotation)',
        ar: 'اتفاقية الحجز (MOU / Quotation)',
        color: [47, 191, 160],
        textColor: [255, 255, 255],
        explain:
            'تم توقيع اتفاقية الحجز أو إصدار عرض السعر الرسمي بين الطرفين.',
    },
    {
        num: 15,
        en: 'Continue Sale / Leasing Process',
        ar: 'استمرار البيع',
        color: [31, 107, 58],
        textColor: [255, 255, 255],
        explain:
            'تم الانتقال إلى إجراءات البيع أو الإيجار الرسمية حتى الإتمام النهائي.',
    },
    {
        num: 16,
        en: 'Closed (Won)',
        ar: 'مغلق (ناجح)',
        color: [193, 224, 74],
        textColor: [45, 61, 0],
        explain:
            'تمت العملية بنجاح وإغلاق الملف لصالح الشركة. العميل أصبح عميلاً فعلياً.',
    },
    {
        num: 17,
        en: 'Closed (Lost)',
        ar: 'مغلق (غير ناجح)',
        color: [255, 77, 77],
        textColor: [255, 255, 255],
        explain:
            'تم إغلاق الملف دون إتمام الصفقة، إما لعدم رغبة العميل أو لظروف أخرى.',
    },
];

// =============================================================
// COMPONENT
// =============================================================
const LeadsStagesGuide = () => {
    const isGenerating = useRef(false);
    const [generating, setGenerating] = useState(false);
    const [logoBase64, setLogoBase64] = useState(null);
    const [fontBase64, setFontBase64] = useState(null);
    const [fontLoaded, setFontLoaded] = useState(false);

    // ---- Load logo as base64 on mount ----
    useEffect(() => {
        let cancelled = false;

        const loadLogo = async () => {
            try {
                const res = await fetch(brokerCityLogo);
                const blob = await res.blob();
                const reader = new FileReader();

                reader.onloadend = () => {
                    if (!cancelled) {
                        setLogoBase64(reader.result);
                    }
                };

                reader.readAsDataURL(blob);
            } catch (err) {
                console.error('Failed to load logo:', err);
            }
        };

        loadLogo();

        return () => {
            cancelled = true;
        };
    }, []);

    // ---- Load Arabic font as base64 (optional but recommended) ----
    // Place an Arabic TTF at: src/assets/fonts/Cairo-Regular.ttf
    // If the file is missing, we simply skip — the PDF will still
    // generate but Arabic glyphs may not render.
    useEffect(() => {
        let cancelled = false;

        const loadFont = async () => {
            try {
                const fontUrl = new URL(
                    '../../assets/fonts/Cairo-Regular.ttf',
                    import.meta.url
                ).href;

                const res = await fetch(fontUrl);
                if (!res.ok) throw new Error('Font not found');

                const blob = await res.blob();
                const reader = new FileReader();

                reader.onloadend = () => {
                    if (!cancelled) {
                        setFontBase64(reader.result);
                    }
                };

                reader.readAsDataURL(blob);
            } catch (err) {
                console.warn(
                    'Arabic font not loaded — Arabic text may not render in PDF:',
                    err
                );
            }
        };

        loadFont();

        return () => {
            cancelled = true;
        };
    }, []);

    // =========================================================
    // GENERATE PDF — using jsPDF + jspdf-autotable
    // =========================================================
    const generatePDF = () => {
        if (isGenerating.current) return;
        isGenerating.current = true;
        setGenerating(true);

        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pageW = doc.internal.pageSize.getWidth(); // 210
            const pageH = doc.internal.pageSize.getHeight(); // 297
            const margin = 15;

            // =====================================================
            // Register Arabic font (if available)
            // =====================================================
            let arabicFontName = 'helvetica';
            if (fontBase64) {
                try {
                    doc.addFileToVFS('Cairo-Regular.ttf', fontBase64);
                    doc.addFont(
                        'Cairo-Regular.ttf',
                        'Cairo',
                        'normal'
                    );
                    doc.addFont(
                        'Cairo-Regular.ttf',
                        'Cairo',
                        'bold'
                    );
                    arabicFontName = 'Cairo';
                } catch (err) {
                    console.error('Font registration error:', err);
                }
            }

            // =====================================================
            // 1) HEADER — flex-col: logo, Arabic line 1, Arabic line 2
            // =====================================================
            const headerHeight = 48;

            // White background
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageW, headerHeight, 'F');

            // Logo — centered horizontally, pinned near top
            if (logoBase64) {
                try {
                    const logoW = 40;
                    const logoH = 34;
                    const logoX = (pageW - logoW) / 2;
                    const logoY = 4;

                    doc.addImage(
                        logoBase64,
                        'PNG',
                        logoX,
                        logoY,
                        logoW,
                        logoH,
                        undefined,
                        'FAST'
                    );
                } catch (err) {
                    console.error('Logo render error:', err);
                }
            }

            // Arabic line 1 — قسم المتابعة والجودة
            doc.setFont(arabicFontName, 'bold');
            doc.setFontSize(16);
            doc.setTextColor(164, 125, 82); // #a47d52
            doc.text('قسم المتابعة والجودة', pageW / 2, 44, {
                align: 'center',
            });

            // Arabic line 2 — إرشادات تحويل حالات التواصل مع العملاء
            doc.setFont(arabicFontName, 'normal');
            doc.setFontSize(12);
            doc.setTextColor(40, 40, 40);
            doc.text(
                'إرشادات تحويل حالات التواصل مع العملاء',
                pageW / 2,
                50,
                { align: 'center' }
            );

            // Gold separator line under the header
            doc.setDrawColor(164, 125, 82);
            doc.setLineWidth(0.8);
            doc.line(margin, 54, pageW - margin, 54);

            // =====================================================
            // 2) STAGES — each stage is a small 2-row block
            // =====================================================
            let cursorY = 60;

            const stageNumberW = 12; // circle width
            const headerRowH = 8;    // colored bar height
            const bodyRowH = 12;     // explanation height (grows)
            const gapBetweenStages = 3;

            STAGES.forEach((stage) => {
                // Calculate explanation height based on text length
                doc.setFont(arabicFontName, 'normal');
                doc.setFontSize(10);

                const maxTextW = pageW - margin * 2 - 4;
                const lines = doc.splitTextToSize(
                    stage.explain,
                    maxTextW
                );
                const lineHeight = 4.8;
                const explainH = Math.max(
                    bodyRowH,
                    lines.length * lineHeight + 4
                );

                const blockH = headerRowH + explainH;

                // ---- Page break check ----
                if (cursorY + blockH + gapBetweenStages > pageH - 20) {
                    doc.addPage();
                    cursorY = 20;
                }

                // =================================================
                // Header colored bar
                // =================================================
                doc.setFillColor(...stage.color);
                doc.rect(
                    margin,
                    cursorY,
                    pageW - margin * 2,
                    headerRowH,
                    'F'
                );

                // Number circle
                doc.setFillColor(255, 255, 255);
                doc.circle(
                    pageW - margin - 6,
                    cursorY + headerRowH / 2,
                    3,
                    'F'
                );
                doc.setFont(arabicFontName, 'bold');
                doc.setFontSize(9);
                doc.setTextColor(...stage.textColor);
                doc.text(
                    String(stage.num),
                    pageW - margin - 6,
                    cursorY + headerRowH / 2 + 0.9,
                    { align: 'center' }
                );

                // English + Arabic title inside the bar
                doc.setFontSize(10);
                doc.setFont(arabicFontName, 'bold');
                doc.setTextColor(...stage.textColor);
                doc.text(
                    `${stage.en}  -  ${stage.ar}`,
                    pageW - margin - 12,
                    cursorY + headerRowH / 2 + 1.2,
                    { align: 'right' }
                );

                cursorY += headerRowH;

                // =================================================
                // Explanation block (white bg, thin border)
                // =================================================
                doc.setDrawColor(230, 230, 230);
                doc.setLineWidth(0.15);
                doc.rect(
                    margin,
                    cursorY,
                    pageW - margin * 2,
                    explainH,
                    'S'
                );

                doc.setFont(arabicFontName, 'normal');
                doc.setFontSize(10);
                doc.setTextColor(60, 60, 60);
                doc.text(lines, pageW - margin - 3, cursorY + 5, {
                    align: 'right',
                    lineHeightFactor: 1.5,
                });

                cursorY += explainH + gapBetweenStages;
            });

            // =====================================================
            // 3) FOOTER on every page
            // =====================================================
            const totalPages = doc.internal.getNumberOfPages();

            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);

                const footerY = pageH - 12;

                // Thin gray line
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.3);
                doc.line(margin, footerY - 2, pageW - margin, footerY - 2);

                // Company name — gold, centered
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(164, 125, 82);
                doc.text(
                    'BROKER CITY PROPERTIES - L.L.C - S.P.C',
                    pageW / 2,
                    footerY + 2,
                    { align: 'center' }
                );

                // Address / phones — dark gray, centered
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(120, 120, 120);
                doc.text(
                    'P.O.BOX : 7833 Abu Dhabi - U.A.E   |   +971 50 2000 195   |   ☎ +971 2 6666 101',
                    pageW / 2,
                    footerY + 6,
                    { align: 'center' }
                );

                // Page number — right
                doc.setFontSize(7.5);
                doc.setTextColor(160, 160, 160);
                doc.text(
                    `Page ${p} / ${totalPages}`,
                    pageW - margin,
                    footerY + 6,
                    { align: 'right' }
                );
            }

            // =====================================================
            // 4) SAVE
            // =====================================================
            const fileName = 'دليل_مراحل_العملاء_BrokerCity.pdf';
            doc.save(fileName);

            setFontLoaded(true);
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('حدث خطأ أثناء إنشاء ملف PDF.');
        } finally {
            isGenerating.current = false;
            setGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8" dir="rtl">
            {/* ---------- Toolbar ---------- */}
            <div className="max-w-[210mm] mx-auto mb-4 flex flex-wrap items-center justify-center gap-3 no-print">
                <button
                    onClick={generatePDF}
                    disabled={generating}
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

            {/* ---------- A4 preview (unchanged) ---------- */}
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
                                    backgroundColor: `rgb(${stage.color.join(',')})`,
                                    color: `rgb(${stage.textColor.join(',')})`,
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
                                        color: `rgb(${stage.textColor.join(',')})`,
                                        fontWeight: 900,
                                        fontSize: '12px',
                                    }}
                                >
                                    {stage.num}
                                </span>
                                <span style={{ direction: 'ltr' }}>{stage.en}</span>
                                <span className="mx-1">-</span>
                                <span>{stage.ar}</span>
                            </div>
                            <div
                                className="bg-white px-4 py-2 text-gray-700"
                                style={{ fontSize: '12.5px', lineHeight: 1.75 }}
                            >
                                {stage.explain}
                            </div>
                        </div>
                    ))}
                </main>

                <footer
                    className="mt-8 pt-4 border-t border-slate-200 text-center text-slate-500"
                    style={{ fontSize: '10px', lineHeight: 1.6 }}
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