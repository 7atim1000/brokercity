import React, { useState, useEffect, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddDeposit from '../../components/ar/transactions/AddDeposit';
import AddWithdraw from '../../components/ar/transactions/AddWithdraw';
import TransactionDetails from '../../components/ar/transactions/TransactionDetails';
import { BiSolidShow } from "react-icons/bi";
import { MdDeleteForever, MdAccountBalanceWallet, MdModeEdit } from "react-icons/md";
import {
    FaFilePdf,
    FaFileExcel,
    FaArrowTrendUp,
    FaArrowTrendDown,
    FaScaleBalanced,
    FaRotateRight,
    FaMagnifyingGlass,
} from "react-icons/fa6";

import { FaFileSignature } from "react-icons/fa6";

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// Note: if your installed jspdf version only exposes a named export, use:
// import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';

import logogo from '../../assets/images/logogo-removebg.png'

// Base URL from environment variables
const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// Company identity used on the printed worksheet (mirrors the accounting .xlsx export)
const COMPANY_NAME_EN = 'Broker City Properties';
const COMPANY_NAME_AR = 'بروكر سيتي العقارية';

// FOR fetch account_from, account_to, ...
const renderAccountValue = (value) => {
    if (!value) return '-';
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-800">
            {value}
        </span>
    );
};

