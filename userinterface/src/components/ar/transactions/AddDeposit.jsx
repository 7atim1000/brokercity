import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    FaSave,
    FaUniversity,
    FaMoneyBillWave,
    FaCheck,
    FaUpload,
    FaSignature,
    FaEraser
} from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import { formatAmountInWords } from '../../../utils/numberToArabic';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// =============================================================
// ARABIC ERROR MESSAGE TRANSLATOR
// =============================================================
const translateBackendError = (key, value) => {
    if (value === undefined || value === null || value === '') return '';

    const v = String(value);

    if (v.includes('Ensure this value is greater than or equal to')) {
        const min = v.match(/[\d.]+/)?.[0] || '';
        return `يجب أن تكون القيمة أكبر من أو تساوي ${min}`;
    }
    if (v.includes('Ensure this value is less than or equal to')) {
        const max = v.match(/[\d.]+/)?.[0] || '';
        return `يجب أن تكون القيمة أقل من أو تساوي ${max}`;
    }
    if (
        v.includes('This field may not be null') ||
        v.includes('This field may not be blank') ||
        v.includes('This field is required')
    ) {
        return 'هذا الحقل مطلوب';
    }
    if (
        v.includes('A valid number is required') ||
        v.includes('A valid integer is required')
    ) {
        return 'يرجى إدخال رقم صحيح';
    }
    if (
        v.includes('Invalid date') ||
        v.includes('Date has wrong format') ||
        v.includes('Expected a date but got')
    ) {
        return 'صيغة التاريخ غير صحيحة';
    }
    if (
        v.includes('Enter a valid') ||
        v.includes('is not a valid') ||
        v.includes('Invalid pk')
    ) {
        return 'القيمة المدخلة غير صحيحة';
    }

    const keyLabels = {
        vat: 'الضريبة (VAT)',
        subtotal: 'المبلغ قبل الضريبة',
        amount: 'الإجمالي',
        account_from: 'الحساب المصدر',
        account_to: 'الحساب الوجهة',
        bank: 'البنك',
        cashbox: 'الخزينة النقدية',
        statement: 'البيان',
        transaction_no: 'رقم المعاملة',
        transaction_date: 'تاريخ المعاملة',
        currency: 'العملة',
        check_no: 'رقم الشيك',
        check_bank: 'بنك الشيك',
        check_date: 'تاريخ الشيك',
        person_deliver: 'الشخص المسلم',
        person_receipt: 'الشخص المستلم',
        notes: 'الملاحظات',
        document_no: 'رقم المستند',
        document: 'المستند',
        payment_method: 'طريقة الدفع',
        type: 'نوع المعاملة'
    };

    const label = keyLabels[key] || key;
    return `${label}: ${v}`;
};

// =============================================================
// DETECT DUPLICATE TRANSACTION NO ERROR
// Checks raw backend error payload for uniqueness violation
// on the "transaction_no" field.
// =============================================================
const isDuplicateTransactionNoError = (errorData) => {
    if (!errorData || typeof errorData !== 'object') return false;

    const candidateKeys = [
        'transaction_no',
        'transaction_number',
        'transactionNo'
    ];

    for (const k of candidateKeys) {
        const val = errorData[k];
        if (!val) continue;

        const arr = Array.isArray(val) ? val : [val];
        for (const msg of arr) {
            const s = String(msg).toLowerCase();
            if (
                s.includes('already exists') ||
                s.includes('unique') ||
                s.includes('must be unique') ||
                s.includes('duplicate') ||
                s.includes('already been used')
            ) {
                return true;
            }
        }
    }

    return false;
};

