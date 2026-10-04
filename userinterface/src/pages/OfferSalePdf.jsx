// OfferSalesPDF.jsx
// npm install jspdf jspdf-autotable

import React, { useRef, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/images/logogo-removebg-old.png';

// =============================================================
// COMPONENT
// =============================================================

const OfferSalesPDF = ({ offerData, onGenerated }) => {
    const isGenerating = useRef(false);
    const [logoBase64, setLogoBase64] = useState(null);

    // ---- Load logo as base64 on mount ----
    useEffect(() => {
        let cancelled = false;

        const loadLogo = async () => {
            try {
                const res = await fetch(logo);
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

    // =========================================================
    // DEFAULT DATA
    // =========================================================
    const defaultData = {
        referenceNo: 'Villa Bawaba Elsharg / REF-PENDING',
        date: new Date().toLocaleDateString('en-GB'),
        recipientName: 'Abdulaziz Eidha Salmeen Hassan Aljaberi',
        developerName: 'Broker City Properties',
        projectName: 'Villa Bawaba Elsharg',

        unitNumber: '',
        unitType: 'Townhouse',
        unitModel: '3 Bedrooms',
        estimatedCompletion: '1/1/2027',

        basePrice: 2550000,
        downPaymentPercent: 20,
        handoverPercent: 80,

        municipalityFeePercent: 2,
        officeFeePercent: 2,
        vatPercent: 5,
        nocFee: 5000,

        currency: 'AED',
    };

    const raw = { ...defaultData, ...(offerData || {}) };

    // =========================================================
    // CALCULATED AMOUNTS (unchanged)
    // =========================================================
    const calc = (() => {
        const base = Number(raw.basePrice || 0);

        const downPaymentAmount =
            (base * Number(raw.downPaymentPercent || 0)) / 100;
        const handoverAmount =
            (base * Number(raw.handoverPercent || 0)) / 100;

        const municipalityFee =
            (base * Number(raw.municipalityFeePercent || 0)) / 100;
        const officeFee =
            (base * Number(raw.officeFeePercent || 0)) / 100;

        // VAT from Office Fee
        const vat = (officeFee * Number(raw.vatPercent || 0)) / 100;

        const noc = Number(raw.nocFee || 0);

        const grandTotal =
            base + municipalityFee + officeFee + vat + noc;

        return {
            base,
            downPaymentAmount,
            handoverAmount,
            municipalityFee,
            officeFee,
            vat,
            noc,
            grandTotal,
        };
    })();

    // =========================================================
    // HELPERS
    // =========================================================
    const formatAED = (n) =>
        Number(n || 0).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

    const formatPercent = (n) => {
        const num = Number(n || 0);
        return Number.isInteger(num) ? String(num) : num.toFixed(1);
    };

    // =========================================================
    // COLORS — ALL SHADES OF GRAY
    // =========================================================
    const COLORS = {
        // ---- Page header ----
        headerBg: [255, 255, 255],
        headerText: [26, 47, 60],

        // ---- Table headers — light gray ----
        tableHeaderBg: [235, 235, 235],    // light gray
        tableHeaderText: [60, 60, 60],     // dark gray text

        // ---- Row accents (all gray) ----
        alternateRow: [248, 248, 248],     // subtle gray
        totalRowBg: [225, 225, 225],       // medium gray highlight for "Total"

        // ---- GRAND TOTAL row ----
        grandTotalBg: [110, 110, 110],     // darker gray
        grandTotalText: [255, 255, 255],   // white text

        // ---- Header underline under logo (gray) ----
        headerLineColor: [120, 120, 120],

        // ---- Misc ----
        accentDark: [26, 47, 60],
        darkGray: [80, 80, 80],
        white: [255, 255, 255],
    };

    // =========================================================
    // GENERATE PDF
    // =========================================================
    const generatePDF = () => {
        if (isGenerating.current) return;
        isGenerating.current = true;

        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const margin = 15;

            // =====================================================
            // 1) PAGE HEADER — logo at LEFT, underline under logo only
            // =====================================================
const headerHeight = 26;                       // unchanged

doc.setFillColor(...COLORS.headerBg);
doc.rect(0, 0, pageW, headerHeight, 'F');

// ---- Logo at LEFT (pinned near top, not vertically centered) ----
const logoW = 65;
const logoH = 58;
const logoX = 5;
const logoY = -12;                             // unchanged

if (logoBase64) {
    try {
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

// ---- Underline: fixed Y just above the header bottom, same width as logo ----
const lineY = headerHeight - 1;                // ← fixed at 25mm, inside the header
doc.setDrawColor(...COLORS.headerLineColor);
doc.setLineWidth(0.6);
doc.line(logoX, lineY, logoX + logoW, lineY);

            // =====================================================
            // 2) TITLE
            // =====================================================
            let cursorY = headerHeight + 14;

            doc.setTextColor(...COLORS.accentDark);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.text('Offer Sales', margin, cursorY);

            cursorY += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...COLORS.darkGray);

            doc.text(`Reference No: ${raw.referenceNo}`, margin, cursorY);
            doc.text(`Date: ${raw.date}`, pageW - margin, cursorY, {
                align: 'right',
            });

            // =====================================================
            // 3) GREETING
            // =====================================================
            cursorY += 12;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...COLORS.accentDark);
            doc.text(
                `Dear ${raw.recipientName || '________'},`,
                margin,
                cursorY
            );

            cursorY += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...COLORS.darkGray);
            doc.text(
                `Thanks for your interest in ${raw.developerName}.`,
                margin,
                cursorY
            );

            cursorY += 6;
            doc.text(
                `As discussed, please find below detailed offer for project: ${raw.projectName}.`,
                margin,
                cursorY
            );

            // =====================================================
            // 4) PROJECT INFO TABLE
            // =====================================================
            cursorY += 10;

            autoTable(doc, {
                startY: cursorY,
                margin: { left: margin, right: margin },
                head: [[
                    'Project',
                    'Unit Type',
                    'Unit Model',
                    'Handover Date',
                    'Base Price (AED)',
                ]],
                body: [[
                    raw.projectName,
                    raw.unitType,
                    raw.unitModel,
                    raw.estimatedCompletion,
                    formatAED(calc.base),
                ]],
                theme: 'grid',
                headStyles: {
                    fillColor: COLORS.tableHeaderBg,
                    textColor: COLORS.tableHeaderText,
                    fontSize: 9,
                    fontStyle: 'bold',
                    halign: 'center',
                },
                bodyStyles: {
                    fontSize: 9,
                    halign: 'center',
                    textColor: COLORS.darkGray,
                },
                alternateRowStyles: {
                    fillColor: COLORS.alternateRow,
                },
            });

            cursorY = doc.lastAutoTable.finalY + 8;

            // =====================================================
            // 5) PAYMENT SCHEDULE
            // =====================================================
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...COLORS.accentDark);
            doc.text('Schedule of Installment Payments', margin, cursorY);

            cursorY += 4;

            autoTable(doc, {
                startY: cursorY,
                margin: { left: margin, right: margin },
                head: [[
                    'Inst.',
                    'Milestone',
                    'Percentage',
                    'Amount (AED)',
                ]],
                body: [
                    [
                        '1',
                        'Down Payment',
                        `${formatPercent(raw.downPaymentPercent)}%`,
                        formatAED(calc.downPaymentAmount),
                    ],
                    [
                        '2',
                        'Handover',
                        `${formatPercent(raw.handoverPercent)}%`,
                        formatAED(calc.handoverAmount),
                    ],
                    [
                        '',
                        'Total',
                        '100%',
                        formatAED(calc.base),
                    ],
                ],
                theme: 'grid',
                headStyles: {
                    fillColor: COLORS.tableHeaderBg,
                    textColor: COLORS.tableHeaderText,
                    fontSize: 9,
                    fontStyle: 'bold',
                    halign: 'center',
                },
                bodyStyles: {
                    fontSize: 9,
                    halign: 'center',
                    textColor: COLORS.darkGray,
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 80, halign: 'left' },
                    2: { cellWidth: 30, halign: 'center' },
                    3: { cellWidth: 55, halign: 'right' },
                },
                alternateRowStyles: {
                    fillColor: COLORS.alternateRow,
                },
                // "Total" row → medium gray highlight
                didParseCell: (hook) => {
                    if (
                        hook.section === 'body' &&
                        hook.row.index === 2
                    ) {
                        hook.cell.styles.fontStyle = 'bold';
                        hook.cell.styles.fillColor = COLORS.totalRowBg;
                    }
                },
            });

            cursorY = doc.lastAutoTable.finalY + 8;

            // =====================================================
            // 6) ADDITIONAL FEES
            // =====================================================
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...COLORS.accentDark);
            doc.text('Additional Fees', margin, cursorY);

            cursorY += 4;

            autoTable(doc, {
                startY: cursorY,
                margin: { left: margin, right: margin },
                head: [[
                    'Fee',
                    'Percentage',
                    'Amount (AED)',
                ]],
                body: [
                    [
                        'Municipality Fee',
                        `${formatPercent(raw.municipalityFeePercent)}%`,
                        formatAED(calc.municipalityFee),
                    ],
                    [
                        'Office Fee',
                        `${formatPercent(raw.officeFeePercent)}%`,
                        formatAED(calc.officeFee),
                    ],
                    [
                        `VAT / Tax (${formatPercent(raw.vatPercent)}%)`,
                        `${formatPercent(raw.vatPercent)}%`,
                        formatAED(calc.vat),
                    ],
                    [
                        'NOC',
                        'Fixed',
                        formatAED(calc.noc),
                    ],
                ],
                theme: 'grid',
                headStyles: {
                    fillColor: COLORS.tableHeaderBg,
                    textColor: COLORS.tableHeaderText,
                    fontSize: 9,
                    fontStyle: 'bold',
                    halign: 'center',
                },
                bodyStyles: {
                    fontSize: 9,
                    halign: 'center',
                    textColor: COLORS.darkGray,
                },
                columnStyles: {
                    0: { cellWidth: 90, halign: 'left' },
                    1: { cellWidth: 35, halign: 'center' },
                    2: { cellWidth: 55, halign: 'right' },
                },
                alternateRowStyles: {
                    fillColor: COLORS.alternateRow,
                },
            });

            cursorY = doc.lastAutoTable.finalY + 8;

            // =====================================================
            // 7) GRAND TOTAL SUMMARY
            // =====================================================
            autoTable(doc, {
                startY: cursorY,
                margin: { left: margin, right: margin },
                head: [[
                    'Description',
                    'Amount (AED)',
                ]],
                body: [
                    ['Base Price', formatAED(calc.base)],
                    [
                        `Municipality Fee (${formatPercent(raw.municipalityFeePercent)}%)`,
                        formatAED(calc.municipalityFee),
                    ],
                    [
                        `Office Fee (${formatPercent(raw.officeFeePercent)}%)`,
                        formatAED(calc.officeFee),
                    ],
                    [
                        `VAT (${formatPercent(raw.vatPercent)}%)`,
                        formatAED(calc.vat),
                    ],
                    ['NOC', formatAED(calc.noc)],
                    ['GRAND TOTAL', formatAED(calc.grandTotal)],
                ],
                theme: 'grid',
                headStyles: {
                    fillColor: COLORS.tableHeaderBg,
                    textColor: COLORS.tableHeaderText,
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center',
                },
                bodyStyles: {
                    fontSize: 10,
                    textColor: COLORS.darkGray,
                },
                columnStyles: {
                    0: { cellWidth: 120, halign: 'left' },
                    1: { cellWidth: 60, halign: 'right' },
                },
                // GRAND TOTAL row → darker gray
                didParseCell: (hook) => {
                    if (
                        hook.section === 'body' &&
                        hook.row.index === 5
                    ) {
                        hook.cell.styles.fontStyle = 'bold';
                        hook.cell.styles.fontSize = 12;
                        hook.cell.styles.fillColor = COLORS.grandTotalBg;
                        hook.cell.styles.textColor = COLORS.grandTotalText;
                    }
                },
            });

            // =====================================================
            // 8) FOOTER — HIDDEN (uncomment to re-enable)
            // =====================================================
            /*
            const footerHeight = 16;
            const footerY = pageH - footerHeight;

            doc.setFillColor(60, 60, 60);
            doc.rect(0, footerY, pageW, footerHeight, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(
                'P.O.BOX : 7833 Abu Dhabi - U.A.E   |   +971 50 2000 195   |   ☎ +971 2 6666 101',
                margin,
                footerY + 6,
                { align: 'left' }
            );

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.text(
                'BROKER CITY PROPERTIES',
                pageW / 2,
                footerY + 12,
                { align: 'center' }
            );
            */

            // =====================================================
            // 9) SAVE
            // =====================================================
            const fileName = `Offer-Sales-${raw.projectName.replace(/\s+/g, '-')}-${raw.date.replace(/\//g, '-')}.pdf`;
            doc.save(fileName);

            if (onGenerated) onGenerated(fileName);
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('An error occurred while generating the PDF.');
        } finally {
            isGenerating.current = false;
        }
    };

    // =========================================================
    // UI
    // =========================================================
    return (
        <button
            type="button"
            onClick={generatePDF}
            className="cursor-pointer bg-[#007a84] hover:bg-[#00646c] text-white px-6 py-3 rounded-lg font-extrabold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95"
        >
            تحميل عرض الأسعار (PDF)
        </button>
    );
};