const formatMoney = (value) =>
    (parseFloat(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ✅ UPDATED: Date format is now DD/Mon/YYYY (e.g. 21/Sep/2026)
// This single helper is used by:
//   - the on-screen table
//   - the print / PDF worksheet (print-area)
//   - the Excel export (generateExcel)
// so all three stay consistent.
// The direction (LTR) is enforced at the render site with dir="ltr",
// so the text always reads left-to-right even inside the RTL layout.
const formatDate = (value) => {
    if (!value) return '-';
    try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;

        const day = String(d.getDate()).padStart(2, '0');

        // English 3-letter month abbreviations (Jan, Feb, ... Dec)
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const month = monthNames[d.getMonth()];

        const year = d.getFullYear(); // full 4-digit year
        return `${day}/${month}/${year}`;
    } catch {
        return value;
    }
};

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddWithdrawModal, setShowAddWithdrawModal] = useState(false);
    const [showAddDepositModal, setShowAddDepositModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
    const [error, setError] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    // Modal state for TransactionDetails
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState(null);

    // Export state — the printable/downloadable worksheet is built from the FULL filtered
    // dataset, not just the current page, so the report matches the .xlsx export.
    const [printData, setPrintData] = useState([]);
    const [isExporting, setIsExporting] = useState(false); // fetching data for PDF / Excel
    const [pendingExportAction, setPendingExportAction] = useState(null); // 'pdf' | 'excel' | null
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // rendering the PDF file itself
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false); // building the .xlsx file itself

    const handleViewTransaction = (transactionId) => {
        setSelectedTransactionId(transactionId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTransactionId(null);
    };

    // Build the query string shared by the paginated fetch and the "fetch everything for export" call
    const buildQuery = ({ page, size }) => {
        let url = `${BASE}/api/transactions/?page=${page}&page_size=${size}`;
        if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
        if (filterType) url += `&type=${filterType}`;
        if (filterPaymentMethod) url += `&payment_method=${filterPaymentMethod}`;
        return url;
    };

    // Fetch transactions with pagination
    const fetchTransactions = async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('يرجى تسجيل الدخول لعرض المعاملات');
                setLoading(false);
                return;
            }

            const url = buildQuery({ page, size: pageSize });

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error('فشل تحميل المعاملات');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // ✅ VERIFIED DESC SORT:
            // We sort by `transaction_date` DESC (newest first). If two rows share the
            // same date we fall back to `id` DESC so the last inserted row always wins.
            const sortDesc = (rows) =>
                [...rows].sort((a, b) => {
                    const diff = new Date(b.transaction_date) - new Date(a.transaction_date);
                    if (diff !== 0) return diff;
                    return (b.id || 0) - (a.id || 0); // tie-breaker: newest id first
                });

            if (data && data.results && Array.isArray(data.results)) {
                setTransactions(sortDesc(data.results));
                setTotalCount(data.count || 0);
                setTotalPages(Math.ceil((data.count || 0) / pageSize));
                setNextPage(data.next);
                setPreviousPage(data.previous);
            } else if (data && Array.isArray(data)) {
                setTransactions(sortDesc(data));
                setTotalCount(data.length);
                setTotalPages(Math.ceil(data.length / pageSize));
                setNextPage(null);
                setPreviousPage(null);
            } else {
                setTransactions([]);
                setTotalCount(0);
                setTotalPages(0);
            }

            setLoading(false);
        } catch (err) {
            setError('فشل تحميل المعاملات');
            setLoading(false);
            console.error('Error fetching transactions:', err);
            toast.error('❌ حدث خطأ أثناء جلب المعاملات');
        }
    };

    // Handle search with debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (currentPage === 1) {
                fetchTransactions(1);
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filterType, filterPaymentMethod]);

    // Fetch on page change
    useEffect(() => {
        fetchTransactions(currentPage);
    }, [currentPage]);

    // Initial fetch
    useEffect(() => {
        fetchTransactions(1);
    }, []);

    // Once the full dataset is fetched, run whichever export action was requested
    useEffect(() => {
        if (isExporting || printData.length === 0 || !pendingExportAction) return;

        if (pendingExportAction === 'pdf') {
            const timer = setTimeout(() => {
                generatePdf().finally(() => setPendingExportAction(null));
            }, 200);
            return () => clearTimeout(timer);
        }

        if (pendingExportAction === 'excel') {
            const timer = setTimeout(() => {
                generateExcel().finally(() => setPendingExportAction(null));
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isExporting, printData, pendingExportAction]);

    // Delete transaction
    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;

        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('يرجى تسجيل الدخول');
                return;
            }

            const response = await fetch(
                `${BASE}/api/transactions/${id}/delete/`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error('فشل حذف المعاملة');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success('✅ تم حذف المعاملة بنجاح');
            fetchTransactions(currentPage);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('❌ حدث خطأ أثناء حذف المعاملة');
        }
    };

    // Update transaction
    const handleUpdate = (transaction) => {
        setSelectedTransaction(transaction);

        if (transaction.type === 'deposit') {
            setShowAddDepositModal(true);
        } else if (transaction.type === 'withdraw') {
            setShowAddWithdrawModal(true);
        } else {
            toast.error('نوع المعاملة غير معروف');
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        setShowAddDepositModal(false);
        setShowAddWithdrawModal(false);
        setSelectedTransaction(null);
        fetchTransactions(currentPage);
    };

    // Reset all filters back to defaults
    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterType('');
        setFilterPaymentMethod('');
        setCurrentPage(1);
    };

    // Fetch the ENTIRE filtered result set (not just this page) — shared by PDF and Excel export
    const fetchFullDatasetForExport = async () => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            toast.error('يرجى تسجيل الدخول لعرض المعاملات');
            return null;
        }

        const url = buildQuery({ page: 1, size: 100000 });
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const rows = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

        // Chronological order, oldest first, to match the running balance in the .xlsx worksheet
        return [...rows].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
    };

    const handleDownloadPdf = async () => {
        try {
            setIsExporting(true);
            setPendingExportAction('pdf');
            const sorted = await fetchFullDatasetForExport();
            if (sorted) {
                setPrintData(sorted);
            } else {
                setPendingExportAction(null);
            }
        } catch (err) {
            console.error('Error preparing PDF download data:', err);
            toast.error('❌ تعذر تجهيز ملف PDF');
            setPendingExportAction(null);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            setIsExporting(true);
            setPendingExportAction('excel');
            const sorted = await fetchFullDatasetForExport();
            if (sorted) {
                setPrintData(sorted);
            } else {
                setPendingExportAction(null);
            }
        } catch (err) {
            console.error('Error preparing Excel download data:', err);
            toast.error('❌ تعذر تجهيز ملف Excel');
            setPendingExportAction(null);
        } finally {
            setIsExporting(false);
        }
    };

    // Renders the exact same print-area DOM (same design/colors/logo) into a multi-page PDF
    const generatePdf = async () => {
        const element = document.querySelector('.print-area');
        if (!element) return;

        try {
            setIsGeneratingPdf(true);

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
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

            const fileName = `Broker_City_Transactions_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(fileName);
        } catch (err) {
            console.error('Error generating PDF:', err);
            toast.error('❌ تعذر إنشاء ملف PDF');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Builds a styled .xlsx workbook — same columns, same colors (#BF9000 header / #FFE699
    // totals), same logo and layout as the printed worksheet / PDF export.
    const generateExcel = async () => {
        try {
            setIsGeneratingExcel(true);

            const workbook = new ExcelJS.Workbook();
            workbook.creator = COMPANY_NAME_EN;
            workbook.created = new Date();

            const sheet = workbook.addWorksheet('Transactions', {
                views: [{ rightToLeft: false }],
                pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
            });

            // ✅ 10 columns only (matches the 10 header names)
            // Order: S | Date | Voucher No. | Invoice No. | Recipient | Description | To Account | Income | Expense | Balance
            const columnWidths = [10, 13, 16, 24, 34, 18, 18, 14, 14, 16];
            sheet.columns = columnWidths.map((width) => ({ width }));
            const columnCount = columnWidths.length; // = 10

            const thinBorder = {
                top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            };

            // ============================================================
            // ROW 1 — Title (merged across all 10 columns)
            // ============================================================
            sheet.mergeCells(1, 1, 1, columnCount);
            const titleRow = sheet.getRow(1);
            titleRow.height = 56;
            const titleCell = titleRow.getCell(1);
            titleCell.value =
                `${COMPANY_NAME_EN} — ${COMPANY_NAME_AR}\n` +
                'Accounting Worksheet — ورقة عمل المحاسبة';
            titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            titleCell.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
            titleCell.border = thinBorder;

            // Logo (best-effort)
            try {
                const logoResponse = await fetch(logogo);
                const logoBuffer = await logoResponse.arrayBuffer();
                const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'jpeg' });
                sheet.addImage(imageId, {
                    tl: { col: 0.1, row: 0.1 },
                    ext: { width: 56, height: 56 },
                });
            } catch (imgErr) {
                console.warn('Logo could not be embedded in the Excel file:', imgErr);
            }

            // ============================================================
            // ROW 2 — Header (10 columns, dark gold #BF9000)
            // ============================================================
            const headerRow = sheet.addRow([
                'Serial No.\nتسلسلي',                            // 1
                'Date\nالتاريخ',                                  // 2
                'Voucher No.\nرقم السند',                         // 3
                'Invoice/Receipt No\nرقم الفاتوره / الايصال',     // 4
                'Recipient / Beneficiary\nالمستلم / المستفيد',   // 5
                'Description\nالبيان',                            // 6
                'To Account Name\nتم التحويل الى حساب',           // 7
                'Income\nالدخل',                                  // 8
                'Expense\nالمصروف',                               // 9
                'Balance\nالرصيد',                                // 10
            ]);
            headerRow.height = 34;
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBF9000' } };
                cell.font = { bold: true, color: { argb: 'FF000000' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = thinBorder;
            });

            // ============================================================
            // DATA ROWS — 10 values per row (columns 8/9/10 = Income/Expense/Balance)
            // ============================================================
            printRows.forEach((t, index) => {
                const row = sheet.addRow([
                    index + 1,                                                             // 1
                    formatDate(t.transaction_date),                                        // 2
                    t.transaction_no,                                                      // 3
                    t.document_no || '-',                                                  // 4
                    t.type === 'withdraw'                                                  // 5
                        ? (t.person_receipt || '-')
                        : (t.person_deliver || '-'),
                    t.statement || '-',                                                    // 6
                    t.account_to || '-',                                                   // 7
                    t.type === 'deposit' ? (parseFloat(t.amount) || 0) : null,             // 8  Income
                    t.type === 'withdraw' ? (parseFloat(t.amount) || 0) : null,            // 9  Expense
                    t.runningBalance,                                                      // 10 Balance
                ]);

                const zebraFill = index % 2 === 0 ? 'FFFFFFFF' : 'FFFAF7F0';

                row.eachCell((cell, colNumber) => {
                    cell.border = thinBorder;
                    cell.alignment = {
                        horizontal: 'center',
                        vertical: 'middle',
                        wrapText: colNumber === 5 || colNumber === 6,
                    };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraFill } };

                    // number format on columns 8, 9, 10 (Income, Expense, Balance)
                    if (colNumber === 8 || colNumber === 9 || colNumber === 10) {
                        cell.numFmt = '#,##0.00';
                    }
                });

                // colors on the correct columns
                row.getCell(8).font = { bold: true, color: { argb: 'FF1A7A1A' } }; // Income — green
                row.getCell(9).font = { bold: true, color: { argb: 'FFB30000' } }; // Expense — red
                row.getCell(10).font = { bold: true, color: { argb: 'FF000000' } }; // Balance — black
            });

            // ============================================================
            // TOTALS ROW — 10 values, merge columns 1–7 for the label
            // ============================================================
            const totalsRow = sheet.addRow([
                '',                            // 1
                '',                            // 2
                '',                            // 3
                '',                            // 4
                '',                            // 5
                '',                            // 6
                'Gross Total — المجموع الكلي',  // 7  (label starts here)
                printTotals.totalIncome,       // 8  Income
                printTotals.totalExpense,      // 9  Expense
                printTotals.balance,           // 10 Balance
            ]);

            // only ONE merge call — columns 1 through 7
            sheet.mergeCells(totalsRow.number, 1, totalsRow.number, 7);

            totalsRow.eachCell((cell, colNumber) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
                cell.font = { bold: true, color: { argb: 'FF000000' } };
                cell.border = thinBorder;
                cell.alignment = {
                    horizontal: colNumber === 1 ? 'right' : 'center',
                    vertical: 'middle',
                };

                // number format on columns 8, 9, 10
                if (colNumber === 8 || colNumber === 9 || colNumber === 10) {
                    cell.numFmt = '#,##0.00';
                }
            });

            // ============================================================
            // WRITE FILE
            // ============================================================
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Broker_City_Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error generating Excel file:', err);
            toast.error('❌ تعذر إنشاء ملف Excel');
        } finally {
            setIsGeneratingExcel(false);
        }
    };



    // Get type badge
    const getTypeBadge = (type) => {
        if (type === 'deposit') {
            return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-green-100 text-green-800">إيداع</span>;
        } else if (type === 'withdraw') {
            return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-red-100 text-red-800">سحب</span>;
        }
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{type}</span>;
    };

    // Get payment method badge
    const getPaymentMethodBadge = (method) => {
        if (method === 'banks') {
            return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-blue-100 text-blue-800">بنوك</span>;
        } else if (method === 'cash') {
            return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-yellow-100 text-yellow-800">نقدي</span>;
        }
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{method}</span>;
    };

    // Withdraw shows who received the cash (person_receipt); deposit shows who delivered it (person_deliver)
    const getPersonDisplay = (transaction) => {
        if (transaction.type === 'withdraw') return transaction.person_receipt || '-';
        if (transaction.type === 'deposit') return transaction.person_deliver || '-';
        return transaction.person_receipt || transaction.person_deliver || '-';
    };

    // Get amount display with color
    const getAmountDisplay = (transaction) => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'deposit') {
            return <span className="text-green-600 font-bold">+ {amount.toFixed(2)}</span>;
        } else {
            return <span className="text-red-600 font-bold">- {amount.toFixed(2)}</span>;
        }
    };

    // Pagination controls
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value);
        setPageSize(newSize);
        setCurrentPage(1);
    };

    // Totals for the current page — mirrors the single-row table footer below
    const pageStats = useMemo(() => {
        const totalDeposit = transactions.reduce(
            (sum, t) => (t.type === 'deposit' ? sum + parseFloat(t.amount || 0) : sum),
            0
        );
        const totalWithdraw = transactions.reduce(
            (sum, t) => (t.type === 'withdraw' ? sum + parseFloat(t.amount || 0) : sum),
            0
        );
        return { totalDeposit, totalWithdraw, balance: totalDeposit - totalWithdraw };
    }, [transactions]);

    // Totals + running balance for the full print/export dataset
    const printRows = useMemo(() => {
        let running = 0;
        return printData.map((t) => {
            const amount = parseFloat(t.amount || 0);
            if (t.type === 'deposit') running += amount;
            else if (t.type === 'withdraw') running -= amount;
            return { ...t, runningBalance: running };
        });
    }, [printData]);

    const printTotals = useMemo(() => {
        const totalIncome = printData.reduce(
            (sum, t) => (t.type === 'deposit' ? sum + parseFloat(t.amount || 0) : sum),
            0
        );
        const totalExpense = printData.reduce(
            (sum, t) => (t.type === 'withdraw' ? sum + parseFloat(t.amount || 0) : sum),
            0
        );
        return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
    }, [printData]);

    const printGeneratedAt = new Date().toLocaleString('ar-EG');

    // Pagination component
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center gap-2 mt-6 justify-center">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    السابق
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => handlePageChange(1)}
                            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
                    </>
                )}

                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                            currentPage === page
                                ? 'bg-[#a47d52] text-white border-[#a47d52]'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {page}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    التالي
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
            {/*
              Print-only CSS. Colors are hard-coded hex values (matching the accounting .xlsx
              worksheet's theme: dark gold header #BF9000, light gold totals #FFE699) and forced
              on with print-color-adjust, because Tailwind utility colors are stripped by most
              browsers' default "background graphics off" print setting.
            */}
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

            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={true}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            {/* Header */}
            <div className="no-print flex flex-col shadow-lg sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-5 md:mb-5 lg:mb-5 gap-4 bg-white rounded-lg">
                <div className="flex items-center gap-4 text-center sm:text-right">
                    {/* <img src={logogo} alt="Broker City Properties" className="hidden sm:block h-14 w-14 rounded-full object-cover shadow" />
                     */}
                    <div>
                        <h2 className="text-2xl md:text-2xl font-bold lg:text-2xl font-extrabold text-gray-800 tracking-wide">
                            المعاملات المالية
                        </h2>
                        <p className="text-base md:text-md text-gray-600 mt-1">
                            إدارة المعاملات المالية (إيداع / سحب)
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        className="bg-green-600 cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-green-700 hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                        onClick={() => {
                            setSelectedTransaction(null);
                            setShowAddDepositModal(true);
                        }}
                    >
                        + إيداع
                    </button>
                    <button
                        className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:text-white hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                        onClick={() => {
                            setSelectedTransaction(null);
                            setShowAddWithdrawModal(true);
                        }}
                    >
                        - سحب
                    </button>

                    <button
                        className="flex items-center justify-center gap-2 bg-[#E5322D] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#b8241f] hover:text-white hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                        onClick={handleDownloadPdf}
                        disabled={isExporting || isGeneratingPdf || isGeneratingExcel}
                    >
                        {isGeneratingPdf
                            ? 'جارٍ إنشاء PDF...'
                            : isExporting && pendingExportAction === 'pdf'
                                ? 'جارٍ التجهيز...'
                                : 'PDF'}
                        <FaFilePdf className="inline" />
                    </button>

                    <button
                        className="flex items-center justify-center gap-2 bg-[#1D6F42] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#155330] hover:text-white hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                        onClick={handleDownloadExcel}
                        disabled={isExporting || isGeneratingPdf || isGeneratingExcel}
                    >
                        {isGeneratingExcel
                            ? 'جارٍ إنشاء Excel...'
                            : isExporting && pendingExportAction === 'excel'
                                ? 'جارٍ التجهيز...'
                                : 'Excel'}
                        <FaFileExcel className="inline" />
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="no-print max-w-full mx-auto px-4 md:px-3 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between border-r-4 border-green-500">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">إجمالي الإيداعات (الصفحة الحالية)</p>
                        <p className="text-2xl font-extrabold text-green-600 mt-1">{formatMoney(pageStats.totalDeposit)}</p>
                    </div>
                    <FaArrowTrendUp className="text-green-500" size="34" />
                </div>
                <div className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between border-r-4 border-red-500">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">إجمالي السحوبات (الصفحة الحالية)</p>
                        <p className="text-2xl font-extrabold text-red-600 mt-1">{formatMoney(pageStats.totalWithdraw)}</p>
                    </div>
                    <FaArrowTrendDown className="text-red-500" size="34" />
                </div>
                <div className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between border-r-4 border-[#a47d52]">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">الرصيد (الصفحة الحالية)</p>
                        <p className={`text-2xl font-extrabold mt-1 ${pageStats.balance >= 0 ? 'text-[#a47d52]' : 'text-red-600'}`}>
                            {formatMoney(pageStats.balance)}
                        </p>
                    </div>
                    <FaScaleBalanced className="text-[#a47d52]" size="34" />
                </div>
            </div>

            {/* Filters */}
            <div className="no-print max-w-full mx-auto px-4 md:px-3 mb-6">
                <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:w-1/3 relative">
                        <FaMagnifyingGlass className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث عن معاملة (رقم، بيان، رقم الشيك)..."
                            className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-1/5">
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">جميع الأنواع</option>
                            <option value="deposit">إيداع</option>
                            <option value="withdraw">سحب</option>
                        </select>
                    </div>
                    <div className="w-full md:w-1/5">
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
                            value={filterPaymentMethod}
                            onChange={(e) => setFilterPaymentMethod(e.target.value)}
                        >
                            <option value="">جميع طرق الدفع</option>
                            <option value="banks">بنوك</option>
                            <option value="cash">نقدي</option>
                        </select>
                    </div>
                    <div className="w-full md:w-auto flex gap-3 items-center">
                        <span className="text-gray-600 text-sm whitespace-nowrap">
                            إجمالي: {totalCount} معاملة
                        </span>
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                            value={pageSize}
                            onChange={handlePageSizeChange}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                        {(searchTerm || filterType || filterPaymentMethod) && (
                            <button
                                onClick={handleResetFilters}
                                title="إعادة تعيين الفلاتر"
                                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm hover:bg-gray-50 transition-colors duration-200"
                            >
                                <FaRotateRight />
                                إعادة تعيين
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="no-print max-w-full mx-auto px-4 md:px-3">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a47d52]"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-20">
                            <MdAccountBalanceWallet className="mx-auto text-gray-300" size="56" />
                            <p className="text-gray-500 text-lg mt-3">لا توجد معاملات</p>
                            <p className="text-gray-400 text-sm mt-2">قم بإضافة معاملة جديدة</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#e9e6e1] text-[#a47d52] sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-right text-sm font-bold">#</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">رقم المعاملة</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">التاريخ</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">النوع</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">طريقة الدفع</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">من حساب</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">الى حساب</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">المستلم / المُسلِّم</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">المبلغ</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold">البيان</th>
                                            <th className="px-6 py-4 text-center text-sm font-bold">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((transaction, index) => (
                                            <tr
                                                key={transaction.id}
                                                className="border-b border-gray-200 odd:bg-white even:bg-gray-50 hover:bg-[#f8f2e7] transition-colors duration-200"
                                            >
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    {(currentPage - 1) * pageSize + index + 1}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium text-gray-800">
                                                    {transaction.transaction_no}
                                                </td>
                                                {/* ✅ UPDATED: date cell forced LTR so DD/Mon/YYYY reads left-to-right inside RTL table */}
                                                <td className="px-6 py-4 text-right text-sm text-gray-700" dir="ltr">
                                                    {formatDate(transaction.transaction_date)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {getTypeBadge(transaction.type)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {getPaymentMethodBadge(transaction.payment_method)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {renderAccountValue(transaction.account_from)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {transaction.account_to}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {getPersonDisplay(transaction)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {getAmountDisplay(transaction)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700 max-w-[150px] truncate" title={transaction.statement || ''}>
                                                    {transaction.statement || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleUpdate(transaction)}
                                                            className="cursor-pointer px-2 py-2 bg-white text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                                                            title="توقيع"
                                                        >
                                                            <FaFileSignature className="text-[#a47d52]" size="22" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleViewTransaction(transaction.id)}
                                                            className="cursor-pointer px-2 py-2 bg-white text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                                                            title="عرض"
                                                        >
                                                            <BiSolidShow className='text-green-600' size='22' />
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => handleDelete(transaction.id)}
                                                            className="cursor-pointer px-2 py-2 bg-white text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                                                            title="حذف"
                                                        >
                                                            <MdDeleteForever className="text-red-600" size="22" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>

                                    {/*
                                        Table Footer with Totals (current page) — a single row,
                                        matching the light-gold (#FFE699) totals row used in the
                                        PDF export and the .xlsx worksheet: a label spanning the
                                        descriptive columns, then the deposit / withdraw / balance
                                        sums sitting under the same column positions the PDF uses
                                        for Income / Expense / Balance (columns 9, 10, 11).
                                    */}
                                    <tfoot>
                                        <tr className="bg-[#e6d5c0] border-t-2 border-[#BF9000]">
                                            <td colSpan="8" className="px-6 py-4 text-right text-sm font-extrabold text-gray-900">
                                                الإجمالي الكلي — Gross Total
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-extrabold text-green-700">
                                                {formatMoney(pageStats.totalDeposit)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-extrabold text-red-700">
                                                {formatMoney(pageStats.totalWithdraw)}
                                            </td>
                                            <td className={`px-6 py-4 text-center text-sm font-extrabold ${pageStats.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                {formatMoney(pageStats.balance)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-sm text-gray-600">
                                        عرض {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} من {totalCount} معاملة
                                    </div>
                                    {renderPagination()}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            

            {/* ================= PRINT / PDF VIEW — styled to match the Accounting Worksheet .xlsx ================= */}
            <div className="print-area">
                {/* Title bar — white background, bold black text, matches xlsx row 1 */}
                <table dir="ltr" 
                    style={{ direction: 'ltr', width: '100%', borderCollapse: 'collapse', fontFamily: 'Calibri, Arial, sans-serif' }}>
                    <thead>
                        {/* Line 1 — logo only */}
                        <tr>
                            <th colSpan={11} style={{ padding: '10px 6px 4px', border: '1px solid #000', borderBottom: 'none', background: '#FFFFFF' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <img src={logogo} alt="logo" 
                                        style={{ height: 72, width: 64, objectFit: 'cover', borderRadius: '50%',}} 
                                        className='object-contain
                                        scale-[2.5]
                                        transform-gpu
                                        my-2
                                        '
                                        />
                                </div>
                            </th>
                        </tr>
                        {/* Line 2 — headers/title text, underneath the logo */}
                        <tr>
                            <th colSpan={11} style={{ padding: '4px 6px 10px', border: '1px solid #000', borderTop: 'none', background: '#FFFFFF' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#000' }}>
                                        {COMPANY_NAME_EN} — {COMPANY_NAME_AR}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#000', marginTop: 4 }}>
                                        Accounting Worksheet — ورقة عمل المحاسبة
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 400, color: '#333', marginTop: 2 }}>
                                        Generated: {printGeneratedAt}
                                    </div>
                                </div>
                            </th>
                        </tr>
                        {/* Column headers — dark gold #BF9000 fill, bold black text, matches xlsx row 2 */}
                        {/* <tr style={{ background: '#BF9000' }}> */}
                        <tr className = 'bg-[#e6d5c0]'>
                            <th style={thStyle}>Serial No.{'\n'}الرقم التسلسلي</th>
                            <th style={thStyle}>Date{'\n'}التاريخ</th>
                            <th style={thStyle}>Voucher No.{'\n'}رقم السند</th>
                            <th style={thStyle}>Inv / Receipt No.{'\n'}رقم الفاتوره / الايصال</th>
                            <th style={thStyle}>Recipient / Deliverer{'\n'}المستلم / المستفيد</th>
                            <th style={thStyle}>Description{'\n'}البيان</th>
                            
                            <th style={thStyle}>To Account{'\n'}تم التحويل الى حساب</th>
                            
                            <th style={thStyle}>Income{'\n'}الدخل</th>
                            <th style={thStyle}>Expense{'\n'}المصروف</th>
                            <th style={thStyle}>Balance{'\n'}الرصيد</th>
                        </tr>
                    </thead>
                    <tbody>
                        {printRows.map((t, index) => (
                            <tr key={t.id} style={{ background: index % 2 === 0 ? '#FFFFFF' : '#FAF7F0' }}>
                                <td style={tdStyle}>{index + 1}</td>
                                {/* ✅ UPDATED: date cell forced LTR in print/PDF too */}
                                <td style={tdStyle} dir="ltr">{formatDate(t.transaction_date)}</td>
                                <td style={tdStyle}>{t.transaction_no}</td>
                                 <td style={tdStyle}>{t.document_no}</td>
                                <td style={tdStyle}>{t.type === 'withdraw' ? (t.person_receipt || '-') : (t.person_deliver || '-')}</td>
                                <td style={{ ...tdStyle, textAlign: 'right', maxWidth: 220 }}>{t.statement || '-'}</td>
                                
                                <td style={tdStyle}>{t.account_to || '-'}</td>
                                {/* <td style={tdStyle}>{t.payment_method === 'banks' ? 'بنوك' : t.payment_method === 'cash' ? 'نقدي' : (t.payment_method || '-')}</td>
                                 */}
                                <td style={{ ...tdStyle, color: '#1a7a1a', fontWeight: 700 }}>{t.type === 'deposit' ? formatMoney(t.amount) : ''}</td>
                                <td style={{ ...tdStyle, color: '#b30000', fontWeight: 700 }}>{t.type === 'withdraw' ? formatMoney(t.amount) : ''}</td>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>{formatMoney(t.runningBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        {/*
                            Totals row — light gold #FFE699 fill, bold black text, matches xlsx row 73.
                            One label spans columns 1-8, then the Income / Expense / Balance sums sit
                            under their own columns (9 / 10 / 11) — same layout the table footer above
                            and the Excel export both use, so all three stay visually consistent.
                        */}
                        {/* <tr style={{ background: '#FFE699' }}> */}
                        <tr className="bg-[#e6d5c0] border-t-2 border-[#BF9000]">
                            <td colSpan={7} style={{ ...tdStyle, fontWeight: 800, textAlign: 'right' }}>
                                Gross Total — المجموع الكلي
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 800, color: '#1a7a1a' }}>{formatMoney(printTotals.totalIncome)}</td>
                            <td style={{ ...tdStyle, fontWeight: 800, color: '#b30000' }}>{formatMoney(printTotals.totalExpense)}</td>
                            <td style={{ ...tdStyle, fontWeight: 800 }}>{formatMoney(printTotals.balance)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* ===== MODALS - All modals rendered here ===== */}

            {/* Transaction Details Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto no-print">
                    {/* Backdrop with blur effect */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={handleCloseModal}
                    ></div>

                    {/* Modal Content */}
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto bg-[#f8f7f5]">

                            {/* Close Button */}
                            <button
                                onClick={handleCloseModal}
                                className="sticky top-4 float-end z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200 m-4"
                                title="Close"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Transaction Details */}
                            <TransactionDetails
                                transactionId={selectedTransactionId}
                                onClose={handleCloseModal}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Deposit Modal */}
            {showAddDepositModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto no-print">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-4xl">
                            <AddDeposit
                                onClose={handleModalClose}
                                initialData={selectedTransaction}
                                isEditMode={!!selectedTransaction}
                                onSuccess={() => fetchTransactions(currentPage)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showAddWithdrawModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto no-print">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-4xl">
                            <AddWithdraw
                                onClose={handleModalClose}
                                initialData={selectedTransaction}
                                isEditMode={!!selectedTransaction}
                                onSuccess={() => fetchTransactions(currentPage)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Shared inline styles for the print table (kept out of Tailwind so colors survive printing)
const thStyle = {
    border: '1px solid #000',
    padding: '8px 6px',
    fontSize: 11,
    fontWeight: 700,
    color: '#000',
    textAlign: 'center',
    whiteSpace: 'pre-line',
};

const tdStyle = {
    border: '1px solid #ccc',
    padding: '6px',
    fontSize: 10.5,
    color: '#000',
    textAlign: 'center',
};

export default Transactions;

// import React, { useState, useEffect, useMemo } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import AddDeposit from '../../components/ar/transactions/AddDeposit';
// import AddWithdraw from '../../components/ar/transactions/AddWithdraw';
// import TransactionDetails from '../../components/ar/transactions/TransactionDetails';
// import { BiSolidShow } from "react-icons/bi";
// import { MdDeleteForever, MdAccountBalanceWallet, MdModeEdit } from "react-icons/md";
// import {
//     FaFilePdf,
//     FaFileExcel,
//     FaArrowTrendUp,
//     FaArrowTrendDown,
//     FaScaleBalanced,
//     FaRotateRight,
//     FaMagnifyingGlass,
// } from "react-icons/fa6";
// import { FaFileSignature } from "react-icons/fa6";

// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
// // Note: if your installed jspdf version only exposes a named export, use:
// // import { jsPDF } from 'jspdf';
// import ExcelJS from 'exceljs';

// import logogo from '../../assets/images/logogo-removebg.png'

// // Base URL from environment variables
// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// // Company identity used on the printed worksheet (mirrors the accounting .xlsx export)
// const COMPANY_NAME_EN = 'Broker City Properties';
// const COMPANY_NAME_AR = 'بروكر سيتي العقارية';

// // FOR fetch account_from, account_to, ...
// const renderAccountValue = (value) => {
//     if (!value) return '-';
//     return (
//         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-800">
//             {value}
//         </span>
//     );
// };

// const formatMoney = (value) =>
//     (parseFloat(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// const formatDate = (value) => {
//     if (!value) return '-';
//     try {
//         return new Date(value).toLocaleDateString('ar-EG');
//     } catch {
//         return value;
//     }
// };

// const Transactions = () => {
//     const [transactions, setTransactions] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [showAddWithdrawModal, setShowAddWithdrawModal] = useState(false);
//     const [showAddDepositModal, setShowAddDepositModal] = useState(false);
//     const [selectedTransaction, setSelectedTransaction] = useState(null);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [filterType, setFilterType] = useState('');
//     const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
//     const [error, setError] = useState('');

//     // Pagination states
//     const [currentPage, setCurrentPage] = useState(1);
//     const [pageSize, setPageSize] = useState(10);
//     const [totalPages, setTotalPages] = useState(0);
//     const [totalCount, setTotalCount] = useState(0);
//     const [nextPage, setNextPage] = useState(null);
//     const [previousPage, setPreviousPage] = useState(null);

//     // Modal state for TransactionDetails
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [selectedTransactionId, setSelectedTransactionId] = useState(null);

//     // Export state — the printable/downloadable worksheet is built from the FULL filtered
//     // dataset, not just the current page, so the report matches the .xlsx export.
//     const [printData, setPrintData] = useState([]);
//     const [isExporting, setIsExporting] = useState(false); // fetching data for PDF / Excel
//     const [pendingExportAction, setPendingExportAction] = useState(null); // 'pdf' | 'excel' | null
//     const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // rendering the PDF file itself
//     const [isGeneratingExcel, setIsGeneratingExcel] = useState(false); // building the .xlsx file itself

//     const handleViewTransaction = (transactionId) => {
//         setSelectedTransactionId(transactionId);
//         setIsModalOpen(true);
//     };

//     const handleCloseModal = () => {
//         setIsModalOpen(false);
//         setSelectedTransactionId(null);
//     };

//     // Build the query string shared by the paginated fetch and the "fetch everything for export" call
//     const buildQuery = ({ page, size }) => {
//         let url = `${BASE}/api/transactions/?page=${page}&page_size=${size}`;
//         if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
//         if (filterType) url += `&type=${filterType}`;
//         if (filterPaymentMethod) url += `&payment_method=${filterPaymentMethod}`;
//         return url;
//     };

//     // Fetch transactions with pagination
//     const fetchTransactions = async (page = 1) => {
//         setLoading(true);
//         setError('');

//         try {
//             const token = localStorage.getItem('access_token');

//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول لعرض المعاملات');
//                 setLoading(false);
//                 return;
//             }

//             const url = buildQuery({ page, size: pageSize });

//             const response = await fetch(url, {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": `Bearer ${token}`
//                 }
//             });

//             if (!response.ok) {
//                 if (response.status === 401) {
//                     toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
//                 } else {
//                     toast.error('فشل تحميل المعاملات');
//                 }
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();

//             if (data && data.results && Array.isArray(data.results)) {
//                 setTransactions(data.results);
//                 setTotalCount(data.count || 0);
//                 setTotalPages(Math.ceil((data.count || 0) / pageSize));
//                 setNextPage(data.next);
//                 setPreviousPage(data.previous);
//             } else if (data && Array.isArray(data)) {
//                 setTransactions(data);
//                 setTotalCount(data.length);
//                 setTotalPages(Math.ceil(data.length / pageSize));
//                 setNextPage(null);
//                 setPreviousPage(null);
//             } else {
//                 setTransactions([]);
//                 setTotalCount(0);
//                 setTotalPages(0);
//             }

//             setLoading(false);
//         } catch (err) {
//             setError('فشل تحميل المعاملات');
//             setLoading(false);
//             console.error('Error fetching transactions:', err);
//             toast.error('❌ حدث خطأ أثناء جلب المعاملات');
//         }
//     };

//     // Handle search with debounce
//     useEffect(() => {
//         const delayDebounceFn = setTimeout(() => {
//             if (currentPage === 1) {
//                 fetchTransactions(1);
//             } else {
//                 setCurrentPage(1);
//             }
//         }, 500);

//         return () => clearTimeout(delayDebounceFn);
//     }, [searchTerm, filterType, filterPaymentMethod]);

//     // Fetch on page change
//     useEffect(() => {
//         fetchTransactions(currentPage);
//     }, [currentPage]);

//     // Initial fetch
//     useEffect(() => {
//         fetchTransactions(1);
//     }, []);

//     // Once the full dataset is fetched, run whichever export action was requested
//     useEffect(() => {
//         if (isExporting || printData.length === 0 || !pendingExportAction) return;

//         if (pendingExportAction === 'pdf') {
//             const timer = setTimeout(() => {
//                 generatePdf().finally(() => setPendingExportAction(null));
//             }, 200);
//             return () => clearTimeout(timer);
//         }

//         if (pendingExportAction === 'excel') {
//             const timer = setTimeout(() => {
//                 generateExcel().finally(() => setPendingExportAction(null));
//             }, 50);
//             return () => clearTimeout(timer);
//         }
//     }, [isExporting, printData, pendingExportAction]);

//     // Delete transaction
//     const handleDelete = async (id) => {
//         if (!window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;

//         try {
//             const token = localStorage.getItem('access_token');

//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول');
//                 return;
//             }

//             const response = await fetch(
//                 `${BASE}/api/transactions/${id}/delete/`,
//                 {
//                     method: "DELETE",
//                     headers: {
//                         "Content-Type": "application/json",
//                         "Authorization": `Bearer ${token}`
//                     }
//                 }
//             );

//             if (!response.ok) {
//                 if (response.status === 401) {
//                     toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
//                 } else {
//                     toast.error('فشل حذف المعاملة');
//                 }
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             toast.success('✅ تم حذف المعاملة بنجاح');
//             fetchTransactions(currentPage);
//         } catch (error) {
//             console.error('Error deleting transaction:', error);
//             toast.error('❌ حدث خطأ أثناء حذف المعاملة');
//         }
//     };

//     // Update transaction
//     const handleUpdate = (transaction) => {
//         setSelectedTransaction(transaction);

//         if (transaction.type === 'deposit') {
//             setShowAddDepositModal(true);
//         } else if (transaction.type === 'withdraw') {
//             setShowAddWithdrawModal(true);
//         } else {
//             toast.error('نوع المعاملة غير معروف');
//         }
//     };

//     // Handle modal close
//     const handleModalClose = () => {
//         setShowAddDepositModal(false);
//         setShowAddWithdrawModal(false);
//         setSelectedTransaction(null);
//         fetchTransactions(currentPage);
//     };

//     // Reset all filters back to defaults
//     const handleResetFilters = () => {
//         setSearchTerm('');
//         setFilterType('');
//         setFilterPaymentMethod('');
//         setCurrentPage(1);
//     };

//     // Fetch the ENTIRE filtered result set (not just this page) — shared by PDF and Excel export
//     const fetchFullDatasetForExport = async () => {
//         const token = localStorage.getItem('access_token');

//         if (!token) {
//             toast.error('يرجى تسجيل الدخول لعرض المعاملات');
//             return null;
//         }

//         const url = buildQuery({ page: 1, size: 100000 });
//         const response = await fetch(url, {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Authorization": `Bearer ${token}`
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         const rows = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

//         // Chronological order, oldest first, to match the running balance in the .xlsx worksheet
//         return [...rows].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
//     };

//     const handleDownloadPdf = async () => {
//         try {
//             setIsExporting(true);
//             setPendingExportAction('pdf');
//             const sorted = await fetchFullDatasetForExport();
//             if (sorted) {
//                 setPrintData(sorted);
//             } else {
//                 setPendingExportAction(null);
//             }
//         } catch (err) {
//             console.error('Error preparing PDF download data:', err);
//             toast.error('❌ تعذر تجهيز ملف PDF');
//             setPendingExportAction(null);
//         } finally {
//             setIsExporting(false);
//         }
//     };

//     const handleDownloadExcel = async () => {
//         try {
//             setIsExporting(true);
//             setPendingExportAction('excel');
//             const sorted = await fetchFullDatasetForExport();
//             if (sorted) {
//                 setPrintData(sorted);
//             } else {
//                 setPendingExportAction(null);
//             }
//         } catch (err) {
//             console.error('Error preparing Excel download data:', err);
//             toast.error('❌ تعذر تجهيز ملف Excel');
//             setPendingExportAction(null);
//         } finally {
//             setIsExporting(false);
//         }
//     };

//     // Renders the exact same print-area DOM (same design/colors/logo) into a multi-page PDF
//     const generatePdf = async () => {
//         const element = document.querySelector('.print-area');
//         if (!element) return;

//         try {
//             setIsGeneratingPdf(true);

//             const canvas = await html2canvas(element, {
//                 scale: 2,
//                 backgroundColor: '#ffffff',
//                 useCORS: true,
//             });

//             const imgData = canvas.toDataURL('image/png');
//             const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

//             const pageWidth = pdf.internal.pageSize.getWidth();
//             const pageHeight = pdf.internal.pageSize.getHeight();
//             const imgWidth = pageWidth;
//             const imgHeight = (canvas.height * imgWidth) / canvas.width;

//             let heightLeft = imgHeight;
//             let position = 0;

//             pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//             heightLeft -= pageHeight;

//             while (heightLeft > 0) {
//                 position -= pageHeight;
//                 pdf.addPage();
//                 pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//                 heightLeft -= pageHeight;
//             }

//             const fileName = `Broker_City_Transactions_${new Date().toISOString().slice(0, 10)}.pdf`;
//             pdf.save(fileName);
//         } catch (err) {
//             console.error('Error generating PDF:', err);
//             toast.error('❌ تعذر إنشاء ملف PDF');
//         } finally {
//             setIsGeneratingPdf(false);
//         }
//     };

//     // Builds a styled .xlsx workbook — same columns, same colors (#BF9000 header / #FFE699
//     // totals), same logo and layout as the printed worksheet / PDF export.
// //     const generateExcel = async () => {
// //         try {
// //             setIsGeneratingExcel(true);

// //             const workbook = new ExcelJS.Workbook();
// //             workbook.creator = COMPANY_NAME_EN;
// //             workbook.created = new Date();

// //             const sheet = workbook.addWorksheet('Transactions', {
// //                 views: [{ rightToLeft: false }],
// //                 pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
// //             });

// //             const columnWidths = [10, 13, 16, 24, 34, 18, 18, 14, 14, 14, 16];
// //             sheet.columns = columnWidths.map((width) => ({ width }));
// //             const columnCount = columnWidths.length;

// //             const thinBorder = {
// //                 top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
// //                 left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
// //                 bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
// //                 right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
// //             };

// //             // Row 1 — title, merged across every column, white background + bold black text
// //             sheet.mergeCells(1, 1, 1, columnCount);
// //             const titleRow = sheet.getRow(1);
// //             titleRow.height = 56;
// //             const titleCell = titleRow.getCell(1);
// //             titleCell.value =
// //                 `${COMPANY_NAME_EN} — ${COMPANY_NAME_AR}\n` +
// //                 'Accounting Worksheet — ورقة عمل المحاسبة';
// //             titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
// //             titleCell.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
// //             titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
// //             titleCell.border = thinBorder;

// //             // Best-effort logo embed in the top-left corner (falls back silently if it can't be fetched)
// //             try {
// //                 const logoResponse = await fetch(logogo);
// //                 const logoBuffer = await logoResponse.arrayBuffer();
// //                 const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'jpeg' });
// //                 sheet.addImage(imageId, {
// //                     tl: { col: 0.1, row: 0.1 },
// //                     ext: { width: 56, height: 56 },
// //                 });
// //             } catch (imgErr) {
// //                 console.warn('Logo could not be embedded in the Excel file:', imgErr);
// //             }

// //             // Row 2 — column headers, dark gold fill (#BF9000) + bold black text
// //             const headerRow = sheet.addRow([
// //                 'Serial No.\nتسلسلي',
// //                 'Date\nالتاريخ',
// //                 'Voucher No.\nرقم السند',
// //                 'Invoice/Receipt No\nرقم الفاتوره / الايصال',
// //                 'Recipient / Beneficiary\nالمستلم / المستفيد',

// //                 'Description\nالبيان',
              
// //                 'To Account Name\nتم التحويل الى  حساب',
                
// //                 'Income\nالدخل',
// //                 'Expense\nالمصروف',
// //                 'Balance\nالرصيد',
// //             ]);
// //             headerRow.height = 34;
// //             headerRow.eachCell((cell) => {
// //                 cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBF9000' } };
// //                 cell.font = { bold: true, color: { argb: 'FF000000' } };
// //                 cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
// //                 cell.border = thinBorder;
// //             });

// //             // Data rows — same running balance shown in the PDF/print worksheet
// //             printRows.forEach((t, index) => {
// //                 const row = sheet.addRow([
// //                     index + 1,
// //                     formatDate(t.transaction_date),
// //                     t.transaction_no,
// //                     t.document_no,
// //                     t.type === 'withdraw' ? (t.person_receipt || '-') : (t.person_deliver || '-'),
// //                     t.statement || '-',
                   
// //                     t.account_to || '-',
// //                     // t.payment_method === 'banks' ? 'بنوك' : t.payment_method === 'cash' ? 'نقدي' : (t.payment_method || '-'),
                   
// //                     t.type === 'deposit' ? parseFloat(t.amount) || 0 : null,
// //                     t.type === 'withdraw' ? parseFloat(t.amount) || 0 : null,
// //                     t.runningBalance,
// //                 ]);

// //                 const zebraFill = index % 2 === 0 ? 'FFFFFFFF' : 'FFFAF7F0';
// //                 row.eachCell((cell, colNumber) => {
// //                     cell.border = thinBorder;
// //                     cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: colNumber === 5 };
// //                     cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraFill } };
// //                     if (colNumber === 9 || colNumber === 10 || colNumber === 11) {
// //                         cell.numFmt = '#,##0.00';
// //                     }
// //                 });
// //                 row.getCell(9).font = { bold: true, color: { argb: 'FF1A7A1A' } }; // Income — green
// //                 row.getCell(10).font = { bold: true, color: { argb: 'FFB30000' } }; // Expense — red
// //                 row.getCell(11).font = { bold: true, color: { argb: 'FF000000' } }; // Balance
// //             });

// //             // Totals row — light gold fill (#FFE699) + bold black text, matches the .xlsx worksheet
// //             // AND the print/PDF footer: one label spanning columns 1-8, then Income / Expense /
// //             // Balance sums sitting under their own columns (9 / 10 / 11).
// //             // const totalsRow = sheet.addRow([
// //             //     '', '', '', '', '', '','',
// //             //     'Gross Total — المجموع الكلي',
// //             //     printTotals.totalIncome,
// //             //     printTotals.totalExpense,
// //             //     printTotals.balance,
// //             // ]);
// //             const totalsRow = sheet.addRow([
// //     '',                           // 1 — Serial No.
// //     '',                           // 2 — Date
// //     '',                           // 3 — Voucher No.
// //     '',                           // 4 — Invoice/Receipt No
// //     '',                           // 5 — Recipient / Beneficiary
// //     '',                           // 6 — Description
// //     'Gross Total — المجموع الكلي', // 7 — To Account Name (used as label column)
// //     printTotals.totalIncome,      // 8 — Income
// //     printTotals.totalExpense,     // 9 — Expense
// //     printTotals.balance,          // 10 — Balance
// // ]);

// // // Merge columns 1–7 so the label spans the descriptive area
// // sheet.mergeCells(totalsRow.number, 1, totalsRow.number, 7);

// //             sheet.mergeCells(totalsRow.number, 1, totalsRow.number, 8);
// //             totalsRow.eachCell((cell, colNumber) => {
// //                 cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
// //                 cell.font = { bold: true, color: { argb: 'FF000000' } };
// //                 cell.border = thinBorder;
// //                 cell.alignment = { horizontal: colNumber === 1 ? 'right' : 'center', vertical: 'middle' };
// //                 if (colNumber === 9 || colNumber === 10 || colNumber === 11) {
// //                     cell.numFmt = '#,##0.00';
// //                 }
// //             });

// //             const buffer = await workbook.xlsx.writeBuffer();
// //             const blob = new Blob([buffer], {
// //                 type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
// //             });
// //             const url = URL.createObjectURL(blob);
// //             const link = document.createElement('a');
// //             link.href = url;
// //             link.download = `Broker_City_Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`;
// //             document.body.appendChild(link);
// //             link.click();
// //             document.body.removeChild(link);
// //             URL.revokeObjectURL(url);
// //         } catch (err) {
// //             console.error('Error generating Excel file:', err);
// //             toast.error('❌ تعذر إنشاء ملف Excel');
// //         } finally {
// //             setIsGeneratingExcel(false);
// //         }
// //     };

//     const generateExcel = async () => {
//     try {
//         setIsGeneratingExcel(true);

//         const workbook = new ExcelJS.Workbook();
//         workbook.creator = COMPANY_NAME_EN;
//         workbook.created = new Date();

//         const sheet = workbook.addWorksheet('Transactions', {
//             views: [{ rightToLeft: false }],
//             pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
//         });

//         // ✅ FIX 1: 10 columns only (matches the 10 header names)
//         // Order: S | Date | Voucher No. | Invoice No. | Recipient | Description | To Account | Income | Expense | Balance
//         const columnWidths = [10, 13, 16, 24, 34, 18, 18, 14, 14, 16];
//         sheet.columns = columnWidths.map((width) => ({ width }));
//         const columnCount = columnWidths.length; // = 10

//         const thinBorder = {
//             top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
//             left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
//             bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
//             right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
//         };

//         // ============================================================
//         // ROW 1 — Title (merged across all 10 columns)
//         // ============================================================
//         sheet.mergeCells(1, 1, 1, columnCount);
//         const titleRow = sheet.getRow(1);
//         titleRow.height = 56;
//         const titleCell = titleRow.getCell(1);
//         titleCell.value =
//             `${COMPANY_NAME_EN} — ${COMPANY_NAME_AR}\n` +
//             'Accounting Worksheet — ورقة عمل المحاسبة';
//         titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
//         titleCell.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
//         titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
//         titleCell.border = thinBorder;

//         // Logo (best-effort)
//         try {
//             const logoResponse = await fetch(logogo);
//             const logoBuffer = await logoResponse.arrayBuffer();
//             const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'jpeg' });
//             sheet.addImage(imageId, {
//                 tl: { col: 0.1, row: 0.1 },
//                 ext: { width: 56, height: 56 },
//             });
//         } catch (imgErr) {
//             console.warn('Logo could not be embedded in the Excel file:', imgErr);
//         }

//         // ============================================================
//         // ROW 2 — Header (10 columns, dark gold #BF9000)
//         // ============================================================
//         const headerRow = sheet.addRow([
//             'Serial No.\nتسلسلي',                            // 1
//             'Date\nالتاريخ',                                  // 2
//             'Voucher No.\nرقم السند',                         // 3
//             'Invoice/Receipt No\nرقم الفاتوره / الايصال',     // 4
//             'Recipient / Beneficiary\nالمستلم / المستفيد',   // 5
//             'Description\nالبيان',                            // 6
//             'To Account Name\nتم التحويل الى حساب',           // 7
//             'Income\nالدخل',                                  // 8
//             'Expense\nالمصروف',                               // 9
//             'Balance\nالرصيد',                                // 10
//         ]);
//         headerRow.height = 34;
//         headerRow.eachCell((cell) => {
//             cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBF9000' } };
//             cell.font = { bold: true, color: { argb: 'FF000000' } };
//             cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
//             cell.border = thinBorder;
//         });

//         // ============================================================
//         // DATA ROWS — 10 values per row (columns 8/9/10 = Income/Expense/Balance)
//         // ============================================================
//         printRows.forEach((t, index) => {
//             const row = sheet.addRow([
//                 index + 1,                                                             // 1
//                 formatDate(t.transaction_date),                                        // 2
//                 t.transaction_no,                                                      // 3
//                 t.document_no || '-',                                                  // 4
//                 t.type === 'withdraw'                                                  // 5
//                     ? (t.person_receipt || '-')
//                     : (t.person_deliver || '-'),
//                 t.statement || '-',                                                    // 6
//                 t.account_to || '-',                                                   // 7
//                 t.type === 'deposit' ? (parseFloat(t.amount) || 0) : null,             // 8  Income
//                 t.type === 'withdraw' ? (parseFloat(t.amount) || 0) : null,            // 9  Expense
//                 t.runningBalance,                                                      // 10 Balance
//             ]);

//             const zebraFill = index % 2 === 0 ? 'FFFFFFFF' : 'FFFAF7F0';

//             row.eachCell((cell, colNumber) => {
//                 cell.border = thinBorder;
//                 cell.alignment = {
//                     horizontal: 'center',
//                     vertical: 'middle',
//                     wrapText: colNumber === 5 || colNumber === 6,
//                 };
//                 cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraFill } };

//                 // ✅ FIX: number format on columns 8, 9, 10 (Income, Expense, Balance)
//                 if (colNumber === 8 || colNumber === 9 || colNumber === 10) {
//                     cell.numFmt = '#,##0.00';
//                 }
//             });

//             // ✅ FIX: colors on the correct columns
//             row.getCell(8).font = { bold: true, color: { argb: 'FF1A7A1A' } }; // Income — green
//             row.getCell(9).font = { bold: true, color: { argb: 'FFB30000' } }; // Expense — red
//             row.getCell(10).font = { bold: true, color: { argb: 'FF000000' } }; // Balance — black
//         });

//         // ============================================================
//         // TOTALS ROW — 10 values, merge columns 1–7 for the label
//         // ============================================================
//         const totalsRow = sheet.addRow([
//             '',                            // 1
//             '',                            // 2
//             '',                            // 3
//             '',                            // 4
//             '',                            // 5
//             '',                            // 6
//             'Gross Total — المجموع الكلي',  // 7  (label starts here)
//             printTotals.totalIncome,       // 8  Income
//             printTotals.totalExpense,      // 9  Expense
//             printTotals.balance,           // 10 Balance
//         ]);

//         // ✅ FIX: only ONE merge call — columns 1 through 7
//         sheet.mergeCells(totalsRow.number, 1, totalsRow.number, 7);

//         totalsRow.eachCell((cell, colNumber) => {
//             cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
//             cell.font = { bold: true, color: { argb: 'FF000000' } };
//             cell.border = thinBorder;
//             cell.alignment = {
//                 horizontal: colNumber === 1 ? 'right' : 'center',
//                 vertical: 'middle',
//             };

//             // ✅ FIX: number format on columns 8, 9, 10
//             if (colNumber === 8 || colNumber === 9 || colNumber === 10) {
//                 cell.numFmt = '#,##0.00';
//             }
//         });

//         // ============================================================
//         // WRITE FILE
//         // ============================================================
//         const buffer = await workbook.xlsx.writeBuffer();
//         const blob = new Blob([buffer], {
//             type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         });
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = `Broker_City_Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(url);
//     } catch (err) {
//         console.error('Error generating Excel file:', err);
//         toast.error('❌ تعذر إنشاء ملف Excel');
//     } finally {
//         setIsGeneratingExcel(false);
//     }
// };



//     // Get type badge
//     const getTypeBadge = (type) => {
//         if (type === 'deposit') {
//             return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-green-100 text-green-800">إيداع</span>;
//         } else if (type === 'withdraw') {
//             return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-red-100 text-red-800">سحب</span>;
//         }
//         return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{type}</span>;
//     };

//     // Get payment method badge
//     const getPaymentMethodBadge = (method) => {
//         if (method === 'banks') {
//             return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-blue-100 text-blue-800">بنوك</span>;
//         } else if (method === 'cash') {
//             return <span className="px-3 py-1 rounded-xs text-xs font-bold bg-yellow-100 text-yellow-800">نقدي</span>;
//         }
//         return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{method}</span>;
//     };

//     // Withdraw shows who received the cash (person_receipt); deposit shows who delivered it (person_deliver)
//     const getPersonDisplay = (transaction) => {
//         if (transaction.type === 'withdraw') return transaction.person_receipt || '-';
//         if (transaction.type === 'deposit') return transaction.person_deliver || '-';
//         return transaction.person_receipt || transaction.person_deliver || '-';
//     };

//     // Get amount display with color
//     const getAmountDisplay = (transaction) => {
//         const amount = parseFloat(transaction.amount);
//         if (transaction.type === 'deposit') {
//             return <span className="text-green-600 font-bold">+ {amount.toFixed(2)}</span>;
//         } else {
//             return <span className="text-red-600 font-bold">- {amount.toFixed(2)}</span>;
//         }
//     };

//     // Pagination controls
//     const handlePageChange = (page) => {
//         if (page >= 1 && page <= totalPages) {
//             setCurrentPage(page);
//         }
//     };

//     const handlePageSizeChange = (e) => {
//         const newSize = parseInt(e.target.value);
//         setPageSize(newSize);
//         setCurrentPage(1);
//     };

//     // Totals for the current page — mirrors the single-row table footer below
//     const pageStats = useMemo(() => {
//         const totalDeposit = transactions.reduce(
//             (sum, t) => (t.type === 'deposit' ? sum + parseFloat(t.amount || 0) : sum),
//             0
//         );
//         const totalWithdraw = transactions.reduce(
//             (sum, t) => (t.type === 'withdraw' ? sum + parseFloat(t.amount || 0) : sum),
//             0
//         );
//         return { totalDeposit, totalWithdraw, balance: totalDeposit - totalWithdraw };
//     }, [transactions]);

//     // Totals + running balance for the full print/export dataset
//     const printRows = useMemo(() => {
//         let running = 0;
//         return printData.map((t) => {
//             const amount = parseFloat(t.amount || 0);
//             if (t.type === 'deposit') running += amount;
//             else if (t.type === 'withdraw') running -= amount;
//             return { ...t, runningBalance: running };
//         });
//     }, [printData]);

//     const printTotals = useMemo(() => {
//         const totalIncome = printData.reduce(
//             (sum, t) => (t.type === 'deposit' ? sum + parseFloat(t.amount || 0) : sum),
//             0
//         );
//         const totalExpense = printData.reduce(
//             (sum, t) => (t.type === 'withdraw' ? sum + parseFloat(t.amount || 0) : sum),
//             0
//         );
//         return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
//     }, [printData]);

//     const printGeneratedAt = new Date().toLocaleString('ar-EG');

//     // Pagination component
//     const renderPagination = () => {
//         if (totalPages <= 1) return null;

//         const pages = [];
//         const maxVisible = 5;
//         let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
//         let endPage = Math.min(totalPages, startPage + maxVisible - 1);

//         if (endPage - startPage < maxVisible - 1) {
//             startPage = Math.max(1, endPage - maxVisible + 1);
//         }

//         for (let i = startPage; i <= endPage; i++) {
//             pages.push(i);
//         }

//         return (
//             <div className="flex items-center gap-2 mt-6 justify-center">
//                 <button
//                     onClick={() => handlePageChange(currentPage - 1)}
//                     disabled={currentPage === 1}
//                     className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
//                 >
//                     السابق
//                 </button>

//                 {startPage > 1 && (
//                     <>
//                         <button
//                             onClick={() => handlePageChange(1)}
//                             className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
//                         >
//                             1
//                         </button>
//                         {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
//                     </>
//                 )}

//                 {pages.map((page) => (
//                     <button
//                         key={page}
//                         onClick={() => handlePageChange(page)}
//                         className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
//                             currentPage === page
//                                 ? 'bg-[#a47d52] text-white border-[#a47d52]'
//                                 : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
//                         }`}
//                     >
//                         {page}
//                     </button>
//                 ))}

//                 {endPage < totalPages && (
//                     <>
//                         {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
//                         <button
//                             onClick={() => handlePageChange(totalPages)}
//                             className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
//                         >
//                             {totalPages}
//                         </button>
//                     </>
//                 )}

//                 <button
//                     onClick={() => handlePageChange(currentPage + 1)}
//                     disabled={currentPage === totalPages}
//                     className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
//                 >
//                     التالي
//                 </button>
//             </div>
//         );
//     };

//     return (
//         <div className="min-h-screen bg-[#f8f7f5] py-10 px-5 md:py-12 md:px-8 lg:py-5 lg:px-0 rtl">
//             {/*
//               Print-only CSS. Colors are hard-coded hex values (matching the accounting .xlsx
//               worksheet's theme: dark gold header #BF9000, light gold totals #FFE699) and forced
//               on with print-color-adjust, because Tailwind utility colors are stripped by most
//               browsers' default "background graphics off" print setting.
//             */}
//             <style>{`
//                 .print-area {
//                     position: absolute;
//                     top: -10000px;
//                     left: -10000px;
//                     width: 1400px;
//                     background: #ffffff;
//                 }
//                 @media print {
//                     body * { visibility: hidden; }
//                     .no-print { display: none !important; }
//                     .print-area, .print-area * { visibility: visible; }
//                     .print-area {
//                         position: absolute;
//                         inset: 0;
//                         top: 0;
//                         left: 0;
//                         width: 100%;
//                     }
//                     @page { size: landscape; margin: 10mm; }
//                     .print-area, .print-area table, .print-area th, .print-area td {
//                         -webkit-print-color-adjust: exact !important;
//                         print-color-adjust: exact !important;
//                         color-adjust: exact !important;
//                     }
//                     .print-area table { page-break-inside: auto; }
//                     .print-area tr { page-break-inside: avoid; page-break-after: auto; }
//                     .print-area thead { display: table-header-group; }
//                     .print-area tfoot { display: table-footer-group; }
//                 }
//             `}</style>

//             <ToastContainer
//                 position="top-center"
//                 autoClose={3000}
//                 hideProgressBar={false}
//                 newestOnTop={false}
//                 closeOnClick
//                 rtl={true}
//                 pauseOnFocusLoss
//                 draggable
//                 pauseOnHover
//                 theme="light"
//             />

//             {/* Header */}
//             <div className="no-print flex flex-col shadow-lg sm:flex-row justify-between items-center max-w-full mx-auto px-4 md:px-3 mb-5 md:mb-5 lg:mb-5 gap-4 bg-white rounded-lg">
//                 <div className="flex items-center gap-4 text-center sm:text-right">
//                     {/* <img src={logogo} alt="Broker City Properties" className="hidden sm:block h-14 w-14 rounded-full object-cover shadow" />
//                      */}
//                     <div>
//                         <h2 className="text-2xl md:text-2xl font-bold lg:text-2xl font-extrabold text-gray-800 tracking-wide">
//                             المعاملات المالية
//                         </h2>
//                         <p className="text-base md:text-md text-gray-600 mt-1">
//                             إدارة المعاملات المالية (إيداع / سحب)
//                         </p>
//                     </div>
//                 </div>
//                 <div className="flex flex-col sm:flex-row gap-3">
//                     <button
//                         className="bg-green-600 cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-green-700 hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
//                         onClick={() => {
//                             setSelectedTransaction(null);
//                             setShowAddDepositModal(true);
//                         }}
//                     >
//                         + إيداع
//                     </button>
//                     <button
//                         className="bg-[#a47d52] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#8a6a44] hover:text-white hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
//                         onClick={() => {
//                             setSelectedTransaction(null);
//                             setShowAddWithdrawModal(true);
//                         }}
//                     >
//                         - سحب
//                     </button>

//                     <button
//                         className="flex items-center justify-center gap-2 bg-[#E5322D] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#b8241f] hover:text-white hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
//                         onClick={handleDownloadPdf}
//                         disabled={isExporting || isGeneratingPdf || isGeneratingExcel}
//                     >
//                         {isGeneratingPdf
//                             ? 'جارٍ إنشاء PDF...'
//                             : isExporting && pendingExportAction === 'pdf'
//                                 ? 'جارٍ التجهيز...'
//                                 : 'PDF'}
//                         <FaFilePdf className="inline" />
//                     </button>

//                     <button
//                         className="flex items-center justify-center gap-2 bg-[#1D6F42] cursor-pointer text-white px-6 md:px-8 py-3 rounded-sm font-extrabold text-sm md:text-base uppercase tracking-wide transition-all duration-300 hover:bg-[#155330] hover:text-white hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
//                         onClick={handleDownloadExcel}
//                         disabled={isExporting || isGeneratingPdf || isGeneratingExcel}
//                     >
//                         {isGeneratingExcel
//                             ? 'جارٍ إنشاء Excel...'
//                             : isExporting && pendingExportAction === 'excel'
//                                 ? 'جارٍ التجهيز...'
//                                 : 'Excel'}
//                         <FaFileExcel className="inline" />
//                     </button>
//                 </div>
//             </div>

//             {/* Summary cards */}
//             <div className="no-print max-w-full mx-auto px-4 md:px-3 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
//                 <div className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between border-r-4 border-green-500">
//                     <div>
//                         <p className="text-sm text-gray-500 font-medium">إجمالي الإيداعات (الصفحة الحالية)</p>
//                         <p className="text-2xl font-extrabold text-green-600 mt-1">{formatMoney(pageStats.totalDeposit)}</p>
//                     </div>
//                     <FaArrowTrendUp className="text-green-500" size="34" />
//                 </div>
//                 <div className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between border-r-4 border-red-500">
//                     <div>
//                         <p className="text-sm text-gray-500 font-medium">إجمالي السحوبات (الصفحة الحالية)</p>
//                         <p className="text-2xl font-extrabold text-red-600 mt-1">{formatMoney(pageStats.totalWithdraw)}</p>
//                     </div>
//                     <FaArrowTrendDown className="text-red-500" size="34" />
//                 </div>
//                 <div className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between border-r-4 border-[#a47d52]">
//                     <div>
//                         <p className="text-sm text-gray-500 font-medium">الرصيد (الصفحة الحالية)</p>
//                         <p className={`text-2xl font-extrabold mt-1 ${pageStats.balance >= 0 ? 'text-[#a47d52]' : 'text-red-600'}`}>
//                             {formatMoney(pageStats.balance)}
//                         </p>
//                     </div>
//                     <FaScaleBalanced className="text-[#a47d52]" size="34" />
//                 </div>
//             </div>

//             {/* Filters */}
//             <div className="no-print max-w-full mx-auto px-4 md:px-3 mb-6">
//                 <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-4 items-center">
//                     <div className="w-full md:w-1/3 relative">
//                         <FaMagnifyingGlass className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400" />
//                         <input
//                             type="text"
//                             placeholder="بحث عن معاملة (رقم، بيان، رقم الشيك)..."
//                             className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                         />
//                     </div>
//                     <div className="w-full md:w-1/5">
//                         <select
//                             className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
//                             value={filterType}
//                             onChange={(e) => setFilterType(e.target.value)}
//                         >
//                             <option value="">جميع الأنواع</option>
//                             <option value="deposit">إيداع</option>
//                             <option value="withdraw">سحب</option>
//                         </select>
//                     </div>
//                     <div className="w-full md:w-1/5">
//                         <select
//                             className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#a47d52] focus:border-transparent bg-white"
//                             value={filterPaymentMethod}
//                             onChange={(e) => setFilterPaymentMethod(e.target.value)}
//                         >
//                             <option value="">جميع طرق الدفع</option>
//                             <option value="banks">بنوك</option>
//                             <option value="cash">نقدي</option>
//                         </select>
//                     </div>
//                     <div className="w-full md:w-auto flex gap-3 items-center">
//                         <span className="text-gray-600 text-sm whitespace-nowrap">
//                             إجمالي: {totalCount} معاملة
//                         </span>
//                         <select
//                             className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
//                             value={pageSize}
//                             onChange={handlePageSizeChange}
//                         >
//                             <option value="5">5</option>
//                             <option value="10">10</option>
//                             <option value="20">20</option>
//                             <option value="50">50</option>
//                         </select>
//                         {(searchTerm || filterType || filterPaymentMethod) && (
//                             <button
//                                 onClick={handleResetFilters}
//                                 title="إعادة تعيين الفلاتر"
//                                 className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm hover:bg-gray-50 transition-colors duration-200"
//                             >
//                                 <FaRotateRight />
//                                 إعادة تعيين
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Main Table */}
//             <div className="no-print max-w-full mx-auto px-4 md:px-3">
//                 <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//                     {loading ? (
//                         <div className="flex justify-center items-center py-20">
//                             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a47d52]"></div>
//                         </div>
//                     ) : transactions.length === 0 ? (
//                         <div className="text-center py-20">
//                             <MdAccountBalanceWallet className="mx-auto text-gray-300" size="56" />
//                             <p className="text-gray-500 text-lg mt-3">لا توجد معاملات</p>
//                             <p className="text-gray-400 text-sm mt-2">قم بإضافة معاملة جديدة</p>
//                         </div>
//                     ) : (
//                         <>
//                             <div className="overflow-x-auto">
//                                 <table className="w-full">
//                                     <thead className="bg-[#e9e6e1] text-[#a47d52] sticky top-0 z-10">
//                                         <tr>
//                                             <th className="px-6 py-4 text-right text-sm font-bold">#</th>
//                                             <th className="px-6 py-4 text-right text-sm font-bold">رقم المعاملة</th>
//                                             <th className="px-6 py-4 text-right text-sm font-bold">التاريخ</th>
//                                             <th className="px-6 py-4 text-right text-sm font-bold">النوع</th>
//                                             <th className="px-6 py-4 text-right text-sm font-bold">طريقة الدفع</th>
//                                             <th className="px-6 py-4 text-right text-sm font-bold">من حساب</th>
//                                             <th className="px-6 py-4 text-right text-sm font-bold">الى حساب</th>
//                                             <th className="px-6 py-4 text-right text-sm font-bold">المستلم / المُسلِّم</th>
//                                             <th className="px-6 py-4 text-right text-sm font-bold">المبلغ</th>
//                                             <th className="px-6 py-4 text-right text-sm font-bold">البيان</th>
//                                             <th className="px-6 py-4 text-center text-sm font-bold">الإجراءات</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {transactions.map((transaction, index) => (
//                                             <tr
//                                                 key={transaction.id}
//                                                 className="border-b border-gray-200 odd:bg-white even:bg-gray-50 hover:bg-[#f8f2e7] transition-colors duration-200"
//                                             >
//                                                 <td className="px-6 py-4 text-right text-sm text-gray-700">
//                                                     {(currentPage - 1) * pageSize + index + 1}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-right text-sm font-medium text-gray-800">
//                                                     {transaction.transaction_no}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-right text-sm text-gray-700">
//                                                     {formatDate(transaction.transaction_date)}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-right text-sm">
//                                                     {getTypeBadge(transaction.type)}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-right text-sm">
//                                                     {getPaymentMethodBadge(transaction.payment_method)}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-right text-sm">
//                                                     {renderAccountValue(transaction.account_from)}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-right text-sm">
//                                                     {transaction.account_to}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-right text-sm">
//                                                     {getPersonDisplay(transaction)}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-right text-sm">
//                                                     {getAmountDisplay(transaction)}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-right text-sm text-gray-700 max-w-[150px] truncate" title={transaction.statement || ''}>
//                                                     {transaction.statement || '-'}
//                                                 </td>
//                                                 <td className="px-6 py-4 text-center">
//                                                     <div className="flex justify-center gap-2">
//                                                         <button
//                                                             onClick={() => handleUpdate(transaction)}
//                                                             className="cursor-pointer px-2 py-2 bg-white text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
//                                                             title="توقيع"
//                                                         >
//                                                             <FaFileSignature className="text-[#a47d52]" size="22" />
//                                                         </button>
//                                                         <button
//                                                             onClick={() => handleViewTransaction(transaction.id)}
//                                                             className="cursor-pointer px-2 py-2 bg-white text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
//                                                             title="عرض"
//                                                         >
//                                                             <BiSolidShow className='text-green-600' size='22' />
//                                                         </button>
                                                        
//                                                         <button
//                                                             onClick={() => handleDelete(transaction.id)}
//                                                             className="cursor-pointer px-2 py-2 bg-white text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
//                                                             title="حذف"
//                                                         >
//                                                             <MdDeleteForever className="text-red-600" size="22" />
//                                                         </button>
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                     </tbody>

//                                     {/*
//                                         Table Footer with Totals (current page) — a single row,
//                                         matching the light-gold (#FFE699) totals row used in the
//                                         PDF export and the .xlsx worksheet: a label spanning the
//                                         descriptive columns, then the deposit / withdraw / balance
//                                         sums sitting under the same column positions the PDF uses
//                                         for Income / Expense / Balance (columns 9, 10, 11).
//                                     */}
//                                     <tfoot>
//                                         <tr className="bg-[#e6d5c0] border-t-2 border-[#BF9000]">
//                                             <td colSpan="8" className="px-6 py-4 text-right text-sm font-extrabold text-gray-900">
//                                                 الإجمالي الكلي — Gross Total
//                                             </td>
//                                             <td className="px-6 py-4 text-right text-sm font-extrabold text-green-700">
//                                                 {formatMoney(pageStats.totalDeposit)}
//                                             </td>
//                                             <td className="px-6 py-4 text-right text-sm font-extrabold text-red-700">
//                                                 {formatMoney(pageStats.totalWithdraw)}
//                                             </td>
//                                             <td className={`px-6 py-4 text-center text-sm font-extrabold ${pageStats.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
//                                                 {formatMoney(pageStats.balance)}
//                                             </td>
//                                         </tr>
//                                     </tfoot>
//                                 </table>
//                             </div>

//                             {/* Pagination */}
//                             <div className="px-6 py-4 border-t border-gray-200">
//                                 <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
//                                     <div className="text-sm text-gray-600">
//                                         عرض {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} من {totalCount} معاملة
//                                     </div>
//                                     {renderPagination()}
//                                 </div>
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </div>


//             {/* ================= PRINT / PDF VIEW — styled to match the Accounting Worksheet .xlsx ================= */}
//             <div className="print-area">
//                 {/* Title bar — white background, bold black text, matches xlsx row 1 */}
//                 <table dir="ltr" 
//                     style={{ direction: 'ltr', width: '100%', borderCollapse: 'collapse', fontFamily: 'Calibri, Arial, sans-serif' }}>
//                     <thead>
//                         {/* Line 1 — logo only */}
//                         <tr>
//                             <th colSpan={11} style={{ padding: '10px 6px 4px', border: '1px solid #000', borderBottom: 'none', background: '#FFFFFF' }}>
//                                 <div style={{ display: 'flex', justifyContent: 'center' }}>
//                                     <img src={logogo} alt="logo" 
//                                         style={{ height: 72, width: 64, objectFit: 'cover', borderRadius: '50%',}} 
//                                         className='object-contain
//                                         scale-[2.5]
//                                         transform-gpu
//                                         my-2
//                                         '
//                                         />
//                                 </div>
//                             </th>
//                         </tr>
//                         {/* Line 2 — headers/title text, underneath the logo */}
//                         <tr>
//                             <th colSpan={11} style={{ padding: '4px 6px 10px', border: '1px solid #000', borderTop: 'none', background: '#FFFFFF' }}>
//                                 <div style={{ textAlign: 'center' }}>
//                                     <div style={{ fontSize: 18, fontWeight: 800, color: '#000' }}>
//                                         {COMPANY_NAME_EN} — {COMPANY_NAME_AR}
//                                     </div>
//                                     <div style={{ fontSize: 14, fontWeight: 700, color: '#000', marginTop: 4 }}>
//                                         Accounting Worksheet — ورقة عمل المحاسبة
//                                     </div>
//                                     <div style={{ fontSize: 11, fontWeight: 400, color: '#333', marginTop: 2 }}>
//                                         Generated: {printGeneratedAt}
//                                     </div>
//                                 </div>
//                             </th>
//                         </tr>
//                         {/* Column headers — dark gold #BF9000 fill, bold black text, matches xlsx row 2 */}
//                         {/* <tr style={{ background: '#BF9000' }}> */}
//                         <tr className = 'bg-[#e6d5c0]'>
//                             <th style={thStyle}>Serial No.{'\n'}الرقم التسلسلي</th>
//                             <th style={thStyle}>Date{'\n'}التاريخ</th>
//                             <th style={thStyle}>Voucher No.{'\n'}رقم السند</th>
//                             <th style={thStyle}>Inv / Receipt No.{'\n'}رقم الفاتوره / الايصال</th>
//                             <th style={thStyle}>Recipient / Deliverer{'\n'}المستلم / المستفيد</th>
//                             <th style={thStyle}>Description{'\n'}البيان</th>
                            
//                             <th style={thStyle}>To Account{'\n'}تم التحويل الى حساب</th>
                            
//                             <th style={thStyle}>Income{'\n'}الدخل</th>
//                             <th style={thStyle}>Expense{'\n'}المصروف</th>
//                             <th style={thStyle}>Balance{'\n'}الرصيد</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {printRows.map((t, index) => (
//                             <tr key={t.id} style={{ background: index % 2 === 0 ? '#FFFFFF' : '#FAF7F0' }}>
//                                 <td style={tdStyle}>{index + 1}</td>
//                                 <td style={tdStyle}>{formatDate(t.transaction_date)}</td>
//                                 <td style={tdStyle}>{t.transaction_no}</td>
//                                  <td style={tdStyle}>{t.document_no}</td>
//                                 <td style={tdStyle}>{t.type === 'withdraw' ? (t.person_receipt || '-') : (t.person_deliver || '-')}</td>
//                                 <td style={{ ...tdStyle, textAlign: 'right', maxWidth: 220 }}>{t.statement || '-'}</td>
                                
//                                 <td style={tdStyle}>{t.account_to || '-'}</td>
//                                 {/* <td style={tdStyle}>{t.payment_method === 'banks' ? 'بنوك' : t.payment_method === 'cash' ? 'نقدي' : (t.payment_method || '-')}</td>
//                                  */}
//                                 <td style={{ ...tdStyle, color: '#1a7a1a', fontWeight: 700 }}>{t.type === 'deposit' ? formatMoney(t.amount) : ''}</td>
//                                 <td style={{ ...tdStyle, color: '#b30000', fontWeight: 700 }}>{t.type === 'withdraw' ? formatMoney(t.amount) : ''}</td>
//                                 <td style={{ ...tdStyle, fontWeight: 700 }}>{formatMoney(t.runningBalance)}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                     <tfoot>
//                         {/*
//                             Totals row — light gold #FFE699 fill, bold black text, matches xlsx row 73.
//                             One label spans columns 1-8, then the Income / Expense / Balance sums sit
//                             under their own columns (9 / 10 / 11) — same layout the table footer above
//                             and the Excel export both use, so all three stay visually consistent.
//                         */}
//                         {/* <tr style={{ background: '#FFE699' }}> */}
//                         <tr className="bg-[#e6d5c0] border-t-2 border-[#BF9000]">
//                             <td colSpan={7} style={{ ...tdStyle, fontWeight: 800, textAlign: 'right' }}>
//                                 Gross Total — المجموع الكلي
//                             </td>
//                             <td style={{ ...tdStyle, fontWeight: 800, color: '#1a7a1a' }}>{formatMoney(printTotals.totalIncome)}</td>
//                             <td style={{ ...tdStyle, fontWeight: 800, color: '#b30000' }}>{formatMoney(printTotals.totalExpense)}</td>
//                             <td style={{ ...tdStyle, fontWeight: 800 }}>{formatMoney(printTotals.balance)}</td>
//                         </tr>
//                     </tfoot>
//                 </table>
//             </div>

//             {/* ===== MODALS - All modals rendered here ===== */}

//             {/* Transaction Details Modal */}
//             {isModalOpen && (
//                 <div className="fixed inset-0 z-50 overflow-y-auto no-print">
//                     {/* Backdrop with blur effect */}
//                     <div
//                         className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
//                         onClick={handleCloseModal}
//                     ></div>

//                     {/* Modal Content */}
//                     <div className="flex min-h-full items-center justify-center p-4">
//                         <div className="relative rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto bg-[#f8f7f5]">

//                             {/* Close Button */}
//                             <button
//                                 onClick={handleCloseModal}
//                                 className="sticky top-4 float-end z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200 m-4"
//                                 title="Close"
//                             >
//                                 <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                                 </svg>
//                             </button>

//                             {/* Transaction Details */}
//                             <TransactionDetails
//                                 transactionId={selectedTransactionId}
//                                 onClose={handleCloseModal}
//                             />
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Deposit Modal */}
//             {showAddDepositModal && (
//                 <div className="fixed inset-0 z-50 overflow-y-auto no-print">
//                     <div className="flex min-h-full items-center justify-center p-4">
//                         <div className="relative w-full max-w-4xl">
//                             <AddDeposit
//                                 onClose={handleModalClose}
//                                 initialData={selectedTransaction}
//                                 isEditMode={!!selectedTransaction}
//                                 onSuccess={() => fetchTransactions(currentPage)}
//                             />
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Withdraw Modal */}
//             {showAddWithdrawModal && (
//                 <div className="fixed inset-0 z-50 overflow-y-auto no-print">
//                     <div className="flex min-h-full items-center justify-center p-4">
//                         <div className="relative w-full max-w-4xl">
//                             <AddWithdraw
//                                 onClose={handleModalClose}
//                                 initialData={selectedTransaction}
//                                 isEditMode={!!selectedTransaction}
//                                 onSuccess={() => fetchTransactions(currentPage)}
//                             />
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// // Shared inline styles for the print table (kept out of Tailwind so colors survive printing)
// const thStyle = {
//     border: '1px solid #000',
//     padding: '8px 6px',
//     fontSize: 11,
//     fontWeight: 700,
//     color: '#000',
//     textAlign: 'center',
//     whiteSpace: 'pre-line',
// };

// const tdStyle = {
//     border: '1px solid #ccc',
//     padding: '6px',
//     fontSize: 10.5,
//     color: '#000',
//     textAlign: 'center',
// };

// export default Transactions;