const AddDeposit = ({
    onClose,
    transactionData,
    onSuccess,
    initialData,
    isEditMode: initialEditMode
}) => {

    // =========================================================
    // EDIT MODE
    // =========================================================
    const [isEditMode, setIsEditMode] = useState(
        initialEditMode || false
    );

    const [transactionId, setTransactionId] = useState(
        initialData?.id || null
    );

    // =========================================================
    // GENERAL STATE
    // =========================================================
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [banks, setBanks] = useState([]);
    const [cashboxes, setCashboxes] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [errors, setErrors] = useState({});
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // =========================================================
    // REFS
    // =========================================================
    const accountFromRef = useRef(null);
    const subtotalRef = useRef(null);
    const vatRef = useRef(null);
    const amountRef = useRef(null);
    const statementRef = useRef(null);
    const personDeliverRef = useRef(null);
    const personReceiptRef = useRef(null);
    const notesRef = useRef(null);
    const documentNoRef = useRef(null);
    const checkNoRef = useRef(null);
    const checkBankRef = useRef(null);
    const checkDateRef = useRef(null);
    const currencyRef = useRef(null);
    const transactionNoRef = useRef(null);
    const transactionDateRef = useRef(null);

    const userSignatureRef = useRef(null);
    const managerSignatureRef = useRef(null);
    const secondPersonSignatureRef = useRef(null);

    // =========================================================
    // DEFAULT FORM DATA
    // =========================================================
    const defaultFormData = {
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'deposit',
        subtotal: '',
        vat: '0.00',
        amount: '0.00',
        payment_method: '',
        account_from: '',
        account_to: '',
        bank: '',
        cashbox: '',
        statement: '',
        has_check: false,
        check_no: '',
        check_bank: '',
        check_date: '',
        person_deliver: '',
        person_receipt: '',
        notes: '',
        has_document: false,
        document: null,
        document_no: '-',
        currency: 'AED',
        amount_to_arabic: '',
        amount_to_english: '',
        transaction_no: '',
        transaction_user: null,
        user_signature: '',
        manager_signature: '',
        second_person_signature: '',
        created_at: '',
        updated_at: ''
    };

    const [formData, setFormData] = useState(defaultFormData);

    // =========================================================
    // CURRENCY OPTIONS
    // =========================================================
    const currencyOptions = [
        { value: 'AED', label: 'درهم اماراتي' },
        { value: 'USD', label: 'دولار أمريكي' },
        { value: 'EUR', label: 'يورو' },
        { value: 'SAR', label: 'ريال سعودي' }
    ];

    // =========================================================
    // FIELD STATUS
    // =========================================================
    const isAccountFromFilled =
        formData.account_from && formData.account_from !== '';

    const isSubtotalFilled =
        formData.subtotal &&
        parseFloat(formData.subtotal) > 0;

    const isAmountFilled =
        formData.amount &&
        parseFloat(formData.amount) > 0;

    const isStatementFilled =
        formData.statement &&
        formData.statement.trim() !== '';

    const isPersonDeliverFilled =
        formData.person_deliver &&
        formData.person_deliver.trim() !== '';

    const isTransactionNoFilled =
        formData.transaction_no &&
        formData.transaction_no.trim() !== '';

    // =========================================================
    // AMOUNT IN WORDS
    // =========================================================
    const getAmountInWords = () => {
        if (
            !formData.amount ||
            parseFloat(formData.amount) <= 0
        ) {
            return '';
        }

        return formatAmountInWords(formData.amount);
    };

    // =========================================================
    // FIELD STYLING
    // =========================================================
    const getFieldBorderColor = (isFilled, error) => {
        if (error) return '#ef4444';
        if (isFilled) return '#a47d52';
        return '#ef4444';
    };

    const getFieldShadow = (isFilled, error) => {
        if (error) {
            return '0 0 0 3px rgba(239, 68, 68, 0.15)';
        }

        if (isFilled) {
            return '0 0 0 3px rgba(164, 125, 82, 0.12)';
        }

        return '0 0 0 3px rgba(239, 68, 68, 0.08)';
    };

    // =========================================================
    // FETCH ACCOUNTS
    // =========================================================
    const fetchAccounts = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return [];

            const response = await fetch(
                `${BASE}/api/accounts/`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                console.error('Failed to fetch accounts:', response.status);
                return [];
            }

            const data = await response.json();
            const accountsData = data.results || data || [];
            setAccounts(accountsData);
            return accountsData;
        } catch (error) {
            console.error('Error fetching accounts:', error);
            return [];
        }
    };

    // =========================================================
    // FETCH BANKS
    // =========================================================
    const fetchBanks = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return [];

            const response = await fetch(
                `${BASE}/api/banks/`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                console.error('Failed to fetch banks:', response.status);
                return [];
            }

            const data = await response.json();
            const banksData = data.results || data || [];
            setBanks(banksData);
            return banksData;
        } catch (error) {
            console.error('Error fetching banks:', error);
            return [];
        }
    };

    // =========================================================
    // FETCH CASHBOXES
    // =========================================================
    const fetchCashboxes = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return [];

            const response = await fetch(
                `${BASE}/api/cashboxes/`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                console.error('Failed to fetch cashboxes:', response.status);
                return [];
            }

            const data = await response.json();
            const cashboxesData = data.results || data || [];
            setCashboxes(cashboxesData);
            return cashboxesData;
        } catch (error) {
            console.error('Error fetching cashboxes:', error);
            return [];
        }
    };

    // =========================================================
    // FIND ACCOUNT ID
    // =========================================================
    const findAccountIdByName = (accountName, accountsList) => {
        if (!accountName || !accountsList || accountsList.length === 0) {
            return '';
        }

        if (!isNaN(accountName) && accountName !== '') {
            return accountName;
        }

        let found = accountsList.find(
            (account) =>
                account.name === accountName ||
                account.name?.trim() === accountName?.trim()
        );

        if (!found) {
            found = accountsList.find(
                (account) =>
                    account.name?.toLowerCase().trim() ===
                    accountName?.toLowerCase().trim()
            );
        }

        if (!found) {
            console.warn('No matching account found for name:', accountName);
            return '';
        }

        return found.id;
    };

    // =========================================================
    // PAYMENT METHOD
    // =========================================================
    const handlePaymentMethodChange = (method) => {
        if (method !== 'banks' && method !== 'cash') {
            return;
        }

        setPaymentMethod(method);

        setFormData((prev) => ({
            ...prev,
            payment_method: method,
            ...(method === 'banks' ? { cashbox: '' } : { bank: '' })
        }));

        setErrors((prev) => ({
            ...prev,
            payment_method: '',
            ...(method === 'banks' ? { cashbox: '' } : { bank: '' })
        }));
    };

    // =========================================================
    // ONLY DEPEND ON ID.
    // =========================================================
    const initialDataId = initialData?.id ?? null;

    // =========================================================
    // LOAD EXISTING SIGNATURE INTO CANVAS
    // =========================================================
    const loadSignatureIntoCanvas = (canvasRef, dataUrl) => {
        if (!canvasRef?.current || !dataUrl) return;

        try {
            const canvas = canvasRef.current.getCanvas();
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                const ratio = Math.min(
                    canvas.width / img.width,
                    canvas.height / img.height
                );
                const newWidth = img.width * ratio;
                const newHeight = img.height * ratio;
                const x = (canvas.width - newWidth) / 2;
                const y = (canvas.height - newHeight) / 2;
                ctx.drawImage(img, x, y, newWidth, newHeight);
            };
            img.src = dataUrl;
        } catch (err) {
            console.warn('Failed to load signature into canvas:', err);
        }
    };

    // =========================================================
    // INITIAL DATA / LOAD
    // =========================================================
    useEffect(() => {
        let cancelled = false;

        const hasInitialData =
            initialData && Object.keys(initialData).length > 0;

        if (!hasInitialData) {
            setIsEditMode(false);
            setTransactionId(null);
            setFormData({ ...defaultFormData });
            setPaymentMethod(null);
            setErrors({});
            setIsDataLoaded(false);
        }

        const loadDataAndPopulate = async () => {
            const accountsData = await fetchAccounts();
            await fetchBanks();
            await fetchCashboxes();

            if (cancelled) return;

            if (hasInitialData) {
                setIsEditMode(true);
                setTransactionId(initialData.id);

                const bankId =
                    typeof initialData.bank === 'object'
                        ? initialData.bank?.id || ''
                        : initialData.bank || '';

                const cashboxId =
                    typeof initialData.cashbox === 'object'
                        ? initialData.cashbox?.id || ''
                        : initialData.cashbox || '';

                let accountFromValue = initialData.account_from || '';
                let accountToValue = initialData.account_to || '';

                if (accountsData && accountsData.length > 0) {
                    const foundAccountFromId = findAccountIdByName(
                        accountFromValue,
                        accountsData
                    );

                    if (foundAccountFromId) {
                        accountFromValue = foundAccountFromId;
                    }

                    if (accountToValue && isNaN(accountToValue)) {
                        const foundAccountToId = findAccountIdByName(
                            accountToValue,
                            accountsData
                        );

                        if (foundAccountToId) {
                            accountToValue = foundAccountToId;
                        }
                    }
                }

                const loadedSubtotal =
                    initialData.subtotal !== undefined &&
                    initialData.subtotal !== null &&
                    initialData.subtotal !== ''
                        ? parseFloat(initialData.subtotal).toFixed(2)
                        : (initialData.amount
                              ? (
                                    parseFloat(initialData.amount) -
                                    parseFloat(initialData.vat || 0)
                                ).toFixed(2)
                              : '');

                const loadedVat =
                    initialData.vat !== undefined &&
                    initialData.vat !== null &&
                    initialData.vat !== ''
                        ? parseFloat(initialData.vat).toFixed(2)
                        : '0.00';

                const loadedAmount =
                    initialData.amount !== undefined &&
                    initialData.amount !== null &&
                    initialData.amount !== ''
                        ? parseFloat(initialData.amount).toFixed(2)
                        : (
                              (parseFloat(loadedSubtotal || 0) || 0) +
                              (parseFloat(loadedVat || 0) || 0)
                          ).toFixed(2);

                setFormData({
                    ...defaultFormData,
                    ...initialData,

                    transaction_date:
                        initialData.transaction_date ||
                        new Date().toISOString().split('T')[0],

                    subtotal: loadedSubtotal,
                    vat: loadedVat,
                    amount: loadedAmount,

                    account_from: accountFromValue,
                    account_to: accountToValue,
                    bank: bankId,
                    cashbox: cashboxId,

                    statement: initialData.statement || '',
                    has_check: initialData.has_check || false,
                    check_no: initialData.check_no || '',
                    check_bank: initialData.check_bank || '',
                    check_date: initialData.check_date || '',
                    person_deliver: initialData.person_deliver || '',
                    person_receipt: initialData.person_receipt || '',
                    notes: initialData.notes || '',
                    has_document: !!initialData.document,
                    document_no: initialData.document_no || '',
                    currency: initialData.currency || 'AED',
                    amount_to_arabic: initialData.amount_to_arabic || '',
                    amount_to_english: initialData.amount_to_english || '',
                    transaction_no: initialData.transaction_no || '',
                    transaction_user: initialData.transaction_user || null,
                    user_signature: initialData.user_signature || '',
                    manager_signature: initialData.manager_signature || '',
                    second_person_signature:
                        initialData.second_person_signature || '',
                    created_at: initialData.created_at || '',
                    updated_at: initialData.updated_at || ''
                });

                if (initialData.payment_method === 'banks') {
                    setPaymentMethod('banks');
                } else if (initialData.payment_method === 'cash') {
                    setPaymentMethod('cash');
                } else if (bankId) {
                    setPaymentMethod('banks');
                } else if (cashboxId) {
                    setPaymentMethod('cash');
                } else {
                    setPaymentMethod(null);
                }

                setTimeout(() => {
                    if (initialData.user_signature) {
                        loadSignatureIntoCanvas(
                            userSignatureRef,
                            initialData.user_signature
                        );
                    }
                    if (initialData.manager_signature) {
                        loadSignatureIntoCanvas(
                            managerSignatureRef,
                            initialData.manager_signature
                        );
                    }
                    if (initialData.second_person_signature) {
                        loadSignatureIntoCanvas(
                            secondPersonSignatureRef,
                            initialData.second_person_signature
                        );
                    }
                }, 200);
            }

            if (!cancelled) {
                setIsDataLoaded(true);
            }
        };

        loadDataAndPopulate();

        return () => {
            cancelled = true;
        };
    }, [initialDataId]);

    // =========================================================
    // HANDLE INPUT
    // =========================================================
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            const file = files?.[0] || null;
            setFormData((prev) => ({ ...prev, [name]: file }));

            if (file) {
                setErrors((prev) => ({ ...prev, [name]: '' }));
            }
            return;
        }

        if (type === 'checkbox') {
            setFormData((prev) => ({ ...prev, [name]: checked }));
            return;
        }

        setFormData((prev) => {
            const updated = { ...prev, [name]: value };

            if (name === 'subtotal' || name === 'vat') {
                const sub = parseFloat(
                    name === 'subtotal' ? value : updated.subtotal
                ) || 0;
                const v = parseFloat(
                    name === 'vat' ? value : updated.vat
                ) || 0;
                const total = (sub + v).toFixed(2);

                updated.amount = total;

                if (parseFloat(total) > 0) {
                    updated.amount_to_arabic =
                        formatAmountInWords(parseFloat(total));
                    updated.amount_to_english =
                        formatAmountInWords(parseFloat(total));
                } else {
                    updated.amount_to_arabic = '';
                    updated.amount_to_english = '';
                }
            }

            return updated;
        });

        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // =========================================================
    // ENTER NAVIGATION
    // =========================================================
    const handleKeyDown = (e, nextRef) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (nextRef && nextRef.current) {
            nextRef.current.focus();
        }
    };

    // =========================================================
    // SIGNATURE HELPERS
    // =========================================================
    const clearSignature = (canvasRef) => {
        if (canvasRef?.current) {
            canvasRef.current.clear();
        }
    };

    const getSignatureData = (canvasRef) => {
        if (!canvasRef?.current) return '';
        try {
            if (canvasRef.current.isEmpty()) return '';
            return canvasRef.current.getCanvas().toDataURL('image/png');
        } catch (err) {
            console.error('Error getting signature data:', err);
            return '';
        }
    };

    // =========================================================
    // FETCH TRANSACTION
    // =========================================================
    const fetchTransactionDetails = async (id) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token || !id) return null;

            const response = await fetch(
                `${BASE}/api/transactions/${id}/`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (!response.ok) return null;

            const data = await response.json();

            let accountFromId = data.account_from || '';
            let accountToId = data.account_to || '';

            if (accountFromId && isNaN(accountFromId) && accounts.length > 0) {
                const foundId = findAccountIdByName(
                    accountFromId,
                    accounts
                );
                if (foundId) accountFromId = foundId;
            }

            if (accountToId && isNaN(accountToId) && accounts.length > 0) {
                const foundId = findAccountIdByName(accountToId, accounts);
                if (foundId) accountToId = foundId;
            }

            const sub =
                data.subtotal !== undefined && data.subtotal !== null
                    ? parseFloat(data.subtotal).toFixed(2)
                    : (data.amount
                          ? (
                                parseFloat(data.amount) -
                                parseFloat(data.vat || 0)
                            ).toFixed(2)
                          : '0.00');

            const v =
                data.vat !== undefined && data.vat !== null
                    ? parseFloat(data.vat).toFixed(2)
                    : '0.00';

            const total =
                data.amount !== undefined && data.amount !== null
                    ? parseFloat(data.amount).toFixed(2)
                    : (parseFloat(sub) + parseFloat(v)).toFixed(2);

            setFormData((prev) => ({
                ...prev,
                ...data,
                subtotal: sub,
                vat: v,
                amount: total,
                account_from: accountFromId,
                account_to: accountToId,
                bank: data.bank?.id || data.bank || prev.bank,
                cashbox: data.cashbox?.id || data.cashbox || prev.cashbox,
                transaction_user:
                    data.transaction_user || prev.transaction_user
            }));

            if (data.payment_method) {
                setPaymentMethod(data.payment_method);
            } else if (data.bank) {
                setPaymentMethod('banks');
            } else if (data.cashbox) {
                setPaymentMethod('cash');
            }

            return data;
        } catch (error) {
            console.error('Error fetching transaction:', error);
            return null;
        }
    };

    // =========================================================
    // HANDLE SUBMIT
    // =========================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        setLoading(true);
        setErrors({});

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('يرجى تسجيل الدخول');
                return;
            }

            // =================================================
            // VALIDATION — ONLY 3 REQUIRED FIELDS
            // 1) Amount (subtotal)
            // 2) Transaction No
            // 3) Statement
            // =================================================
            const newErrors = {};

            if (
                !formData.subtotal ||
                parseFloat(formData.subtotal) <= 0
            ) {
                newErrors.subtotal = 'يرجى إدخال المبلغ';
            }

            if (
                !formData.transaction_no ||
                formData.transaction_no.trim() === ''
            ) {
                newErrors.transaction_no = 'يرجى إدخال رقم المعاملة';
            }

            if (
                !formData.statement ||
                formData.statement.trim() === ''
            ) {
                newErrors.statement = 'يرجى إدخال البيان';
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);

                Object.values(newErrors).forEach((msg) => {
                    toast.error(`❌ ${msg}`);
                });

                return;
            }

            // =================================================
            // SIGNATURES
            // =================================================
            const userSignatureData =
                getSignatureData(userSignatureRef) ||
                formData.user_signature ||
                '';

            const managerSignatureData =
                getSignatureData(managerSignatureRef) ||
                formData.manager_signature ||
                '';

            const secondPersonSignatureData =
                getSignatureData(secondPersonSignatureRef) ||
                formData.second_person_signature ||
                '';

            // =================================================
            // PREPARE DATA
            // =================================================
            const computedSubtotal =
                parseFloat(formData.subtotal) || 0;

            const rawVat = parseFloat(formData.vat);
            const hasVat =
                !isNaN(rawVat) && rawVat > 0;

            const computedVat = hasVat
                ? parseFloat(rawVat.toFixed(2))
                : 0;

            const computedAmount = parseFloat(
                (computedSubtotal + computedVat).toFixed(2)
            );

            const submitData = {
                type: 'deposit',

                transaction_date:
                    formData.transaction_date ||
                    new Date().toISOString().split('T')[0],

                subtotal: computedSubtotal,
                amount: computedAmount,

                payment_method: paymentMethod,
                account_from: formData.account_from || '',
                account_to: '',
                statement: formData.statement,
                has_check: formData.has_check,
                currency: formData.currency || 'AED',
                person_deliver: formData.person_deliver || '',
                notes: formData.notes || '',
                user_signature: userSignatureData,
                manager_signature: managerSignatureData,
                second_person_signature: secondPersonSignatureData,
                transaction_no: formData.transaction_no || ''
            };

            if (hasVat) {
                submitData.vat = computedVat;
            }

            if (paymentMethod === 'banks' && formData.bank) {
                submitData.bank = parseInt(formData.bank, 10);
            }

            if (paymentMethod === 'cash' && formData.cashbox) {
                submitData.cashbox = parseInt(formData.cashbox, 10);
            }

            if (formData.has_check) {
                submitData.check_no = formData.check_no || '';
                submitData.check_bank = formData.check_bank || '';
                submitData.check_date = formData.check_date || '';
            }

            let hasFileUpload = false;
            let actualFile = null;

            if (formData.has_document) {
                submitData.has_document = true;
                submitData.document_no = formData.document_no || '';

                if (
                    formData.document instanceof File ||
                    formData.document instanceof Blob
                ) {
                    hasFileUpload = true;
                    actualFile = formData.document;
                }
            } else {
                submitData.has_document = false;
            }

            const url = isEditMode
                ? `${BASE}/api/transactions/${transactionId}/update/`
                : `${BASE}/api/transactions/create/`;

            const method = isEditMode ? 'PUT' : 'POST';

            let response;

            if (hasFileUpload && actualFile) {
                const formDataObj = new FormData();

                Object.keys(submitData).forEach((key) => {
                    const value = submitData[key];
                    if (value !== undefined && value !== null) {
                        formDataObj.append(key, value);
                    }
                });

                formDataObj.append('document', actualFile);

                response = await fetch(url, {
                    method,
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formDataObj
                });
            } else {
                response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(submitData)
                });
            }

            if (!response.ok) {
                let errorData = null;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = null;
                }

                console.error('Transaction error:', errorData);

                // =================================================
                // DUPLICATE TRANSACTION NO — explicit Arabic toast
                // =================================================
                if (isDuplicateTransactionNoError(errorData)) {
                    toast.error(
                        '❌ رقم المعاملة مستخدم بالفعل، يرجى إدخال رقم آخر'
                    );

                    setErrors((prev) => ({
                        ...prev,
                        transaction_no:
                            'رقم المعاملة مستخدم بالفعل، يرجى إدخال رقم آخر'
                    }));

                    return;
                }

                if (errorData) {
                    const errorMessages = [];
                    Object.keys(errorData).forEach((key) => {
                        const value = errorData[key];
                        if (Array.isArray(value)) {
                            value.forEach((v) => {
                                errorMessages.push(
                                    translateBackendError(key, v)
                                );
                            });
                        } else if (typeof value === 'string') {
                            errorMessages.push(
                                translateBackendError(key, value)
                            );
                        }
                    });

                    throw new Error(
                        errorMessages.join('\n') ||
                            'فشل حفظ المعاملة، يرجى المحاولة مرة أخرى'
                    );
                }

                throw new Error('فشل حفظ المعاملة، يرجى المحاولة مرة أخرى');
            }

            let result = null;
            try {
                result = await response.json();
            } catch {
                result = {};
            }

            console.log('Transaction saved:', result);

            if (!isEditMode) {
                toast.success('✅ تم إضافة الإيداع بنجاح');
            } else {
                toast.success('✅ تم تحديث الإيداع بنجاح');
            }

            onSuccess?.();
            handleClose();

        } catch (error) {
            console.error('Error saving transaction:', error);
            toast.error(
                '❌ ' +
                    (error?.message ||
                        'حدث خطأ أثناء حفظ المعاملة، يرجى المحاولة مرة أخرى')
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // CLOSE COMPONENT
    // =========================================================
    const handleClose = () => {
        if (loading) return;

        setIsEditMode(false);
        setTransactionId(null);
        setFormData({ ...defaultFormData });
        setPaymentMethod(null);
        setErrors({});
        setLoading(false);

        onClose?.();
    };

    // =========================================================
    // FORMAT DATE
    // =========================================================
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // =========================================================
    // USER DISPLAY NAME
    // =========================================================
    const getUserDisplayName = (user) => {
        if (!user) return 'غير معروف';
        if (typeof user === 'object') {
            return user.username || user.name || user.id || 'غير معروف';
        }
        return user;
    };

    // =========================================================
    // ACCOUNT NAME
    // =========================================================
    const getAccountName = (accountId) => {
        if (!accountId) return '';
        const account = accounts.find(
            (acc) => acc.id === parseInt(accountId, 10)
        );
        return account ? account.name : accountId;
    };

    // =========================================================
    // SIGNATURE CANVAS WRAPPER
    // =========================================================
    const SignatureField = ({
        label,
        canvasRef,
        existingData,
        placeholder
    }) => (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-600">
                    {label}
                </label>
                <button
                    type="button"
                    onClick={() => clearSignature(canvasRef)}
                    disabled={loading}
                    className="cursor-pointer flex items-center gap-1 text-[11px] text-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                    <FaEraser className="text-[10px]" />
                    مسح
                </button>
            </div>

            <div
                className="relative bg-white rounded-xl border-2 border-dashed overflow-hidden"
                style={{
                    borderColor: '#a47d52',
                    boxShadow: '0 0 0 3px rgba(164, 125, 82, 0.08)'
                }}
            >
                <SignatureCanvas
                    ref={canvasRef}
                    penColor="#1e293b"
                    backgroundColor="rgba(255,255,255,0)"
                    canvasProps={{
                        className:
                            'w-full h-24 sm:h-28 md:h-32 touch-none cursor-crosshair',
                        style: { touchAction: 'none' }
                    }}
                />
                {!existingData && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs text-slate-300 px-2 text-center">
                        {placeholder}
                    </span>
                )}
            </div>
        </div>
    );

    // =========================================================
    // SIGNATURES SECTION
    // =========================================================
    const SignaturesSection = () => (
        <div className="pt-4 sm:pt-5 border-t-2 border-[#a47d52]/25">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <FaSignature className="text-[#a47d52] text-sm" />
                <h4 className="text-sm font-bold text-slate-700">
                    التوقيعات
                </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <SignatureField
                    label="توقيع المحاسب"
                    canvasRef={userSignatureRef}
                    existingData={formData.user_signature}
                    placeholder="وقّع هنا بالإصبع أو القلم ..."
                />

                <SignatureField
                    label="توقيع المدير"
                    canvasRef={managerSignatureRef}
                    existingData={formData.manager_signature}
                    placeholder="وقّع هنا بالإصبع أو القلم ..."
                />

                <SignatureField
                    label="توقيع الشخص المسلم"
                    canvasRef={secondPersonSignatureRef}
                    existingData={formData.second_person_signature}
                    placeholder="وقّع هنا بالإصبع أو القلم ..."
                />
            </div>
        </div>
    );

    // =========================================================
    // RENDER
    // =========================================================
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-md p-2 sm:p-4">
            <div
                dir="rtl"
                className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[92vh] overflow-hidden border border-white/60"
            >
                {/* HEADER */}
                <div className="flex justify-between items-center gap-4 px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-200 sticky top-0 z-20 bg-white/95 backdrop-blur-xl shadow-sm">
                    <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
                            {isEditMode ? 'تحديث التوقيعات' : 'إيداع جديد'}
                        </h3>

                        {isEditMode && formData.transaction_no && (
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                رقم المعاملة:{' '}
                                <span className="font-bold text-[#a47d52] bg-[#a47d52]/10 px-2 py-0.5 rounded-md">
                                    {formData.transaction_no}
                                </span>
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        className="cursor-pointer shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 text-2xl font-light focus:outline-none focus:ring-2 focus:ring-[#a47d52]/30"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="p-4 sm:p-6 md:p-7 space-y-5 sm:space-y-6 bg-slate-50/70 overflow-y-auto max-h-[calc(95vh-76px)] sm:max-h-[calc(92vh-80px)]"
                >
                    {/* EDIT INFORMATION */}
                    {isEditMode && (
                        <div className="bg-white border border-[#a47d52]/20 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                            {formData.created_at && (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm bg-slate-50 rounded-xl px-3 py-2.5">
                                    <span className="text-gray-600">
                                        تاريخ الاجراء:
                                    </span>
                                    <span className="font-medium text-gray-700">
                                        {formatDate(formData.created_at)}
                                    </span>
                                </div>
                            )}

                            {formData.updated_at &&
                                formData.updated_at !==
                                    formData.created_at && (
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm bg-slate-50 rounded-xl px-3 py-2.5">
                                        <span className="text-gray-600">
                                            آخر تحديث:
                                        </span>
                                        <span className="font-medium text-gray-700">
                                            {formatDate(formData.updated_at)}
                                        </span>
                                    </div>
                                )}

                            <div className="pt-4 border-t border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">من حساب:</span>
                                        <span className="font-medium text-[#a47d52]">
                                            {getAccountName(formData.account_from) ||
                                                formData.account_from ||
                                                '-'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">الى حساب:</span>
                                        <span className="font-medium text-[#a47d52]">
                                            {formData.account_to || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">المبلغ قبل الضريبة:</span>
                                        <span className="font-medium text-[#a47d52]">
                                            {formData.subtotal
                                                ? parseFloat(formData.subtotal).toFixed(2)
                                                : '-'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">الضريبة:</span>
                                        <span className="font-medium text-[#a47d52]">
                                            {formData.vat
                                                ? parseFloat(formData.vat).toFixed(2)
                                                : '0.00'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">الإجمالي:</span>
                                        <span className="font-medium text-[#a47d52]">
                                            {formData.amount
                                                ? parseFloat(formData.amount).toFixed(2)
                                                : '-'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">العملة:</span>
                                        <span className="font-medium text-[#a47d52]">
                                            {formData.currency || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200">
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">
                                            طريقة الدفع:
                                        </span>
                                        <span className="font-medium text-[#a47d52]">
                                            {paymentMethod === 'banks'
                                                ? 'بنوك'
                                                : paymentMethod === 'cash'
                                                ? 'نقدي'
                                                : formData.payment_method ||
                                                  '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {getAmountInWords() && (
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">المبلغ كتابةً:</span>
                                        <span className="font-medium text-[#a47d52]">
                                            {getAmountInWords()}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            فقط لا غير
                                        </span>
                                    </div>
                                </div>
                            )}

                            {formData.statement && (
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">البيان:</span>
                                        <span className="font-medium text-[#a47d52]">
                                            {formData.statement}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {formData.person_deliver && (
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">
                                            الشخص المسلم:
                                        </span>
                                        <span className="font-medium text-[#a47d52]">
                                            {formData.person_deliver}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {formData.has_check && (
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="flex gap-2 items-center text-sm">
                                            <span className="text-gray-600">رقم الشيك:</span>
                                            <span className="font-medium text-[#a47d52]">
                                                {formData.check_no || '-'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 items-center text-sm">
                                            <span className="text-gray-600">بنك الشيك:</span>
                                            <span className="font-medium text-[#a47d52]">
                                                {formData.check_bank || '-'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 items-center text-sm">
                                            <span className="text-gray-600">تاريخ الشيك:</span>
                                            <span className="font-medium text-[#a47d52]">
                                                {formData.check_date || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.has_document && (
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex gap-2 items-center text-sm">
                                            <span className="text-gray-600">رقم المستند:</span>
                                            <span className="font-medium text-[#a47d52]">
                                                {formData.document_no || '-'}
                                            </span>
                                        </div>
                                        {formData.document && (
                                            <div className="flex gap-2 items-center text-sm">
                                                <span className="text-gray-600">
                                                    المستند:
                                                </span>
                                                <span className="font-medium text-[#a47d52]">
                                                    {typeof formData.document === 'string'
                                                        ? formData.document
                                                        : formData.document?.name ||
                                                          'مرفق'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {formData.notes && (
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex gap-2 items-center text-sm">
                                        <span className="text-gray-600">ملاحظات:</span>
                                        <span className="font-medium text-[#a47d52]">
                                            {formData.notes}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <SignaturesSection />
                        </div>
                    )}

                    {/* ADD MODE FIELDS */}
                    {!isEditMode && (
                        <>
                            {/* ROW 1: DATE + TRANSACTION NO + CURRENCY */}
                            <div className="flex flex-col md:flex-row md:items-end gap-4">
                                {/* DATE */}
                                <div className="flex-1 space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        التاريخ
                                    </label>
                                    <input
                                        ref={transactionDateRef}
                                        type="date"
                                        name="transaction_date"
                                        value={formData.transaction_date}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(e, transactionNoRef)
                                        }
                                        className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor:
                                                formData.transaction_date
                                                    ? '#a47d52'
                                                    : '#ef4444',
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            boxShadow: formData.transaction_date
                                                ? '0 0 0 3px rgba(164, 125, 82, 0.12)'
                                                : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                                        }}
                                        disabled={loading}
                                        autoFocus
                                    />
                                    {errors.transaction_date && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.transaction_date}
                                        </p>
                                    )}
                                </div>

                                {/* TRANSACTION NUMBER — REQUIRED */}
                                <div className="flex-1 space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        رقم المعاملة <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        ref={transactionNoRef}
                                        type="text"
                                        name="transaction_no"
                                        value={formData.transaction_no}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(e, currencyRef)
                                        }
                                        className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor:
                                                getFieldBorderColor(
                                                    isTransactionNoFilled,
                                                    errors.transaction_no
                                                ),
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            boxShadow: getFieldShadow(
                                                isTransactionNoFilled,
                                                errors.transaction_no
                                            )
                                        }}
                                        placeholder="أدخل رقم المعاملة..."
                                        disabled={loading}
                                    />
                                    {errors.transaction_no && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.transaction_no}
                                        </p>
                                    )}
                                </div>

                                {/* CURRENCY */}
                                <div className="flex-1 space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        العملة
                                    </label>
                                    <select
                                        ref={currencyRef}
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(e, accountFromRef)
                                        }
                                        className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor: formData.currency
                                                ? '#a47d52'
                                                : '#ef4444',
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            boxShadow: formData.currency
                                                ? '0 0 0 3px rgba(164, 125, 82, 0.12)'
                                                : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                                        }}
                                        disabled={loading}
                                    >
                                        {currencyOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label} ({option.value})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.currency && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.currency}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* PAYMENT METHOD */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    طريقة الدفع
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <button
                                        type="button"
                                        aria-pressed={paymentMethod === 'banks'}
                                        onClick={() =>
                                            handlePaymentMethodChange('banks')
                                        }
                                        disabled={loading}
                                        className={`group relative w-full min-h-[72px] px-4 py-3 sm:px-5 rounded-xl cursor-pointer border-2 transition-all duration-200 flex items-center justify-center gap-3 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a47d52]/40 ${
                                            paymentMethod === 'banks'
                                                ? 'border-[#a47d52] bg-[#a47d52]/5 shadow-md ring-1 ring-[#a47d52]/10'
                                                : 'border-gray-200 bg-[#f8f7f5] hover:border-[#a47d52]/60 hover:bg-white hover:shadow-md active:scale-[0.99]'
                                        } ${
                                            loading
                                                ? 'opacity-60 cursor-not-allowed'
                                                : ''
                                        }`}
                                    >
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                                                paymentMethod === 'banks'
                                                    ? 'bg-[#a47d52]/10'
                                                    : 'bg-gray-100 group-hover:bg-[#a47d52]/10'
                                            }`}
                                        >
                                            <FaUniversity
                                                className={`text-lg sm:text-xl transition-colors ${
                                                    paymentMethod === 'banks'
                                                        ? 'text-[#a47d52]'
                                                        : 'text-gray-400 group-hover:text-[#a47d52]'
                                                }`}
                                            />
                                        </span>
                                        <span
                                            className={`font-semibold text-sm sm:text-base ${
                                                paymentMethod === 'banks'
                                                    ? 'text-[#a47d52]'
                                                    : 'text-gray-700'
                                            }`}
                                        >
                                            بنوك
                                        </span>
                                        {paymentMethod === 'banks' && (
                                            <span className="mr-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#a47d52] text-white shadow-sm">
                                                <FaCheck className="text-xs" />
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        aria-pressed={paymentMethod === 'cash'}
                                        onClick={() =>
                                            handlePaymentMethodChange('cash')
                                        }
                                        disabled={loading}
                                        className={`group relative w-full min-h-[72px] px-4 py-3 sm:px-5 rounded-xl cursor-pointer border-2 transition-all duration-200 flex items-center justify-center gap-3 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a47d52]/40 ${
                                            paymentMethod === 'cash'
                                                ? 'border-[#a47d52] bg-[#a47d52]/5 shadow-md ring-1 ring-[#a47d52]/10'
                                                : 'border-gray-200 bg-[#f8f7f5] hover:border-[#a47d52]/60 hover:bg-white hover:shadow-md active:scale-[0.99]'
                                        } ${
                                            loading
                                                ? 'opacity-60 cursor-not-allowed'
                                                : ''
                                        }`}
                                    >
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                                                paymentMethod === 'cash'
                                                    ? 'bg-[#a47d52]/10'
                                                    : 'bg-gray-100 group-hover:bg-[#a47d52]/10'
                                            }`}
                                        >
                                            <FaMoneyBillWave
                                                className={`text-lg sm:text-xl transition-colors ${
                                                    paymentMethod === 'cash'
                                                        ? 'text-[#a47d52]'
                                                        : 'text-gray-400 group-hover:text-[#a47d52]'
                                                }`}
                                            />
                                        </span>
                                        <span
                                            className={`font-semibold text-sm sm:text-base ${
                                                paymentMethod === 'cash'
                                                    ? 'text-[#a47d52]'
                                                    : 'text-gray-700'
                                            }`}
                                        >
                                            نقدي
                                        </span>
                                        {paymentMethod === 'cash' && (
                                            <span className="mr-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#a47d52] text-white shadow-sm">
                                                <FaCheck className="text-xs" />
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {errors.payment_method && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.payment_method}
                                    </p>
                                )}
                            </div>

                            {/* ACCOUNT + BANK/CASHBOX */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        من حساب
                                    </label>
                                    <select
                                        ref={accountFromRef}
                                        name="account_from"
                                        value={formData.account_from}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(e, subtotalRef)
                                        }
                                        className="w-full cursor-pointer px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor: getFieldBorderColor(
                                                isAccountFromFilled,
                                                errors.account_from
                                            ),
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            boxShadow: getFieldShadow(
                                                isAccountFromFilled,
                                                errors.account_from
                                            )
                                        }}
                                        disabled={loading}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts.map((account) => (
                                            <option
                                                key={account.id}
                                                value={account.id}
                                            >
                                                {account.name}{' '}
                                                {account.category_name
                                                    ? `- ${account.category_name}`
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.account_from && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.account_from}
                                        </p>
                                    )}
                                </div>

                                {paymentMethod === 'banks' ? (
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700">
                                            البنك
                                        </label>
                                        <select
                                            name="bank"
                                            value={formData.bank || ''}
                                            onChange={handleChange}
                                            className="w-full cursor-pointer px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
                                            style={{
                                                borderTopColor: 'transparent',
                                                borderBottomColor: 'white',
                                                borderLeftColor: 'transparent',
                                                borderRightColor: getFieldBorderColor(
                                                    !!formData.bank,
                                                    errors.bank
                                                ),
                                                borderWidth: '2px',
                                                borderStyle: 'solid',
                                                boxShadow: getFieldShadow(
                                                    !!formData.bank,
                                                    errors.bank
                                                )
                                            }}
                                            disabled={loading}
                                        >
                                            <option value="">اختر البنك...</option>
                                            {banks.map((bank) => (
                                                <option
                                                    key={bank.id}
                                                    value={bank.id}
                                                >
                                                    {bank.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.bank && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.bank}
                                            </p>
                                        )}
                                    </div>
                                ) : paymentMethod === 'cash' ? (
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700">
                                            الخزينة النقدية
                                        </label>
                                        <select
                                            name="cashbox"
                                            value={formData.cashbox || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
                                            style={{
                                                borderTopColor: 'transparent',
                                                borderBottomColor: 'white',
                                                borderLeftColor: 'transparent',
                                                borderRightColor: getFieldBorderColor(
                                                    !!formData.cashbox,
                                                    errors.cashbox
                                                ),
                                                borderWidth: '2px',
                                                borderStyle: 'solid',
                                                boxShadow: getFieldShadow(
                                                    !!formData.cashbox,
                                                    errors.cashbox
                                                )
                                            }}
                                            disabled={loading}
                                        >
                                            <option value="">اختر الخزينة...</option>
                                            {cashboxes.map((cashbox) => (
                                                <option
                                                    key={cashbox.id}
                                                    value={cashbox.id}
                                                >
                                                    {cashbox.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.cashbox && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.cashbox}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700">
                                            الى حساب - البنك / الخزينة
                                        </label>
                                        <div className="w-full px-4 py-3 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-slate-500 text-right">
                                            اختر طريقة الدفع أولاً
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SUBTOTAL / VAT / AMOUNT GROUP */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        المبلغ قبل الضريبة{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        ref={subtotalRef}
                                        type="text"
                                        name="subtotal"
                                        value={formData.subtotal}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(e, vatRef)
                                        }
                                        className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor:
                                                getFieldBorderColor(
                                                    isSubtotalFilled,
                                                    errors.subtotal
                                                ),
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            boxShadow: getFieldShadow(
                                                isSubtotalFilled,
                                                errors.subtotal
                                            )
                                        }}
                                        placeholder="أدخل المبلغ..."
                                        step="0.01"
                                        min="0.01"
                                        disabled={loading}
                                    />
                                    {errors.subtotal && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.subtotal}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        الضريبة (VAT)
                                    </label>
                                    <input
                                        ref={vatRef}
                                        type="text"
                                        name="vat"
                                        value={formData.vat}
                                        onChange={handleChange}
                                        onKeyDown={(e) =>
                                            handleKeyDown(e, statementRef)
                                        }
                                        className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor:
                                                formData.vat !== ''
                                                    ? '#a47d52'
                                                    : '#ef4444',
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            boxShadow:
                                                formData.vat !== ''
                                                    ? '0 0 0 3px rgba(164, 125, 82, 0.12)'
                                                    : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                                        }}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        الإجمالي (محسوب تلقائياً)
                                    </label>
                                    <input
                                        ref={amountRef}
                                        type="text"
                                        name="amount"
                                        value={formData.amount}
                                        readOnly
                                        disabled
                                        className="w-full px-4 py-3 bg-slate-100 rounded-xl shadow-sm text-right cursor-not-allowed text-[#a47d52] font-bold"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'white',
                                            borderLeftColor: 'transparent',
                                            borderRightColor: '#a47d52',
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            boxShadow:
                                                '0 0 0 3px rgba(164, 125, 82, 0.12)'
                                        }}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* AMOUNT IN WORDS */}
                            {getAmountInWords() && (
                                <div className="p-3 sm:p-4 bg-[#a47d52]/5 border border-[#a47d52]/20 rounded-xl text-right">
                                    <span className="text-sm font-medium text-gray-700">
                                        المبلغ كتابةً:{' '}
                                    </span>
                                    <span className="text-sm font-bold text-[#a47d52]">
                                        {getAmountInWords()}
                                    </span>
                                    <span> </span>
                                    <span>فقط لا غير</span>
                                </div>
                            )}

                            {/* STATEMENT — REQUIRED */}
                            <div className="w-full space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">
                                    البيان <span className="text-red-500">*</span>
                                </label>
                                <input
                                    ref={statementRef}
                                    type="text"
                                    name="statement"
                                    value={formData.statement}
                                    onChange={handleChange}
                                    onKeyDown={(e) =>
                                        handleKeyDown(e, personDeliverRef)
                                    }
                                    className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
                                    style={{
                                        borderTopColor: 'transparent',
                                        borderBottomColor: 'white',
                                        borderLeftColor: 'transparent',
                                        borderRightColor:
                                            getFieldBorderColor(
                                                isStatementFilled,
                                                errors.statement
                                            ),
                                        borderWidth: '2px',
                                        borderStyle: 'solid',
                                        boxShadow: getFieldShadow(
                                            isStatementFilled,
                                            errors.statement
                                        )
                                    }}
                                    placeholder="وصف المعاملة..."
                                    disabled={loading}
                                />
                                {errors.statement && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.statement}
                                    </p>
                                )}
                            </div>

                            {/* PERSON DELIVER */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">
                                    الشخص المسلم
                                </label>
                                <input
                                    ref={personDeliverRef}
                                    type="text"
                                    name="person_deliver"
                                    value={formData.person_deliver}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
                                    style={{
                                        borderTopColor: 'transparent',
                                        borderBottomColor: 'white',
                                        borderLeftColor: 'transparent',
                                        borderRightColor: getFieldBorderColor(
                                            isPersonDeliverFilled,
                                            errors.person_deliver
                                        ),
                                        borderWidth: '2px',
                                        borderStyle: 'solid',
                                        boxShadow: getFieldShadow(
                                            isPersonDeliverFilled,
                                            errors.person_deliver
                                        )
                                    }}
                                    placeholder="اسم الشخص المسلم..."
                                    disabled={loading}
                                />
                            </div>

                            {/* CHECK */}
                            <div className="space-y-3 pt-5 border-t border-slate-200">
                                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                                    <input
                                        type="checkbox"
                                        name="has_check"
                                        checked={formData.has_check}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded-md border-slate-300 text-[#a47d52] focus:ring-[#a47d52]/30 cursor-pointer"
                                    />
                                    <label className="text-sm font-semibold text-gray-700">
                                        يوجد شيك ؟
                                    </label>
                                </div>

                                {formData.has_check && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-6 border-r-2 border-[#a47d52]/30 pl-2">
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-600">
                                                رقم الشيك
                                            </label>
                                            <input
                                                ref={checkNoRef}
                                                type="text"
                                                name="check_no"
                                                value={formData.check_no}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right"
                                                placeholder="رقم الشيك..."
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-600">
                                                بنك الشيك
                                            </label>
                                            <select
                                                name="check_bank"
                                                value={formData.check_bank}
                                                onChange={handleChange}
                                                className="w-full cursor-pointer px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right"
                                                disabled={loading}
                                            >
                                                <option value="">اختر البنك...</option>
                                                {banks.map((bank) => (
                                                    <option
                                                        key={bank.id}
                                                        value={bank.id}
                                                    >
                                                        {bank.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-600">
                                                تاريخ الشيك
                                            </label>
                                            <input
                                                ref={checkDateRef}
                                                type="date"
                                                name="check_date"
                                                value={formData.check_date}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* DOCUMENT */}
                            <div className="space-y-3 pt-5 border-t border-slate-200">
                                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                                    <input
                                        type="checkbox"
                                        name="has_document"
                                        checked={formData.has_document}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded-md border-slate-300 text-[#a47d52] focus:ring-[#a47d52]/30 cursor-pointer"
                                    />
                                    <label className="text-sm font-semibold text-gray-700">
                                        يوجد مستند ؟
                                    </label>
                                </div>

                                {formData.has_document && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6 border-r-2 border-[#a47d52]/30 pl-2">
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-600">
                                                رقم المستند
                                            </label>
                                            <input
                                                ref={documentNoRef}
                                                type="text"
                                                name="document_no"
                                                value={formData.document_no}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right"
                                                placeholder="رقم المستند..."
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-600">
                                                تحميل المستند
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    name="document"
                                                    onChange={handleChange}
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    disabled={loading}
                                                />
                                                <div className="w-full px-4 py-3 bg-white rounded-xl shadow-sm flex items-center justify-between text-right hover:border-[#a47d52]/60 transition-all duration-200 border-2 border-dashed border-[#a47d52]/30">
                                                    <span
                                                        className={`text-sm ${
                                                            formData.document
                                                                ? 'text-[#a47d52]'
                                                                : 'text-red-400'
                                                        }`}
                                                    >
                                                        {formData.document
                                                            ? formData.document.name
                                                            : 'اختر ملف...'}
                                                    </span>
                                                    <FaUpload
                                                        className={
                                                            formData.document
                                                                ? 'text-[#a47d52]'
                                                                : 'text-red-400'
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* NOTES */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">
                                    ملاحظات
                                </label>
                                <textarea
                                    ref={notesRef}
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right resize-none"
                                    placeholder="ملاحظات إضافية..."
                                    disabled={loading}
                                />
                            </div>

                            {/* SIGNATURES */}
                            <SignaturesSection />
                        </>
                    )}

                    {/* BUTTONS */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 border-t border-slate-200 sticky bottom-0 bg-slate-50/95 backdrop-blur-sm">
                        {isEditMode ? (
                            <button
                                type="submit"
                                disabled={loading}
                                className={`cursor-pointer flex-1 min-h-12 bg-[#a47d52] text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-[#a47d52]/20 transition-all duration-200 hover:bg-[#8a6a44] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${
                                    loading
                                        ? 'opacity-70 cursor-not-allowed'
                                        : ''
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                        جاري الحفظ...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaSave />
                                        التالي
                                    </span>
                                )}
                            </button>
                        ) : (
                            <>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`cursor-pointer flex-1 min-h-12 bg-[#a47d52] text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-[#a47d52]/20 transition-all duration-200 hover:bg-[#8a6a44] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${
                                        loading
                                            ? 'opacity-70 cursor-not-allowed'
                                            : ''
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                            جاري الحفظ...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <FaSave />
                                            حفظ
                                        </span>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="cursor-pointer w-full sm:w-auto min-h-12 px-6 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-100 hover:border-slate-400 transition-all duration-200"
                                    disabled={loading}
                                >
                                    إلغاء
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDeposit;


// import React, { useState, useEffect, useRef } from 'react';
// import { toast } from 'react-toastify';
// import {
//     FaSave,
//     FaUniversity,
//     FaMoneyBillWave,
//     FaCheck,
//     FaUpload,
//     FaSignature,
//     FaEraser
// } from 'react-icons/fa';
// import SignatureCanvas from 'react-signature-canvas';
// import { formatAmountInWords } from '../../../utils/numberToArabic';

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// const AddDeposit = ({
//     onClose,
//     transactionData,
//     onSuccess,
//     initialData,
//     isEditMode: initialEditMode
// }) => {

//     // =========================================================
//     // EDIT MODE
//     // =========================================================
//     const [isEditMode, setIsEditMode] = useState(
//         initialEditMode || false
//     );

//     const [transactionId, setTransactionId] = useState(
//         initialData?.id || null
//     );

//     // =========================================================
//     // GENERAL STATE
//     // =========================================================
//     const [loading, setLoading] = useState(false);
//     const [accounts, setAccounts] = useState([]);
//     const [banks, setBanks] = useState([]);
//     const [cashboxes, setCashboxes] = useState([]);
//     const [paymentMethod, setPaymentMethod] = useState(null);
//     const [errors, setErrors] = useState({});
//     const [isDataLoaded, setIsDataLoaded] = useState(false);

//     // =========================================================
//     // REFS
//     // =========================================================
//     const accountFromRef = useRef(null);
//     const subtotalRef = useRef(null);
//     const vatRef = useRef(null);
//     const amountRef = useRef(null);
//     const statementRef = useRef(null);
//     const personDeliverRef = useRef(null);
//     const personReceiptRef = useRef(null);
//     const notesRef = useRef(null);
//     const documentNoRef = useRef(null);
//     const checkNoRef = useRef(null);
//     const checkBankRef = useRef(null);
//     const checkDateRef = useRef(null);
//     const currencyRef = useRef(null);
//     const transactionNoRef = useRef(null);
//     const transactionDateRef = useRef(null);

//     // 👇 Signature canvas refs
//     const userSignatureRef = useRef(null);
//     const managerSignatureRef = useRef(null);
//     const secondPersonSignatureRef = useRef(null);

//     // =========================================================
//     // DEFAULT FORM DATA
//     // =========================================================
//     const defaultFormData = {
//         transaction_date: new Date().toISOString().split('T')[0],
//         type: 'deposit',
//         subtotal: '',
//         vat: '0.00',
//         amount: '0.00',
//         payment_method: '',
//         account_from: '',
//         account_to: '',
//         bank: '',
//         cashbox: '',
//         statement: '',
//         has_check: false,
//         check_no: '',
//         check_bank: '',
//         check_date: '',
//         person_deliver: '',
//         person_receipt: '',
//         notes: '',
//         has_document: false,
//         document: null,
//         document_no: '-',
//         currency: 'AED',
//         amount_to_arabic: '',
//         amount_to_english: '',
//         transaction_no: '',
//         transaction_user: null,
//         user_signature: '',
//         manager_signature: '',
//         second_person_signature: '',
//         created_at: '',
//         updated_at: ''
//     };

//     const [formData, setFormData] = useState(defaultFormData);

//     // =========================================================
//     // CURRENCY OPTIONS
//     // =========================================================
//     const currencyOptions = [
//         { value: 'AED', label: 'درهم اماراتي' },
//         { value: 'USD', label: 'دولار أمريكي' },
//         { value: 'EUR', label: 'يورو' },
//         { value: 'SAR', label: 'ريال سعودي' }
//     ];

//     // =========================================================
//     // FIELD STATUS
//     // =========================================================
//     const isAccountFromFilled =
//         formData.account_from && formData.account_from !== '';

//     const isSubtotalFilled =
//         formData.subtotal &&
//         parseFloat(formData.subtotal) > 0;

//     const isAmountFilled =
//         formData.amount &&
//         parseFloat(formData.amount) > 0;

//     const isStatementFilled =
//         formData.statement &&
//         formData.statement.trim() !== '';

//     const isPersonDeliverFilled =
//         formData.person_deliver &&
//         formData.person_deliver.trim() !== '';

//     const isTransactionNoFilled =
//         formData.transaction_no &&
//         formData.transaction_no.trim() !== '';

//     // =========================================================
//     // AMOUNT IN WORDS
//     // =========================================================
//     const getAmountInWords = () => {
//         if (
//             !formData.amount ||
//             parseFloat(formData.amount) <= 0
//         ) {
//             return '';
//         }

//         return formatAmountInWords(formData.amount);
//     };

//     // =========================================================
//     // FIELD STYLING
//     // =========================================================
//     const getFieldBorderColor = (isFilled, error) => {
//         if (error) return '#ef4444';
//         if (isFilled) return '#a47d52';
//         return '#ef4444';
//     };

//     const getFieldShadow = (isFilled, error) => {
//         if (error) {
//             return '0 0 0 3px rgba(239, 68, 68, 0.15)';
//         }

//         if (isFilled) {
//             return '0 0 0 3px rgba(164, 125, 82, 0.12)';
//         }

//         return '0 0 0 3px rgba(239, 68, 68, 0.08)';
//     };

//     // =========================================================
//     // FETCH ACCOUNTS
//     // =========================================================
//     const fetchAccounts = async () => {
//         try {
//             const token = localStorage.getItem('access_token');
//             if (!token) return [];

//             const response = await fetch(
//                 `${BASE}/api/accounts/`,
//                 {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         Authorization: `Bearer ${token}`
//                     }
//                 }
//             );

//             if (!response.ok) {
//                 console.error('Failed to fetch accounts:', response.status);
//                 return [];
//             }

//             const data = await response.json();
//             const accountsData = data.results || data || [];
//             setAccounts(accountsData);
//             return accountsData;
//         } catch (error) {
//             console.error('Error fetching accounts:', error);
//             return [];
//         }
//     };

//     // =========================================================
//     // FETCH BANKS
//     // =========================================================
//     const fetchBanks = async () => {
//         try {
//             const token = localStorage.getItem('access_token');
//             if (!token) return [];

//             const response = await fetch(
//                 `${BASE}/api/banks/`,
//                 {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         Authorization: `Bearer ${token}`
//                     }
//                 }
//             );

//             if (!response.ok) {
//                 console.error('Failed to fetch banks:', response.status);
//                 return [];
//             }

//             const data = await response.json();
//             const banksData = data.results || data || [];
//             setBanks(banksData);
//             return banksData;
//         } catch (error) {
//             console.error('Error fetching banks:', error);
//             return [];
//         }
//     };

//     // =========================================================
//     // FETCH CASHBOXES
//     // =========================================================
//     const fetchCashboxes = async () => {
//         try {
//             const token = localStorage.getItem('access_token');
//             if (!token) return [];

//             const response = await fetch(
//                 `${BASE}/api/cashboxes/`,
//                 {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         Authorization: `Bearer ${token}`
//                     }
//                 }
//             );

//             if (!response.ok) {
//                 console.error('Failed to fetch cashboxes:', response.status);
//                 return [];
//             }

//             const data = await response.json();
//             const cashboxesData = data.results || data || [];
//             setCashboxes(cashboxesData);
//             return cashboxesData;
//         } catch (error) {
//             console.error('Error fetching cashboxes:', error);
//             return [];
//         }
//     };

//     // =========================================================
//     // FIND ACCOUNT ID
//     // =========================================================
//     const findAccountIdByName = (accountName, accountsList) => {
//         if (!accountName || !accountsList || accountsList.length === 0) {
//             return '';
//         }

//         if (!isNaN(accountName) && accountName !== '') {
//             return accountName;
//         }

//         let found = accountsList.find(
//             (account) =>
//                 account.name === accountName ||
//                 account.name?.trim() === accountName?.trim()
//         );

//         if (!found) {
//             found = accountsList.find(
//                 (account) =>
//                     account.name?.toLowerCase().trim() ===
//                     accountName?.toLowerCase().trim()
//             );
//         }

//         if (!found) {
//             console.warn('No matching account found for name:', accountName);
//             return '';
//         }

//         return found.id;
//     };

//     // =========================================================
//     // PAYMENT METHOD
//     // =========================================================
//     const handlePaymentMethodChange = (method) => {
//         if (method !== 'banks' && method !== 'cash') {
//             return;
//         }

//         setPaymentMethod(method);

//         setFormData((prev) => ({
//             ...prev,
//             payment_method: method,
//             ...(method === 'banks' ? { cashbox: '' } : { bank: '' })
//         }));

//         setErrors((prev) => ({
//             ...prev,
//             payment_method: '',
//             ...(method === 'banks' ? { cashbox: '' } : { bank: '' })
//         }));
//     };

//     // =========================================================
//     // ONLY DEPEND ON ID.
//     // =========================================================
//     const initialDataId = initialData?.id ?? null;

//     // =========================================================
//     // LOAD EXISTING SIGNATURE INTO CANVAS
//     // =========================================================
//     const loadSignatureIntoCanvas = (canvasRef, dataUrl) => {
//         if (!canvasRef?.current || !dataUrl) return;

//         try {
//             const canvas = canvasRef.current.getCanvas();
//             const ctx = canvas.getContext('2d');
//             const img = new Image();
//             img.onload = () => {
//                 const ratio = Math.min(
//                     canvas.width / img.width,
//                     canvas.height / img.height
//                 );
//                 const newWidth = img.width * ratio;
//                 const newHeight = img.height * ratio;
//                 const x = (canvas.width - newWidth) / 2;
//                 const y = (canvas.height - newHeight) / 2;
//                 ctx.drawImage(img, x, y, newWidth, newHeight);
//             };
//             img.src = dataUrl;
//         } catch (err) {
//             console.warn('Failed to load signature into canvas:', err);
//         }
//     };

//     // =========================================================
//     // INITIAL DATA / LOAD
//     // =========================================================
//     useEffect(() => {
//         let cancelled = false;

//         const hasInitialData =
//             initialData && Object.keys(initialData).length > 0;

//         // ADD MODE
//         if (!hasInitialData) {
//             setIsEditMode(false);
//             setTransactionId(null);
//             setFormData({ ...defaultFormData });
//             setPaymentMethod(null);
//             setErrors({});
//             setIsDataLoaded(false);
//         }

//         const loadDataAndPopulate = async () => {
//             const accountsData = await fetchAccounts();
//             await fetchBanks();
//             await fetchCashboxes();

//             if (cancelled) return;

//             // =================================================
//             // EDIT MODE
//             // =================================================
//             if (hasInitialData) {
//                 setIsEditMode(true);
//                 setTransactionId(initialData.id);

//                 const bankId =
//                     typeof initialData.bank === 'object'
//                         ? initialData.bank?.id || ''
//                         : initialData.bank || '';

//                 const cashboxId =
//                     typeof initialData.cashbox === 'object'
//                         ? initialData.cashbox?.id || ''
//                         : initialData.cashbox || '';

//                 let accountFromValue = initialData.account_from || '';
//                 let accountToValue = initialData.account_to || '';

//                 if (accountsData && accountsData.length > 0) {
//                     const foundAccountFromId = findAccountIdByName(
//                         accountFromValue,
//                         accountsData
//                     );

//                     if (foundAccountFromId) {
//                         accountFromValue = foundAccountFromId;
//                     }

//                     if (accountToValue && isNaN(accountToValue)) {
//                         const foundAccountToId = findAccountIdByName(
//                             accountToValue,
//                             accountsData
//                         );

//                         if (foundAccountToId) {
//                             accountToValue = foundAccountToId;
//                         }
//                     }
//                 }

//                 const loadedSubtotal =
//                     initialData.subtotal !== undefined &&
//                     initialData.subtotal !== null &&
//                     initialData.subtotal !== ''
//                         ? parseFloat(initialData.subtotal).toFixed(2)
//                         : (initialData.amount
//                               ? (
//                                     parseFloat(initialData.amount) -
//                                     parseFloat(initialData.vat || 0)
//                                 ).toFixed(2)
//                               : '');

//                 const loadedVat =
//                     initialData.vat !== undefined &&
//                     initialData.vat !== null &&
//                     initialData.vat !== ''
//                         ? parseFloat(initialData.vat).toFixed(2)
//                         : '0.00';

//                 const loadedAmount =
//                     initialData.amount !== undefined &&
//                     initialData.amount !== null &&
//                     initialData.amount !== ''
//                         ? parseFloat(initialData.amount).toFixed(2)
//                         : (
//                               (parseFloat(loadedSubtotal || 0) || 0) +
//                               (parseFloat(loadedVat || 0) || 0)
//                           ).toFixed(2);

//                 setFormData({
//                     ...defaultFormData,
//                     ...initialData,

//                     transaction_date:
//                         initialData.transaction_date ||
//                         new Date().toISOString().split('T')[0],

//                     subtotal: loadedSubtotal,
//                     vat: loadedVat,
//                     amount: loadedAmount,

//                     account_from: accountFromValue,
//                     account_to: accountToValue,
//                     bank: bankId,
//                     cashbox: cashboxId,

//                     statement: initialData.statement || '',
//                     has_check: initialData.has_check || false,
//                     check_no: initialData.check_no || '',
//                     check_bank: initialData.check_bank || '',
//                     check_date: initialData.check_date || '',
//                     person_deliver: initialData.person_deliver || '',
//                     person_receipt: initialData.person_receipt || '',
//                     notes: initialData.notes || '',
//                     has_document: !!initialData.document,
//                     document_no: initialData.document_no || '',
//                     currency: initialData.currency || 'AED',
//                     amount_to_arabic: initialData.amount_to_arabic || '',
//                     amount_to_english: initialData.amount_to_english || '',
//                     transaction_no: initialData.transaction_no || '',
//                     transaction_user: initialData.transaction_user || null,
//                     user_signature: initialData.user_signature || '',
//                     manager_signature: initialData.manager_signature || '',
//                     second_person_signature:
//                         initialData.second_person_signature || '',
//                     created_at: initialData.created_at || '',
//                     updated_at: initialData.updated_at || ''
//                 });

//                 if (initialData.payment_method === 'banks') {
//                     setPaymentMethod('banks');
//                 } else if (initialData.payment_method === 'cash') {
//                     setPaymentMethod('cash');
//                 } else if (bankId) {
//                     setPaymentMethod('banks');
//                 } else if (cashboxId) {
//                     setPaymentMethod('cash');
//                 } else {
//                     setPaymentMethod(null);
//                 }

//                 setTimeout(() => {
//                     if (initialData.user_signature) {
//                         loadSignatureIntoCanvas(
//                             userSignatureRef,
//                             initialData.user_signature
//                         );
//                     }
//                     if (initialData.manager_signature) {
//                         loadSignatureIntoCanvas(
//                             managerSignatureRef,
//                             initialData.manager_signature
//                         );
//                     }
//                     if (initialData.second_person_signature) {
//                         loadSignatureIntoCanvas(
//                             secondPersonSignatureRef,
//                             initialData.second_person_signature
//                         );
//                     }
//                 }, 200);
//             }

//             if (!cancelled) {
//                 setIsDataLoaded(true);
//             }
//         };

//         loadDataAndPopulate();

//         return () => {
//             cancelled = true;
//         };
//     }, [initialDataId]);

//     // =========================================================
//     // HANDLE INPUT
//     // =========================================================
//     const handleChange = (e) => {
//         const { name, value, type, checked, files } = e.target;

//         if (type === 'file') {
//             const file = files?.[0] || null;
//             setFormData((prev) => ({ ...prev, [name]: file }));

//             if (file) {
//                 setErrors((prev) => ({ ...prev, [name]: '' }));
//             }
//             return;
//         }

//         if (type === 'checkbox') {
//             setFormData((prev) => ({ ...prev, [name]: checked }));
//             return;
//         }

//         setFormData((prev) => {
//             const updated = { ...prev, [name]: value };

//             if (name === 'subtotal' || name === 'vat') {
//                 const sub = parseFloat(
//                     name === 'subtotal' ? value : updated.subtotal
//                 ) || 0;
//                 const v = parseFloat(
//                     name === 'vat' ? value : updated.vat
//                 ) || 0;
//                 const total = (sub + v).toFixed(2);

//                 updated.amount = total;

//                 if (parseFloat(total) > 0) {
//                     updated.amount_to_arabic =
//                         formatAmountInWords(parseFloat(total));
//                     updated.amount_to_english =
//                         formatAmountInWords(parseFloat(total));
//                 } else {
//                     updated.amount_to_arabic = '';
//                     updated.amount_to_english = '';
//                 }
//             }

//             return updated;
//         });

//         setErrors((prev) => ({ ...prev, [name]: '' }));
//     };

//     // =========================================================
//     // ENTER NAVIGATION
//     // =========================================================
//     const handleKeyDown = (e, nextRef) => {
//         if (e.key !== 'Enter') return;
//         e.preventDefault();
//         if (nextRef && nextRef.current) {
//             nextRef.current.focus();
//         }
//     };

//     // =========================================================
//     // SIGNATURE HELPERS
//     // =========================================================
//     const clearSignature = (canvasRef) => {
//         if (canvasRef?.current) {
//             canvasRef.current.clear();
//         }
//     };

//     const getSignatureData = (canvasRef) => {
//         if (!canvasRef?.current) return '';
//         try {
//             if (canvasRef.current.isEmpty()) return '';
//             return canvasRef.current.getCanvas().toDataURL('image/png');
//         } catch (err) {
//             console.error('Error getting signature data:', err);
//             return '';
//         }
//     };

//     // =========================================================
//     // FETCH TRANSACTION
//     // =========================================================
//     const fetchTransactionDetails = async (id) => {
//         try {
//             const token = localStorage.getItem('access_token');
//             if (!token || !id) return null;

//             const response = await fetch(
//                 `${BASE}/api/transactions/${id}/`,
//                 {
//                     headers: { Authorization: `Bearer ${token}` }
//                 }
//             );

//             if (!response.ok) return null;

//             const data = await response.json();

//             let accountFromId = data.account_from || '';
//             let accountToId = data.account_to || '';

//             if (accountFromId && isNaN(accountFromId) && accounts.length > 0) {
//                 const foundId = findAccountIdByName(
//                     accountFromId,
//                     accounts
//                 );
//                 if (foundId) accountFromId = foundId;
//             }

//             if (accountToId && isNaN(accountToId) && accounts.length > 0) {
//                 const foundId = findAccountIdByName(accountToId, accounts);
//                 if (foundId) accountToId = foundId;
//             }

//             const sub =
//                 data.subtotal !== undefined && data.subtotal !== null
//                     ? parseFloat(data.subtotal).toFixed(2)
//                     : (data.amount
//                           ? (
//                                 parseFloat(data.amount) -
//                                 parseFloat(data.vat || 0)
//                             ).toFixed(2)
//                           : '0.00');

//             const v =
//                 data.vat !== undefined && data.vat !== null
//                     ? parseFloat(data.vat).toFixed(2)
//                     : '0.00';

//             const total =
//                 data.amount !== undefined && data.amount !== null
//                     ? parseFloat(data.amount).toFixed(2)
//                     : (parseFloat(sub) + parseFloat(v)).toFixed(2);

//             setFormData((prev) => ({
//                 ...prev,
//                 ...data,
//                 subtotal: sub,
//                 vat: v,
//                 amount: total,
//                 account_from: accountFromId,
//                 account_to: accountToId,
//                 bank: data.bank?.id || data.bank || prev.bank,
//                 cashbox: data.cashbox?.id || data.cashbox || prev.cashbox,
//                 transaction_user:
//                     data.transaction_user || prev.transaction_user
//             }));

//             if (data.payment_method) {
//                 setPaymentMethod(data.payment_method);
//             } else if (data.bank) {
//                 setPaymentMethod('banks');
//             } else if (data.cashbox) {
//                 setPaymentMethod('cash');
//             }

//             return data;
//         } catch (error) {
//             console.error('Error fetching transaction:', error);
//             return null;
//         }
//     };

//     // =========================================================
//     // HANDLE SUBMIT
//     // =========================================================
//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         if (loading) return;

//         setLoading(true);
//         setErrors({});

//         try {
//             const token = localStorage.getItem('access_token');
//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول');
//                 return;
//             }

//             // =================================================
//             // VALIDATION — ONLY 3 REQUIRED FIELDS
//             // 1) Amount (subtotal)
//             // 2) Transaction No
//             // 3) Statement
//             // =================================================
//             const newErrors = {};

//             if (
//                 !formData.subtotal ||
//                 parseFloat(formData.subtotal) <= 0
//             ) {
//                 newErrors.subtotal = 'يرجى إدخال المبلغ';
//             }

//             if (
//                 !formData.transaction_no ||
//                 formData.transaction_no.trim() === ''
//             ) {
//                 newErrors.transaction_no = 'يرجى إدخال رقم المعاملة';
//             }

//             if (
//                 !formData.statement ||
//                 formData.statement.trim() === ''
//             ) {
//                 newErrors.statement = 'يرجى إدخال البيان';
//             }

//             if (Object.keys(newErrors).length > 0) {
//                 setErrors(newErrors);

//                 // Show a specific toast per missing field
//                 Object.values(newErrors).forEach((msg) => {
//                     toast.error(`❌ ${msg}`);
//                 });

//                 return;
//             }

//             // =================================================
//             // SIGNATURES
//             // =================================================
//             const userSignatureData =
//                 getSignatureData(userSignatureRef) ||
//                 formData.user_signature ||
//                 '';

//             const managerSignatureData =
//                 getSignatureData(managerSignatureRef) ||
//                 formData.manager_signature ||
//                 '';

//             const secondPersonSignatureData =
//                 getSignatureData(secondPersonSignatureRef) ||
//                 formData.second_person_signature ||
//                 '';

//             // =================================================
//             // PREPARE DATA
//             // =================================================
//             const computedSubtotal =
//                 parseFloat(formData.subtotal) || 0;
//             const computedVat = parseFloat(formData.vat) || 0;
//             const computedAmount = parseFloat(
//                 (computedSubtotal + computedVat).toFixed(2)
//             );

//             const submitData = {
//                 type: 'deposit',

//                 transaction_date:
//                     formData.transaction_date ||
//                     new Date().toISOString().split('T')[0],

//                 subtotal: computedSubtotal,
//                 vat: computedVat,
//                 amount: computedAmount,

//                 payment_method: paymentMethod,
//                 account_from: formData.account_from || '',
//                 account_to: '',
//                 statement: formData.statement,
//                 has_check: formData.has_check,
//                 currency: formData.currency || 'AED',
//                 person_deliver: formData.person_deliver || '',
//                 notes: formData.notes || '',
//                 user_signature: userSignatureData,
//                 manager_signature: managerSignatureData,
//                 second_person_signature: secondPersonSignatureData,
//                 transaction_no: formData.transaction_no || ''
//             };

//             if (paymentMethod === 'banks' && formData.bank) {
//                 submitData.bank = parseInt(formData.bank, 10);
//             }

//             if (paymentMethod === 'cash' && formData.cashbox) {
//                 submitData.cashbox = parseInt(formData.cashbox, 10);
//             }

//             if (formData.has_check) {
//                 submitData.check_no = formData.check_no || '';
//                 submitData.check_bank = formData.check_bank || '';
//                 submitData.check_date = formData.check_date || '';
//             }

//             let hasFileUpload = false;
//             let actualFile = null;

//             if (formData.has_document) {
//                 submitData.has_document = true;
//                 submitData.document_no = formData.document_no || '';

//                 if (
//                     formData.document instanceof File ||
//                     formData.document instanceof Blob
//                 ) {
//                     hasFileUpload = true;
//                     actualFile = formData.document;
//                 }
//             } else {
//                 submitData.has_document = false;
//             }

//             const url = isEditMode
//                 ? `${BASE}/api/transactions/${transactionId}/update/`
//                 : `${BASE}/api/transactions/create/`;

//             const method = isEditMode ? 'PUT' : 'POST';

//             let response;

//             if (hasFileUpload && actualFile) {
//                 const formDataObj = new FormData();

//                 Object.keys(submitData).forEach((key) => {
//                     const value = submitData[key];
//                     if (value !== undefined && value !== null) {
//                         formDataObj.append(key, value);
//                     }
//                 });

//                 formDataObj.append('document', actualFile);

//                 response = await fetch(url, {
//                     method,
//                     headers: {
//                         Authorization: `Bearer ${token}`
//                     },
//                     body: formDataObj
//                 });
//             } else {
//                 response = await fetch(url, {
//                     method,
//                     headers: {
//                         'Content-Type': 'application/json',
//                         Authorization: `Bearer ${token}`
//                     },
//                     body: JSON.stringify(submitData)
//                 });
//             }

//             if (!response.ok) {
//                 let errorData = null;
//                 try {
//                     errorData = await response.json();
//                 } catch {
//                     errorData = null;
//                 }

//                 console.error('Transaction error:', errorData);

//                 if (errorData) {
//                     const errorMessages = [];
//                     Object.keys(errorData).forEach((key) => {
//                         const value = errorData[key];
//                         if (Array.isArray(value)) {
//                             errorMessages.push(
//                                 `${key}: ${value.join(', ')}`
//                             );
//                         } else if (typeof value === 'string') {
//                             errorMessages.push(`${key}: ${value}`);
//                         }
//                     });

//                     throw new Error(
//                         errorMessages.join('\n') ||
//                             'فشل حفظ المعاملة، يرجى المحاولة مرة أخرى'
//                     );
//                 }

//                 throw new Error('فشل حفظ المعاملة، يرجى المحاولة مرة أخرى');
//             }

//             let result = null;
//             try {
//                 result = await response.json();
//             } catch {
//                 result = {};
//             }

//             console.log('Transaction saved:', result);

//             // =================================================
//             // SUCCESS — Close form and return to parent page
//             // =================================================
//             if (!isEditMode) {
//                 toast.success('✅ تم إضافة الإيداع بنجاح');
//             } else {
//                 toast.success('✅ تم تحديث الإيداع بنجاح');
//             }

//             onSuccess?.();
//             handleClose();

//         } catch (error) {
//             console.error('Error saving transaction:', error);
//             toast.error(
//                 '❌ ' +
//                     (error?.message ||
//                         'حدث خطأ أثناء حفظ المعاملة، يرجى المحاولة مرة أخرى')
//             );
//         } finally {
//             setLoading(false);
//         }
//     };

//     // =========================================================
//     // CLOSE COMPONENT
//     // =========================================================
//     const handleClose = () => {
//         if (loading) return;

//         setIsEditMode(false);
//         setTransactionId(null);
//         setFormData({ ...defaultFormData });
//         setPaymentMethod(null);
//         setErrors({});
//         setLoading(false);

//         onClose?.();
//     };

//     // =========================================================
//     // FORMAT DATE
//     // =========================================================
//     const formatDate = (dateString) => {
//         if (!dateString) return '';
//         const date = new Date(dateString);
//         return date.toLocaleDateString('ar-EG', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit'
//         });
//     };

//     // =========================================================
//     // USER DISPLAY NAME
//     // =========================================================
//     const getUserDisplayName = (user) => {
//         if (!user) return 'غير معروف';
//         if (typeof user === 'object') {
//             return user.username || user.name || user.id || 'غير معروف';
//         }
//         return user;
//     };

//     // =========================================================
//     // ACCOUNT NAME
//     // =========================================================
//     const getAccountName = (accountId) => {
//         if (!accountId) return '';
//         const account = accounts.find(
//             (acc) => acc.id === parseInt(accountId, 10)
//         );
//         return account ? account.name : accountId;
//     };

//     // =========================================================
//     // SIGNATURE CANVAS WRAPPER
//     // =========================================================
//     const SignatureField = ({
//         label,
//         canvasRef,
//         existingData,
//         placeholder
//     }) => (
//         <div className="space-y-1.5">
//             <div className="flex items-center justify-between">
//                 <label className="block text-xs font-semibold text-slate-600">
//                     {label}
//                 </label>
//                 <button
//                     type="button"
//                     onClick={() => clearSignature(canvasRef)}
//                     disabled={loading}
//                     className="cursor-pointer flex items-center gap-1 text-[11px] text-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
//                 >
//                     <FaEraser className="text-[10px]" />
//                     مسح
//                 </button>
//             </div>

//             <div
//                 className="relative bg-white rounded-xl border-2 border-dashed overflow-hidden"
//                 style={{
//                     borderColor: '#a47d52',
//                     boxShadow: '0 0 0 3px rgba(164, 125, 82, 0.08)'
//                 }}
//             >
//                 <SignatureCanvas
//                     ref={canvasRef}
//                     penColor="#1e293b"
//                     backgroundColor="rgba(255,255,255,0)"
//                     canvasProps={{
//                         className:
//                             'w-full h-24 sm:h-28 md:h-32 touch-none cursor-crosshair',
//                         style: { touchAction: 'none' }
//                     }}
//                 />
//                 {!existingData && (
//                     <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs text-slate-300 px-2 text-center">
//                         {placeholder}
//                     </span>
//                 )}
//             </div>
//         </div>
//     );

//     // =========================================================
//     // SIGNATURES SECTION (shared between add/edit)
//     // =========================================================
//     const SignaturesSection = () => (
//         <div className="pt-4 sm:pt-5 border-t-2 border-[#a47d52]/25">
//             <div className="flex items-center gap-2 mb-3 sm:mb-4">
//                 <FaSignature className="text-[#a47d52] text-sm" />
//                 <h4 className="text-sm font-bold text-slate-700">
//                     التوقيعات
//                 </h4>
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
//                 <SignatureField
//                     label="توقيع المحاسب"
//                     canvasRef={userSignatureRef}
//                     existingData={formData.user_signature}
//                     placeholder="وقّع هنا بالإصبع أو القلم ..."
//                 />

//                 <SignatureField
//                     label="توقيع المدير"
//                     canvasRef={managerSignatureRef}
//                     existingData={formData.manager_signature}
//                     placeholder="وقّع هنا بالإصبع أو القلم ..."
//                 />

//                 <SignatureField
//                     label="توقيع الشخص المسلم"
//                     canvasRef={secondPersonSignatureRef}
//                     existingData={formData.second_person_signature}
//                     placeholder="وقّع هنا بالإصبع أو القلم ..."
//                 />
//             </div>
//         </div>
//     );

//     // =========================================================
//     // RENDER
//     // =========================================================
//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-md p-2 sm:p-4">
//             <div
//                 dir="rtl"
//                 className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[92vh] overflow-hidden border border-white/60"
//             >
//                 {/* HEADER */}
//                 <div className="flex justify-between items-center gap-4 px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-200 sticky top-0 z-20 bg-white/95 backdrop-blur-xl shadow-sm">
//                     <div>
//                         <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
//                             {isEditMode ? 'تحديث التوقيعات' : 'إيداع جديد'}
//                         </h3>

//                         {isEditMode && formData.transaction_no && (
//                             <p className="text-xs sm:text-sm text-slate-500 mt-1">
//                                 رقم المعاملة:{' '}
//                                 <span className="font-bold text-[#a47d52] bg-[#a47d52]/10 px-2 py-0.5 rounded-md">
//                                     {formData.transaction_no}
//                                 </span>
//                             </p>
//                         )}
//                     </div>

//                     <button
//                         type="button"
//                         className="cursor-pointer shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 text-2xl font-light focus:outline-none focus:ring-2 focus:ring-[#a47d52]/30"
//                         onClick={handleClose}
//                         disabled={loading}
//                     >
//                         ✕
//                     </button>
//                 </div>

//                 {/* FORM */}
//                 <form
//                     onSubmit={handleSubmit}
//                     className="p-4 sm:p-6 md:p-7 space-y-5 sm:space-y-6 bg-slate-50/70 overflow-y-auto max-h-[calc(95vh-76px)] sm:max-h-[calc(92vh-80px)]"
//                 >
//                     {/* EDIT INFORMATION */}
//                     {isEditMode && (
//                         <div className="bg-white border border-[#a47d52]/20 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
//                             {formData.created_at && (
//                                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm bg-slate-50 rounded-xl px-3 py-2.5">
//                                     <span className="text-gray-600">
//                                         تاريخ الاجراء:
//                                     </span>
//                                     <span className="font-medium text-gray-700">
//                                         {formatDate(formData.created_at)}
//                                     </span>
//                                 </div>
//                             )}

//                             {formData.updated_at &&
//                                 formData.updated_at !==
//                                     formData.created_at && (
//                                     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm bg-slate-50 rounded-xl px-3 py-2.5">
//                                         <span className="text-gray-600">
//                                             آخر تحديث:
//                                         </span>
//                                         <span className="font-medium text-gray-700">
//                                             {formatDate(formData.updated_at)}
//                                         </span>
//                                     </div>
//                                 )}

//                             <div className="pt-4 border-t border-slate-200">
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">من حساب:</span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {getAccountName(formData.account_from) ||
//                                                 formData.account_from ||
//                                                 '-'}
//                                         </span>
//                                     </div>
//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">الى حساب:</span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {formData.account_to || '-'}
//                                         </span>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="pt-4 border-t border-slate-200">
//                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">المبلغ قبل الضريبة:</span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {formData.subtotal
//                                                 ? parseFloat(formData.subtotal).toFixed(2)
//                                                 : '-'}
//                                         </span>
//                                     </div>

//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">الضريبة:</span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {formData.vat
//                                                 ? parseFloat(formData.vat).toFixed(2)
//                                                 : '0.00'}
//                                         </span>
//                                     </div>

//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">الإجمالي:</span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {formData.amount
//                                                 ? parseFloat(formData.amount).toFixed(2)
//                                                 : '-'}
//                                         </span>
//                                     </div>

//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">العملة:</span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {formData.currency || '-'}
//                                         </span>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="pt-4 border-t border-slate-200">
//                                 <div className="grid grid-cols-1 gap-3">
//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">
//                                             طريقة الدفع:
//                                         </span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {paymentMethod === 'banks'
//                                                 ? 'بنوك'
//                                                 : paymentMethod === 'cash'
//                                                 ? 'نقدي'
//                                                 : formData.payment_method ||
//                                                   '-'}
//                                         </span>
//                                     </div>
//                                 </div>
//                             </div>

//                             {getAmountInWords() && (
//                                 <div className="pt-4 border-t border-slate-200">
//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">المبلغ كتابةً:</span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {getAmountInWords()}
//                                         </span>
//                                         <span className="text-sm text-gray-500">
//                                             فقط لا غير
//                                         </span>
//                                     </div>
//                                 </div>
//                             )}

//                             {formData.statement && (
//                                 <div className="pt-4 border-t border-slate-200">
//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">البيان:</span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {formData.statement}
//                                         </span>
//                                     </div>
//                                 </div>
//                             )}

//                             {formData.person_deliver && (
//                                 <div className="pt-4 border-t border-slate-200">
//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">
//                                             الشخص المسلم:
//                                         </span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {formData.person_deliver}
//                                         </span>
//                                     </div>
//                                 </div>
//                             )}

//                             {formData.has_check && (
//                                 <div className="pt-4 border-t border-slate-200">
//                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                                         <div className="flex gap-2 items-center text-sm">
//                                             <span className="text-gray-600">رقم الشيك:</span>
//                                             <span className="font-medium text-[#a47d52]">
//                                                 {formData.check_no || '-'}
//                                             </span>
//                                         </div>
//                                         <div className="flex gap-2 items-center text-sm">
//                                             <span className="text-gray-600">بنك الشيك:</span>
//                                             <span className="font-medium text-[#a47d52]">
//                                                 {formData.check_bank || '-'}
//                                             </span>
//                                         </div>
//                                         <div className="flex gap-2 items-center text-sm">
//                                             <span className="text-gray-600">تاريخ الشيك:</span>
//                                             <span className="font-medium text-[#a47d52]">
//                                                 {formData.check_date || '-'}
//                                             </span>
//                                         </div>
//                                     </div>
//                                 </div>
//                             )}

//                             {formData.has_document && (
//                                 <div className="pt-4 border-t border-slate-200">
//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                                         <div className="flex gap-2 items-center text-sm">
//                                             <span className="text-gray-600">رقم المستند:</span>
//                                             <span className="font-medium text-[#a47d52]">
//                                                 {formData.document_no || '-'}
//                                             </span>
//                                         </div>
//                                         {formData.document && (
//                                             <div className="flex gap-2 items-center text-sm">
//                                                 <span className="text-gray-600">
//                                                     المستند:
//                                                 </span>
//                                                 <span className="font-medium text-[#a47d52]">
//                                                     {typeof formData.document === 'string'
//                                                         ? formData.document
//                                                         : formData.document?.name ||
//                                                           'مرفق'}
//                                                 </span>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             )}

//                             {formData.notes && (
//                                 <div className="pt-4 border-t border-slate-200">
//                                     <div className="flex gap-2 items-center text-sm">
//                                         <span className="text-gray-600">ملاحظات:</span>
//                                         <span className="font-medium text-[#a47d52]">
//                                             {formData.notes}
//                                         </span>
//                                     </div>
//                                 </div>
//                             )}

//                             {/* SIGNATURES (EDIT MODE) */}
//                             <SignaturesSection />
//                         </div>
//                     )}

//                     {/* ADD MODE FIELDS */}
//                     {!isEditMode && (
//                         <>
//                             {/* ROW 1: DATE + TRANSACTION NO + CURRENCY */}
//                             <div className="flex flex-col md:flex-row md:items-end gap-4">
//                                 {/* DATE */}
//                                 <div className="flex-1 space-y-1.5">
//                                     <label className="block text-sm font-semibold text-slate-700">
//                                         التاريخ
//                                     </label>
//                                     <input
//                                         ref={transactionDateRef}
//                                         type="date"
//                                         name="transaction_date"
//                                         value={formData.transaction_date}
//                                         onChange={handleChange}
//                                         onKeyDown={(e) =>
//                                             handleKeyDown(e, transactionNoRef)
//                                         }
//                                         className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor:
//                                                 formData.transaction_date
//                                                     ? '#a47d52'
//                                                     : '#ef4444',
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                             boxShadow: formData.transaction_date
//                                                 ? '0 0 0 3px rgba(164, 125, 82, 0.12)'
//                                                 : '0 0 0 3px rgba(239, 68, 68, 0.08)'
//                                         }}
//                                         disabled={loading}
//                                         autoFocus
//                                     />
//                                     {errors.transaction_date && (
//                                         <p className="text-red-500 text-sm mt-1">
//                                             {errors.transaction_date}
//                                         </p>
//                                     )}
//                                 </div>

//                                 {/* TRANSACTION NUMBER — REQUIRED */}
//                                 <div className="flex-1 space-y-1.5">
//                                     <label className="block text-sm font-semibold text-slate-700">
//                                         رقم المعاملة <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         ref={transactionNoRef}
//                                         type="text"
//                                         name="transaction_no"
//                                         value={formData.transaction_no}
//                                         onChange={handleChange}
//                                         onKeyDown={(e) =>
//                                             handleKeyDown(e, currencyRef)
//                                         }
//                                         className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor:
//                                                 getFieldBorderColor(
//                                                     isTransactionNoFilled,
//                                                     errors.transaction_no
//                                                 ),
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                             boxShadow: getFieldShadow(
//                                                 isTransactionNoFilled,
//                                                 errors.transaction_no
//                                             )
//                                         }}
//                                         placeholder="أدخل رقم المعاملة..."
//                                         disabled={loading}
//                                     />
//                                     {errors.transaction_no && (
//                                         <p className="text-red-500 text-sm mt-1">
//                                             {errors.transaction_no}
//                                         </p>
//                                     )}
//                                 </div>

//                                 {/* CURRENCY */}
//                                 <div className="flex-1 space-y-1.5">
//                                     <label className="block text-sm font-semibold text-slate-700">
//                                         العملة
//                                     </label>
//                                     <select
//                                         ref={currencyRef}
//                                         name="currency"
//                                         value={formData.currency}
//                                         onChange={handleChange}
//                                         onKeyDown={(e) =>
//                                             handleKeyDown(e, accountFromRef)
//                                         }
//                                         className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor: formData.currency
//                                                 ? '#a47d52'
//                                                 : '#ef4444',
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                             boxShadow: formData.currency
//                                                 ? '0 0 0 3px rgba(164, 125, 82, 0.12)'
//                                                 : '0 0 0 3px rgba(239, 68, 68, 0.08)'
//                                         }}
//                                         disabled={loading}
//                                     >
//                                         {currencyOptions.map((option) => (
//                                             <option
//                                                 key={option.value}
//                                                 value={option.value}
//                                             >
//                                                 {option.label} ({option.value})
//                                             </option>
//                                         ))}
//                                     </select>
//                                     {errors.currency && (
//                                         <p className="text-red-500 text-sm mt-1">
//                                             {errors.currency}
//                                         </p>
//                                     )}
//                                 </div>
//                             </div>

//                             {/* PAYMENT METHOD */}
//                             <div className="space-y-2">
//                                 <label className="block text-sm font-semibold text-slate-700">
//                                     طريقة الدفع
//                                 </label>
//                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
//                                     <button
//                                         type="button"
//                                         aria-pressed={paymentMethod === 'banks'}
//                                         onClick={() =>
//                                             handlePaymentMethodChange('banks')
//                                         }
//                                         disabled={loading}
//                                         className={`group relative w-full min-h-[72px] px-4 py-3 sm:px-5 rounded-xl cursor-pointer border-2 transition-all duration-200 flex items-center justify-center gap-3 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a47d52]/40 ${
//                                             paymentMethod === 'banks'
//                                                 ? 'border-[#a47d52] bg-[#a47d52]/5 shadow-md ring-1 ring-[#a47d52]/10'
//                                                 : 'border-gray-200 bg-[#f8f7f5] hover:border-[#a47d52]/60 hover:bg-white hover:shadow-md active:scale-[0.99]'
//                                         } ${
//                                             loading
//                                                 ? 'opacity-60 cursor-not-allowed'
//                                                 : ''
//                                         }`}
//                                     >
//                                         <span
//                                             className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
//                                                 paymentMethod === 'banks'
//                                                     ? 'bg-[#a47d52]/10'
//                                                     : 'bg-gray-100 group-hover:bg-[#a47d52]/10'
//                                             }`}
//                                         >
//                                             <FaUniversity
//                                                 className={`text-lg sm:text-xl transition-colors ${
//                                                     paymentMethod === 'banks'
//                                                         ? 'text-[#a47d52]'
//                                                         : 'text-gray-400 group-hover:text-[#a47d52]'
//                                                 }`}
//                                             />
//                                         </span>
//                                         <span
//                                             className={`font-semibold text-sm sm:text-base ${
//                                                 paymentMethod === 'banks'
//                                                     ? 'text-[#a47d52]'
//                                                     : 'text-gray-700'
//                                             }`}
//                                         >
//                                             بنوك
//                                         </span>
//                                         {paymentMethod === 'banks' && (
//                                             <span className="mr-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#a47d52] text-white shadow-sm">
//                                                 <FaCheck className="text-xs" />
//                                             </span>
//                                         )}
//                                     </button>

//                                     <button
//                                         type="button"
//                                         aria-pressed={paymentMethod === 'cash'}
//                                         onClick={() =>
//                                             handlePaymentMethodChange('cash')
//                                         }
//                                         disabled={loading}
//                                         className={`group relative w-full min-h-[72px] px-4 py-3 sm:px-5 rounded-xl cursor-pointer border-2 transition-all duration-200 flex items-center justify-center gap-3 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a47d52]/40 ${
//                                             paymentMethod === 'cash'
//                                                 ? 'border-[#a47d52] bg-[#a47d52]/5 shadow-md ring-1 ring-[#a47d52]/10'
//                                                 : 'border-gray-200 bg-[#f8f7f5] hover:border-[#a47d52]/60 hover:bg-white hover:shadow-md active:scale-[0.99]'
//                                         } ${
//                                             loading
//                                                 ? 'opacity-60 cursor-not-allowed'
//                                                 : ''
//                                         }`}
//                                     >
//                                         <span
//                                             className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
//                                                 paymentMethod === 'cash'
//                                                     ? 'bg-[#a47d52]/10'
//                                                     : 'bg-gray-100 group-hover:bg-[#a47d52]/10'
//                                             }`}
//                                         >
//                                             <FaMoneyBillWave
//                                                 className={`text-lg sm:text-xl transition-colors ${
//                                                     paymentMethod === 'cash'
//                                                         ? 'text-[#a47d52]'
//                                                         : 'text-gray-400 group-hover:text-[#a47d52]'
//                                                 }`}
//                                             />
//                                         </span>
//                                         <span
//                                             className={`font-semibold text-sm sm:text-base ${
//                                                 paymentMethod === 'cash'
//                                                     ? 'text-[#a47d52]'
//                                                     : 'text-gray-700'
//                                             }`}
//                                         >
//                                             نقدي
//                                         </span>
//                                         {paymentMethod === 'cash' && (
//                                             <span className="mr-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#a47d52] text-white shadow-sm">
//                                                 <FaCheck className="text-xs" />
//                                             </span>
//                                         )}
//                                     </button>
//                                 </div>

//                                 {errors.payment_method && (
//                                     <p className="text-red-500 text-sm mt-1">
//                                         {errors.payment_method}
//                                     </p>
//                                 )}
//                             </div>

//                             {/* ACCOUNT + BANK/CASHBOX */}
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <div className="space-y-1.5">
//                                     <label className="block text-sm font-semibold text-slate-700">
//                                         من حساب
//                                     </label>
//                                     <select
//                                         ref={accountFromRef}
//                                         name="account_from"
//                                         value={formData.account_from}
//                                         onChange={handleChange}
//                                         onKeyDown={(e) =>
//                                             handleKeyDown(e, subtotalRef)
//                                         }
//                                         className="w-full cursor-pointer px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor: getFieldBorderColor(
//                                                 isAccountFromFilled,
//                                                 errors.account_from
//                                             ),
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                             boxShadow: getFieldShadow(
//                                                 isAccountFromFilled,
//                                                 errors.account_from
//                                             )
//                                         }}
//                                         disabled={loading}
//                                     >
//                                         <option value="">اختر الحساب...</option>
//                                         {accounts.map((account) => (
//                                             <option
//                                                 key={account.id}
//                                                 value={account.id}
//                                             >
//                                                 {account.name}{' '}
//                                                 {account.category_name
//                                                     ? `- ${account.category_name}`
//                                                     : ''}
//                                             </option>
//                                         ))}
//                                     </select>

//                                     {errors.account_from && (
//                                         <p className="text-red-500 text-sm mt-1">
//                                             {errors.account_from}
//                                         </p>
//                                     )}
//                                 </div>

//                                 {paymentMethod === 'banks' ? (
//                                     <div className="space-y-1.5">
//                                         <label className="block text-sm font-semibold text-slate-700">
//                                             البنك
//                                         </label>
//                                         <select
//                                             name="bank"
//                                             value={formData.bank || ''}
//                                             onChange={handleChange}
//                                             className="w-full cursor-pointer px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
//                                             style={{
//                                                 borderTopColor: 'transparent',
//                                                 borderBottomColor: 'white',
//                                                 borderLeftColor: 'transparent',
//                                                 borderRightColor: getFieldBorderColor(
//                                                     !!formData.bank,
//                                                     errors.bank
//                                                 ),
//                                                 borderWidth: '2px',
//                                                 borderStyle: 'solid',
//                                                 boxShadow: getFieldShadow(
//                                                     !!formData.bank,
//                                                     errors.bank
//                                                 )
//                                             }}
//                                             disabled={loading}
//                                         >
//                                             <option value="">اختر البنك...</option>
//                                             {banks.map((bank) => (
//                                                 <option
//                                                     key={bank.id}
//                                                     value={bank.id}
//                                                 >
//                                                     {bank.name}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                         {errors.bank && (
//                                             <p className="text-red-500 text-sm mt-1">
//                                                 {errors.bank}
//                                             </p>
//                                         )}
//                                     </div>
//                                 ) : paymentMethod === 'cash' ? (
//                                     <div className="space-y-1.5">
//                                         <label className="block text-sm font-semibold text-slate-700">
//                                             الخزينة النقدية
//                                         </label>
//                                         <select
//                                             name="cashbox"
//                                             value={formData.cashbox || ''}
//                                             onChange={handleChange}
//                                             className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
//                                             style={{
//                                                 borderTopColor: 'transparent',
//                                                 borderBottomColor: 'white',
//                                                 borderLeftColor: 'transparent',
//                                                 borderRightColor: getFieldBorderColor(
//                                                     !!formData.cashbox,
//                                                     errors.cashbox
//                                                 ),
//                                                 borderWidth: '2px',
//                                                 borderStyle: 'solid',
//                                                 boxShadow: getFieldShadow(
//                                                     !!formData.cashbox,
//                                                     errors.cashbox
//                                                 )
//                                             }}
//                                             disabled={loading}
//                                         >
//                                             <option value="">اختر الخزينة...</option>
//                                             {cashboxes.map((cashbox) => (
//                                                 <option
//                                                     key={cashbox.id}
//                                                     value={cashbox.id}
//                                                 >
//                                                     {cashbox.name}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                         {errors.cashbox && (
//                                             <p className="text-red-500 text-sm mt-1">
//                                                 {errors.cashbox}
//                                             </p>
//                                         )}
//                                     </div>
//                                 ) : (
//                                     <div className="space-y-1.5">
//                                         <label className="block text-sm font-semibold text-slate-700">
//                                             الى حساب - البنك / الخزينة
//                                         </label>
//                                         <div className="w-full px-4 py-3 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-slate-500 text-right">
//                                             اختر طريقة الدفع أولاً
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>

//                             {/* SUBTOTAL / VAT / AMOUNT GROUP */}
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                 {/* AMOUNT (subtotal) — REQUIRED */}
//                                 <div className="space-y-1.5">
//                                     <label className="block text-sm font-semibold text-slate-700">
//                                         المبلغ قبل الضريبة{' '}
//                                         <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         ref={subtotalRef}
//                                         type="text"
//                                         name="subtotal"
//                                         value={formData.subtotal}
//                                         onChange={handleChange}
//                                         onKeyDown={(e) =>
//                                             handleKeyDown(e, vatRef)
//                                         }
//                                         className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor:
//                                                 getFieldBorderColor(
//                                                     isSubtotalFilled,
//                                                     errors.subtotal
//                                                 ),
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                             boxShadow: getFieldShadow(
//                                                 isSubtotalFilled,
//                                                 errors.subtotal
//                                             )
//                                         }}
//                                         placeholder="أدخل المبلغ..."
//                                         step="0.01"
//                                         min="0.01"
//                                         disabled={loading}
//                                     />
//                                     {errors.subtotal && (
//                                         <p className="text-red-500 text-sm mt-1">
//                                             {errors.subtotal}
//                                         </p>
//                                     )}
//                                 </div>

//                                 <div className="space-y-1.5">
//                                     <label className="block text-sm font-semibold text-slate-700">
//                                         الضريبة (VAT)
//                                     </label>
//                                     <input
//                                         ref={vatRef}
//                                         type="text"
//                                         name="vat"
//                                         value={formData.vat}
//                                         onChange={handleChange}
//                                         onKeyDown={(e) =>
//                                             handleKeyDown(e, statementRef)
//                                         }
//                                         className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor:
//                                                 formData.vat !== ''
//                                                     ? '#a47d52'
//                                                     : '#ef4444',
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                             boxShadow:
//                                                 formData.vat !== ''
//                                                     ? '0 0 0 3px rgba(164, 125, 82, 0.12)'
//                                                     : '0 0 0 3px rgba(239, 68, 68, 0.08)'
//                                         }}
//                                         placeholder="0.00"
//                                         step="0.01"
//                                         min="0"
//                                         disabled={loading}
//                                     />
//                                 </div>

//                                 <div className="space-y-1.5">
//                                     <label className="block text-sm font-semibold text-slate-700">
//                                         الإجمالي (محسوب تلقائياً)
//                                     </label>
//                                     <input
//                                         ref={amountRef}
//                                         type="text"
//                                         name="amount"
//                                         value={formData.amount}
//                                         readOnly
//                                         disabled
//                                         className="w-full px-4 py-3 bg-slate-100 rounded-xl shadow-sm text-right cursor-not-allowed text-[#a47d52] font-bold"
//                                         style={{
//                                             borderTopColor: 'transparent',
//                                             borderBottomColor: 'white',
//                                             borderLeftColor: 'transparent',
//                                             borderRightColor: '#a47d52',
//                                             borderWidth: '2px',
//                                             borderStyle: 'solid',
//                                             boxShadow:
//                                                 '0 0 0 3px rgba(164, 125, 82, 0.12)'
//                                         }}
//                                         placeholder="0.00"
//                                     />
//                                 </div>
//                             </div>

//                             {/* AMOUNT IN WORDS */}
//                             {getAmountInWords() && (
//                                 <div className="p-3 sm:p-4 bg-[#a47d52]/5 border border-[#a47d52]/20 rounded-xl text-right">
//                                     <span className="text-sm font-medium text-gray-700">
//                                         المبلغ كتابةً:{' '}
//                                     </span>
//                                     <span className="text-sm font-bold text-[#a47d52]">
//                                         {getAmountInWords()}
//                                     </span>
//                                     <span> </span>
//                                     <span>فقط لا غير</span>
//                                 </div>
//                             )}

//                             {/* STATEMENT — REQUIRED */}
//                             <div className="w-full space-y-1.5">
//                                 <label className="block text-sm font-semibold text-slate-700">
//                                     البيان <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     ref={statementRef}
//                                     type="text"
//                                     name="statement"
//                                     value={formData.statement}
//                                     onChange={handleChange}
//                                     onKeyDown={(e) =>
//                                         handleKeyDown(e, personDeliverRef)
//                                     }
//                                     className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
//                                     style={{
//                                         borderTopColor: 'transparent',
//                                         borderBottomColor: 'white',
//                                         borderLeftColor: 'transparent',
//                                         borderRightColor:
//                                             getFieldBorderColor(
//                                                 isStatementFilled,
//                                                 errors.statement
//                                             ),
//                                         borderWidth: '2px',
//                                         borderStyle: 'solid',
//                                         boxShadow: getFieldShadow(
//                                             isStatementFilled,
//                                             errors.statement
//                                         )
//                                     }}
//                                     placeholder="وصف المعاملة..."
//                                     disabled={loading}
//                                 />
//                                 {errors.statement && (
//                                     <p className="text-red-500 text-sm mt-1">
//                                         {errors.statement}
//                                     </p>
//                                 )}
//                             </div>

//                             {/* PERSON DELIVER */}
//                             <div className="space-y-1.5">
//                                 <label className="block text-sm font-semibold text-slate-700">
//                                     الشخص المسلم
//                                 </label>
//                                 <input
//                                     ref={personDeliverRef}
//                                     type="text"
//                                     name="person_deliver"
//                                     value={formData.person_deliver}
//                                     onChange={handleChange}
//                                     className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right hover:border-[#a47d52]/60"
//                                     style={{
//                                         borderTopColor: 'transparent',
//                                         borderBottomColor: 'white',
//                                         borderLeftColor: 'transparent',
//                                         borderRightColor: getFieldBorderColor(
//                                             isPersonDeliverFilled,
//                                             errors.person_deliver
//                                         ),
//                                         borderWidth: '2px',
//                                         borderStyle: 'solid',
//                                         boxShadow: getFieldShadow(
//                                             isPersonDeliverFilled,
//                                             errors.person_deliver
//                                         )
//                                     }}
//                                     placeholder="اسم الشخص المسلم..."
//                                     disabled={loading}
//                                 />
//                             </div>

//                             {/* CHECK */}
//                             <div className="space-y-3 pt-5 border-t border-slate-200">
//                                 <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
//                                     <input
//                                         type="checkbox"
//                                         name="has_check"
//                                         checked={formData.has_check}
//                                         onChange={handleChange}
//                                         className="w-5 h-5 rounded-md border-slate-300 text-[#a47d52] focus:ring-[#a47d52]/30 cursor-pointer"
//                                     />
//                                     <label className="text-sm font-semibold text-gray-700">
//                                         يوجد شيك ؟
//                                     </label>
//                                 </div>

//                                 {formData.has_check && (
//                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-6 border-r-2 border-[#a47d52]/30 pl-2">
//                                         <div className="space-y-1.5">
//                                             <label className="block text-sm font-medium text-slate-600">
//                                                 رقم الشيك
//                                             </label>
//                                             <input
//                                                 ref={checkNoRef}
//                                                 type="text"
//                                                 name="check_no"
//                                                 value={formData.check_no}
//                                                 onChange={handleChange}
//                                                 className="w-full px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right"
//                                                 placeholder="رقم الشيك..."
//                                                 disabled={loading}
//                                             />
//                                         </div>

//                                         <div className="space-y-1.5">
//                                             <label className="block text-sm font-medium text-slate-600">
//                                                 بنك الشيك
//                                             </label>
//                                             <select
//                                                 name="check_bank"
//                                                 value={formData.check_bank}
//                                                 onChange={handleChange}
//                                                 className="w-full cursor-pointer px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right"
//                                                 disabled={loading}
//                                             >
//                                                 <option value="">اختر البنك...</option>
//                                                 {banks.map((bank) => (
//                                                     <option
//                                                         key={bank.id}
//                                                         value={bank.id}
//                                                     >
//                                                         {bank.name}
//                                                     </option>
//                                                 ))}
//                                             </select>
//                                         </div>

//                                         <div className="space-y-1.5">
//                                             <label className="block text-sm font-medium text-slate-600">
//                                                 تاريخ الشيك
//                                             </label>
//                                             <input
//                                                 ref={checkDateRef}
//                                                 type="date"
//                                                 name="check_date"
//                                                 value={formData.check_date}
//                                                 onChange={handleChange}
//                                                 className="w-full px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right"
//                                                 disabled={loading}
//                                             />
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>

//                             {/* DOCUMENT */}
//                             <div className="space-y-3 pt-5 border-t border-slate-200">
//                                 <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
//                                     <input
//                                         type="checkbox"
//                                         name="has_document"
//                                         checked={formData.has_document}
//                                         onChange={handleChange}
//                                         className="w-5 h-5 rounded-md border-slate-300 text-[#a47d52] focus:ring-[#a47d52]/30 cursor-pointer"
//                                     />
//                                     <label className="text-sm font-semibold text-gray-700">
//                                         يوجد مستند ؟
//                                     </label>
//                                 </div>

//                                 {formData.has_document && (
//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6 border-r-2 border-[#a47d52]/30 pl-2">
//                                         <div className="space-y-1.5">
//                                             <label className="block text-sm font-medium text-slate-600">
//                                                 رقم المستند
//                                             </label>
//                                             <input
//                                                 ref={documentNoRef}
//                                                 type="text"
//                                                 name="document_no"
//                                                 value={formData.document_no}
//                                                 onChange={handleChange}
//                                                 className="w-full px-4 py-2.5 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right"
//                                                 placeholder="رقم المستند..."
//                                                 disabled={loading}
//                                             />
//                                         </div>

//                                         <div className="space-y-1.5">
//                                             <label className="block text-sm font-medium text-slate-600">
//                                                 تحميل المستند
//                                             </label>
//                                             <div className="relative">
//                                                 <input
//                                                     type="file"
//                                                     name="document"
//                                                     onChange={handleChange}
//                                                     accept=".pdf,.jpg,.jpeg,.png"
//                                                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//                                                     disabled={loading}
//                                                 />
//                                                 <div className="w-full px-4 py-3 bg-white rounded-xl shadow-sm flex items-center justify-between text-right hover:border-[#a47d52]/60 transition-all duration-200 border-2 border-dashed border-[#a47d52]/30">
//                                                     <span
//                                                         className={`text-sm ${
//                                                             formData.document
//                                                                 ? 'text-[#a47d52]'
//                                                                 : 'text-red-400'
//                                                         }`}
//                                                     >
//                                                         {formData.document
//                                                             ? formData.document.name
//                                                             : 'اختر ملف...'}
//                                                     </span>
//                                                     <FaUpload
//                                                         className={
//                                                             formData.document
//                                                                 ? 'text-[#a47d52]'
//                                                                 : 'text-red-400'
//                                                         }
//                                                     />
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>

//                             {/* NOTES */}
//                             <div className="space-y-1.5">
//                                 <label className="block text-sm font-semibold text-slate-700">
//                                     ملاحظات
//                                 </label>
//                                 <textarea
//                                     ref={notesRef}
//                                     name="notes"
//                                     value={formData.notes}
//                                     onChange={handleChange}
//                                     rows="2"
//                                     className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none transition-all duration-200 text-right resize-none"
//                                     placeholder="ملاحظات إضافية..."
//                                     disabled={loading}
//                                 />
//                             </div>

//                             {/* 👇 SIGNATURES — ALSO IN ADD MODE */}
//                             <SignaturesSection />
//                         </>
//                     )}

//                     {/* BUTTONS */}
//                     <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 border-t border-slate-200 sticky bottom-0 bg-slate-50/95 backdrop-blur-sm">
//                         {isEditMode ? (
//                             <button
//                                 type="submit"
//                                 disabled={loading}
//                                 className={`cursor-pointer flex-1 min-h-12 bg-[#a47d52] text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-[#a47d52]/20 transition-all duration-200 hover:bg-[#8a6a44] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${
//                                     loading
//                                         ? 'opacity-70 cursor-not-allowed'
//                                         : ''
//                                 }`}
//                             >
//                                 {loading ? (
//                                     <span className="flex items-center justify-center gap-2">
//                                         <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
//                                         جاري الحفظ...
//                                     </span>
//                                 ) : (
//                                     <span className="flex items-center justify-center gap-2">
//                                         <FaSave />
//                                         التالي
//                                     </span>
//                                 )}
//                             </button>
//                         ) : (
//                             <>
//                                 <button
//                                     type="submit"
//                                     disabled={loading}
//                                     className={`cursor-pointer flex-1 min-h-12 bg-[#a47d52] text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-[#a47d52]/20 transition-all duration-200 hover:bg-[#8a6a44] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${
//                                         loading
//                                             ? 'opacity-70 cursor-not-allowed'
//                                             : ''
//                                     }`}
//                                 >
//                                     {loading ? (
//                                         <span className="flex items-center justify-center gap-2">
//                                             <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
//                                             جاري الحفظ...
//                                         </span>
//                                     ) : (
//                                         <span className="flex items-center justify-center gap-2">
//                                             <FaSave />
//                                             حفظ
//                                         </span>
//                                     )}
//                                 </button>

//                                 <button
//                                     type="button"
//                                     onClick={handleClose}
//                                     className="cursor-pointer w-full sm:w-auto min-h-12 px-6 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-100 hover:border-slate-400 transition-all duration-200"
//                                     disabled={loading}
//                                 >
//                                     إلغاء
//                                 </button>
//                             </>
//                         )}
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default AddDeposit;