export default OfferSalesPDF;


// // OfferSalesPDF.jsx
// // npm install jspdf jspdf-autotable

// import React, { useRef, useEffect, useState } from 'react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import logo from '../assets/images/logogo-removebg-old.png';

// // =============================================================
// // COMPONENT
// // =============================================================

// const OfferSalesPDF = ({ offerData, onGenerated }) => {
//     // Prevents double-clicking the button from generating two PDFs
//     const isGenerating = useRef(false);

//     // Logo is loaded once as base64 so jsPDF can embed it
//     const [logoBase64, setLogoBase64] = useState(null);

//     // ---------------------------------------------------------
//     // Load the logo file as a base64 string on mount
//     // ---------------------------------------------------------
//     useEffect(() => {
//         let cancelled = false;

//         const loadLogo = async () => {
//             try {
//                 const res = await fetch(logo);
//                 const blob = await res.blob();
//                 const reader = new FileReader();

//                 reader.onloadend = () => {
//                     if (!cancelled) {
//                         setLogoBase64(reader.result);
//                     }
//                 };

//                 reader.readAsDataURL(blob);
//             } catch (err) {
//                 console.error('Failed to load logo:', err);
//             }
//         };

//         loadLogo();

//         return () => {
//             cancelled = true;
//         };
//     }, []);

//     // =========================================================
//     // DEFAULT DATA — override with the `offerData` prop
//     // =========================================================
//     const defaultData = {
//         // ---- Header / greeting ----
//         referenceNo: 'Villa Bawaba Elsharg / REF-PENDING',
//         date: new Date().toLocaleDateString('en-GB'),
//         recipientName: 'Abdulaziz Eidha Salmeen Hassan Aljaberi',
//         developerName: 'Broker City Properties',
//         projectName: 'Villa Bawaba Elsharg',

//         // ---- Unit details ----
//         unitNumber: '',
//         unitType: 'Townhouse',
//         unitModel: '3 Bedrooms',
//         estimatedCompletion: '1/1/2027',

//         // ---- Price & payment plan ----
//         basePrice: 2550000,
//         downPaymentPercent: 20,
//         handoverPercent: 80,

//         // ---- Additional fees ----
//         municipalityFeePercent: 2, // رسوم بلدية
//         officeFeePercent: 2,       // رسوم مكتب
//         vatPercent: 5,             // 5% tax
//         nocFee: 5000,              // NOC fixed AED

//         currency: 'AED',
//     };

//     // Merge caller data on top of defaults
//     const raw = { ...defaultData, ...(offerData || {}) };

//     // =========================================================
//     // CALCULATED AMOUNTS
//     // =========================================================
//     const calc = (() => {
//         const base = Number(raw.basePrice || 0);

//         // ---- Payment schedule amounts ----
//         const downPaymentAmount =
//             (base * Number(raw.downPaymentPercent || 0)) / 100;
//         const handoverAmount =
//             (base * Number(raw.handoverPercent || 0)) / 100;

//         // ---- Additional fee amounts ----
//         const municipalityFee =
//             (base * Number(raw.municipalityFeePercent || 0)) / 100;
//         const officeFee =
//             (base * Number(raw.officeFeePercent || 0)) / 100;
//         const vat = (base * Number(raw.vatPercent || 0)) / 100;
//         const noc = Number(raw.nocFee || 0);

//         // ---- Grand total ----
//         const grandTotal =
//             base + municipalityFee + officeFee + vat + noc;

//         return {
//             base,
//             downPaymentAmount,
//             handoverAmount,
//             municipalityFee,
//             officeFee,
//             vat,
//             noc,
//             grandTotal,
//         };
//     })();

//     // =========================================================
//     // HELPERS
//     // =========================================================

//     // Format AED amounts with thousand separators and no decimals
//     const formatAED = (n) =>
//         Number(n || 0).toLocaleString('en-US', {
//             minimumFractionDigits: 0,
//             maximumFractionDigits: 0,
//         });

//     // Format a percentage without trailing ".0"
//     // 20 → "20"   |   2 → "2"   |   12.5 → "12.5"
//     const formatPercent = (n) => {
//         const num = Number(n || 0);
//         return Number.isInteger(num) ? String(num) : num.toFixed(1);
//     };

//     // =========================================================
//     // COLORS
//     // =========================================================
//     const COLORS = {
//         // ---- Page header (white background) ----
//         headerBg: [255, 255, 255],
//         headerText: [26, 47, 60],

//         // ---- Table headers (gold — matches GRAND TOTAL) ----
//         tableHeaderBg: [196, 152, 87],
//         tableHeaderText: [255, 255, 255],

//         // ---- Footer (darker gold — same family as table headers) ----
//         footerBg: [138, 106, 68],
//         footerText: [255, 255, 255],

//         // ---- Misc ----
//         accentGold: [196, 152, 87],
//         accentDark: [26, 47, 60],
//         darkGray: [80, 80, 80],
//         white: [255, 255, 255],
//         highlight: [245, 240, 230],
//     };

//     // =========================================================
//     // GENERATE PDF
//     // =========================================================
//     const generatePDF = () => {
//         // Guard against double-click
//         if (isGenerating.current) return;
//         isGenerating.current = true;

//         try {
//             // ---- Create a new A4 portrait document ----
//             const doc = new jsPDF({
//                 orientation: 'portrait',
//                 unit: 'mm',
//                 format: 'a4',
//             });

//             const pageW = doc.internal.pageSize.getWidth();  // 210
//             const pageH = doc.internal.pageSize.getHeight(); // 297
//             const margin = 15;
//             const contentW = pageW - margin * 2;

//             // =====================================================
//             // 1) PAGE HEADER — white bg, logo only, no ref text
//             // =====================================================
//             const headerHeight = 36;

//             // White background
//             doc.setFillColor(...COLORS.headerBg);
//             doc.rect(0, 0, pageW, headerHeight, 'F');

//             // Gold separator line under the header
//             doc.setDrawColor(...COLORS.accentGold);
//             doc.setLineWidth(0.8);
//             doc.line(0, headerHeight, pageW, headerHeight);

//             // Logo — 65mm wide x 28mm tall, centered horizontally
//             if (logoBase64) {
//                 try {
//                     const logoW = 65;
//                     const logoH = 58;
//                     const logoX = (pageW - logoW) / 2;
//                     const logoY = (headerHeight - logoH) / 2;

//                     doc.addImage(
//                         logoBase64,
//                         'PNG',
//                         logoX,
//                         logoY,
//                         logoW,
//                         logoH,
//                         undefined,
//                         'FAST'
//                     );
//                 } catch (err) {
//                     console.error('Logo render error:', err);
//                 }
//             }

//             // =====================================================
//             // 2) TITLE BLOCK
//             // =====================================================
//             let cursorY = headerHeight + 14;

//             doc.setTextColor(...COLORS.accentDark);
//             doc.setFont('helvetica', 'bold');
//             doc.setFontSize(20);
//             doc.text('Offer Sales', margin, cursorY);

//             cursorY += 8;

//             // Reference No (left) + Date (right)
//             doc.setFontSize(10);
//             doc.setFont('helvetica', 'normal');
//             doc.setTextColor(...COLORS.darkGray);

//             doc.text(`Reference No: ${raw.referenceNo}`, margin, cursorY);
//             doc.text(`Date: ${raw.date}`, pageW - margin, cursorY, {
//                 align: 'right',
//             });

//             // =====================================================
//             // 3) GREETING + INTRO PARAGRAPH
//             // =====================================================
//             cursorY += 12;

//             doc.setFont('helvetica', 'bold');
//             doc.setFontSize(12);
//             doc.setTextColor(...COLORS.accentDark);
//             doc.text(
//                 `Dear ${raw.recipientName || '________'},`,
//                 margin,
//                 cursorY
//             );

//             cursorY += 8;

//             doc.setFont('helvetica', 'normal');
//             doc.setFontSize(10);
//             doc.setTextColor(...COLORS.darkGray);

//             doc.text(
//                 `Thanks for your interest in ${raw.developerName}.`,
//                 margin,
//                 cursorY
//             );

//             cursorY += 6;
//             doc.text(
//                 `As discussed, please find below detailed offer for project: ${raw.projectName}.`,
//                 margin,
//                 cursorY
//             );

//             // =====================================================
//             // 4) PROJECT INFO TABLE
//             // =====================================================
//             cursorY += 10;

//             autoTable(doc, {
//                 startY: cursorY,
//                 margin: { left: margin, right: margin },
//                 head: [[
//                     'Project',
//                     'Unit Type',
//                     'Unit Model',
//                     'Handover Date',
//                     'Base Price (AED)',
//                 ]],
//                 body: [[
//                     raw.projectName,
//                     raw.unitType,
//                     raw.unitModel,
//                     raw.estimatedCompletion,
//                     formatAED(calc.base),
//                 ]],
//                 theme: 'grid',
//                 headStyles: {
//                     fillColor: COLORS.tableHeaderBg,
//                     textColor: COLORS.tableHeaderText,
//                     fontSize: 9,
//                     fontStyle: 'bold',
//                     halign: 'center',
//                 },
//                 bodyStyles: {
//                     fontSize: 9,
//                     halign: 'center',
//                     textColor: COLORS.darkGray,
//                 },
//                 alternateRowStyles: {
//                     fillColor: [250, 250, 250],
//                 },
//             });

//             cursorY = doc.lastAutoTable.finalY + 8;

//             // =====================================================
//             // 5) PAYMENT SCHEDULE TABLE
//             // =====================================================
//             doc.setFont('helvetica', 'bold');
//             doc.setFontSize(11);
//             doc.setTextColor(...COLORS.accentDark);
//             doc.text('Schedule of Installment Payments', margin, cursorY);

//             cursorY += 4;

//             autoTable(doc, {
//                 startY: cursorY,
//                 margin: { left: margin, right: margin },
//                 head: [[
//                     'Inst.',
//                     'Milestone',
//                     'Percentage',
//                     'Amount (AED)',
//                 ]],
//                 body: [
//                     [
//                         '1',
//                         'Down Payment',
//                         `${formatPercent(raw.downPaymentPercent)}%`,
//                         formatAED(calc.downPaymentAmount),
//                     ],
//                     [
//                         '2',
//                         'Handover',
//                         `${formatPercent(raw.handoverPercent)}%`,
//                         formatAED(calc.handoverAmount),
//                     ],
//                     [
//                         '',
//                         'Total',
//                         '100%',
//                         formatAED(calc.base),
//                     ],
//                 ],
//                 theme: 'grid',
//                 headStyles: {
//                     fillColor: COLORS.tableHeaderBg,
//                     textColor: COLORS.tableHeaderText,
//                     fontSize: 9,
//                     fontStyle: 'bold',
//                     halign: 'center',
//                 },
//                 bodyStyles: {
//                     fontSize: 9,
//                     halign: 'center',
//                     textColor: COLORS.darkGray,
//                 },
//                 columnStyles: {
//                     0: { cellWidth: 15, halign: 'center' },
//                     1: { cellWidth: 80, halign: 'left' },
//                     2: { cellWidth: 30, halign: 'center' },
//                     3: { cellWidth: 55, halign: 'right' },
//                 },
//                 alternateRowStyles: {
//                     fillColor: [250, 250, 250],
//                 },
//                 // Highlight the "Total" row in soft gold
//                 didParseCell: (hook) => {
//                     if (
//                         hook.section === 'body' &&
//                         hook.row.index === 2
//                     ) {
//                         hook.cell.styles.fontStyle = 'bold';
//                         hook.cell.styles.fillColor = COLORS.highlight;
//                     }
//                 },
//             });

//             cursorY = doc.lastAutoTable.finalY + 8;

//             // =====================================================
//             // 6) ADDITIONAL FEES TABLE
//             // =====================================================
//             doc.setFont('helvetica', 'bold');
//             doc.setFontSize(11);
//             doc.setTextColor(...COLORS.accentDark);
//             doc.text('Additional Fees', margin, cursorY);

//             cursorY += 4;

//             autoTable(doc, {
//                 startY: cursorY,
//                 margin: { left: margin, right: margin },
//                 head: [[
//                     'Fee',
//                     'Percentage',
//                     'Amount (AED)',
//                 ]],
//                 body: [
//                     [
//                         'Municipality Fee',
//                         `${formatPercent(raw.municipalityFeePercent)}%`,
//                         formatAED(calc.municipalityFee),
//                     ],
//                     [
//                         'Office Fee',
//                         `${formatPercent(raw.officeFeePercent)}%`,
//                         formatAED(calc.officeFee),
//                     ],
//                     [
//                         `VAT / Tax (${formatPercent(raw.vatPercent)}%)`,
//                         `${formatPercent(raw.vatPercent)}%`,
//                         formatAED(calc.vat),
//                     ],
//                     [
//                         'NOC',
//                         'Fixed',
//                         formatAED(calc.noc),
//                     ],
//                 ],
//                 theme: 'grid',
//                 headStyles: {
//                     fillColor: COLORS.tableHeaderBg,
//                     textColor: COLORS.tableHeaderText,
//                     fontSize: 9,
//                     fontStyle: 'bold',
//                     halign: 'center',
//                 },
//                 bodyStyles: {
//                     fontSize: 9,
//                     halign: 'center',
//                     textColor: COLORS.darkGray,
//                 },
//                 columnStyles: {
//                     0: { cellWidth: 90, halign: 'left' },
//                     1: { cellWidth: 35, halign: 'center' },
//                     2: { cellWidth: 55, halign: 'right' },
//                 },
//                 alternateRowStyles: {
//                     fillColor: [250, 250, 250],
//                 },
//             });

//             cursorY = doc.lastAutoTable.finalY + 8;

//             // =====================================================
//             // 7) GRAND TOTAL SUMMARY TABLE
//             // =====================================================
//             autoTable(doc, {
//                 startY: cursorY,
//                 margin: { left: margin, right: margin },
//                 head: [[
//                     'Description',
//                     'Amount (AED)',
//                 ]],
//                 body: [
//                     ['Base Price', formatAED(calc.base)],
//                     [
//                         `Municipality Fee (${formatPercent(raw.municipalityFeePercent)}%)`,
//                         formatAED(calc.municipalityFee),
//                     ],
//                     [
//                         `Office Fee (${formatPercent(raw.officeFeePercent)}%)`,
//                         formatAED(calc.officeFee),
//                     ],
//                     [
//                         `VAT (${formatPercent(raw.vatPercent)}%)`,
//                         formatAED(calc.vat),
//                     ],
//                     ['NOC', formatAED(calc.noc)],
//                     ['GRAND TOTAL', formatAED(calc.grandTotal)],
//                 ],
//                 theme: 'grid',
//                 headStyles: {
//                     fillColor: COLORS.tableHeaderBg,
//                     textColor: COLORS.tableHeaderText,
//                     fontSize: 10,
//                     fontStyle: 'bold',
//                     halign: 'center',
//                 },
//                 bodyStyles: {
//                     fontSize: 10,
//                     textColor: COLORS.darkGray,
//                 },
//                 columnStyles: {
//                     0: { cellWidth: 120, halign: 'left' },
//                     1: { cellWidth: 60, halign: 'right' },
//                 },
//                 // Highlight GRAND TOTAL row in gold with white text
//                 didParseCell: (hook) => {
//                     if (
//                         hook.section === 'body' &&
//                         hook.row.index === 5
//                     ) {
//                         hook.cell.styles.fontStyle = 'bold';
//                         hook.cell.styles.fontSize = 12;
//                         hook.cell.styles.fillColor = COLORS.accentGold;
//                         hook.cell.styles.textColor = COLORS.white;
//                     }
//                 },
//             });

//             // =====================================================
//             // 8) FOOTER — dark gold bg, left-aligned address, centered company
//             // =====================================================
//             const footerHeight = 16;
//             const footerY = pageH - footerHeight;

//             doc.setFillColor(...COLORS.footerBg);
//             doc.rect(0, footerY, pageW, footerHeight, 'F');

//             // ----- Line 1: address / phones (left-aligned with margin) -----
//             doc.setTextColor(...COLORS.footerText);
//             doc.setFont('helvetica', 'normal');
//             doc.setFontSize(8);
//             doc.text(
//                 'P.O.BOX : 7833 Abu Dhabi - U.A.E   |   +971 50 2000 195   |   ☎ +971 2 6666 101',
//                 margin,
//                 footerY + 6,
//                 { align: 'left' }
//             );

//             // ----- Line 2: company name (centered) -----
//             doc.setFont('helvetica', 'bold');
//             doc.setFontSize(9.5);
//             doc.text(
//                 'BROKER CITY PROPERTIES',
//                 pageW / 2,
//                 footerY + 12,
//                 { align: 'center' }
//             );

//             // =====================================================
//             // 9) SAVE THE PDF
//             // =====================================================
//             const fileName = `Offer-Sales-${raw.projectName.replace(/\s+/g, '-')}-${raw.date.replace(/\//g, '-')}.pdf`;
//             doc.save(fileName);

//             // Notify parent if callback was provided
//             if (onGenerated) onGenerated(fileName);
//         } catch (err) {
//             console.error('PDF generation error:', err);
//             alert('An error occurred while generating the PDF.');
//         } finally {
//             isGenerating.current = false;
//         }
//     };

//     // =========================================================
//     // UI — a single button that triggers the PDF generation
//     // =========================================================
//     return (
//         <button
//             type="button"
//             onClick={generatePDF}
//             className="cursor-pointer bg-[#007a84] hover:bg-[#00646c] text-white px-6 py-3 rounded-lg font-extrabold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95"
//         >
//             تحميل عرض الأسعار (PDF)
//         </button>
//     );
// };

// export default OfferSalesPDF;