import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaSave, FaUniversity, FaMoneyBillWave, FaCheck, FaUpload, FaSignature } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { formatAmountInWords } from '../../../utils/numberToArabic';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const AddDeposit = ({ onClose, transactionData, onSuccess, initialData, isEditMode: initialEditMode }) => {
    
    // Add state for edit mode - FIXED: single declaration
    const [isEditMode, setIsEditMode] = useState(initialEditMode || false);
    const [transactionId, setTransactionId] = useState(initialData?.id || null);
    
    // ... other state declarations
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [banks, setBanks] = useState([]);
    const [cashboxes, setCashboxes] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [errors, setErrors] = useState({});
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    
    // Refs for keyboard navigation
    const accountFromRef = useRef(null);
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
    const userSignatureRef = useRef(null);
    const managerSignatureRef = useRef(null);
    const secondPersonSignatureRef = useRef(null);

    // Default form data
    const defaultFormData = {
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'deposit',
        amount: '',
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
        document_no: '',
        currency: 'AED',
        amount_to_arabic: '',
        amount_to_english: '',
        transaction_no: '',
        transaction_user: null,
        user_signature: '',
        manager_signature: '',
        second_person_signature: '',
        created_at: '',
        updated_at: '',
    };

    // Form fields
    const [formData, setFormData] = useState(defaultFormData);

    // Currency options
    const currencyOptions = [
        { value: 'AED', label: 'UAE Dirham' },
        { value: 'USD', label: 'US Dollar' },
        { value: 'EUR', label: 'Euro' },
        { value: 'SAR', label: 'Saudi Riyal' },
    ];

    // Check if fields are filled
    const isAccountFromFilled = formData.account_from && formData.account_from !== '';
    const isAmountFilled = formData.amount && parseFloat(formData.amount) > 0;
    const isStatementFilled = formData.statement && formData.statement.trim() !== '';
    const isPersonDeliverFilled = formData.person_deliver && formData.person_deliver.trim() !== '';
    const isUserSignatureFilled = formData.user_signature && formData.user_signature.trim() !== '';
    const isManagerSignatureFilled = formData.manager_signature && formData.manager_signature.trim() !== '';
    const isSecondPersonSignatureFilled = formData.second_person_signature && formData.second_person_signature.trim() !== '';

    // Get amount in words (Arabic)
    const getAmountInWords = () => {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            return '';
        }
        return formatAmountInWords(formData.amount);
    };

    // Get field border color
    const getFieldBorderColor = (isFilled, error) => {
        if (error) return '#ef4444';
        if (isFilled) return '#a47d52';
        return '#ef4444';
    };

    // Get field shadow
    const getFieldShadow = (isFilled, error) => {
        if (error) return '0 0 0 3px rgba(239, 68, 68, 0.15)';
        if (isFilled) return '0 0 0 3px rgba(164, 125, 82, 0.12)';
        return '0 0 0 3px rgba(239, 68, 68, 0.08)';
    };

    // Fetch accounts
    const fetchAccounts = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${BASE}/api/accounts/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const accountsData = data.results || data || [];
                setAccounts(accountsData);
                return accountsData;
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
        return [];
    };

    // Fetch banks
    const fetchBanks = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${BASE}/api/banks/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setBanks(data.results || data || []);
            }
        } catch (error) {
            console.error('Error fetching banks:', error);
        }
    };

    // Fetch cashboxes
    const fetchCashboxes = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${BASE}/api/cashboxes/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCashboxes(data.results || data || []);
            }
        } catch (error) {
            console.error('Error fetching cashboxes:', error);
        }
    };

    // Find account ID by name
    const findAccountIdByName = (accountName, accountsList) => {
        if (!accountName || !accountsList || accountsList.length === 0) {
            return '';
        }
        
        // If it's already a number or numeric string, return it
        if (!isNaN(accountName) && accountName !== '') {
            return accountName;
        }
        
        // Try to find by exact name match
        let found = accountsList.find(acc => 
            acc.name === accountName || 
            acc.name?.trim() === accountName?.trim()
        );
        
        // If not found, try case-insensitive match
        if (!found) {
            found = accountsList.find(acc => 
                acc.name?.toLowerCase() === accountName?.toLowerCase() ||
                acc.name?.toLowerCase().trim() === accountName?.toLowerCase().trim()
            );
        }
        
        // If still not found, log warning
        if (!found) {
            console.warn('No matching account found for name:', accountName);
            console.warn('Available accounts:', accountsList.map(a => a.name));
            return '';
        }
        
        return found.id;
    };

    // Effect to handle form population when component opens or initialData changes
    useEffect(() => {
        const loadDataAndPopulate = async () => {
            // Fetch accounts first
            const accountsData = await fetchAccounts();
            await fetchBanks();
            await fetchCashboxes();
            
            if (initialData && Object.keys(initialData).length > 0) {
                console.log('Populating form with initialData:', initialData);
                
                // EDIT MODE: Populate form with existing data
                setIsEditMode(true);
                setTransactionId(initialData.id);
                
                // Get the bank/cashbox ID from the transaction data
                const bankId = typeof initialData.bank === 'object' 
                    ? initialData.bank?.id || '' 
                    : initialData.bank || '';
                
                const cashboxId = typeof initialData.cashbox === 'object' 
                    ? initialData.cashbox?.id || '' 
                    : initialData.cashbox || '';
                
                // IMPORTANT: Find account ID by name
                let accountFromValue = initialData.account_from || '';
                let accountToValue = initialData.account_to || '';
                
                // If accounts are loaded, find the matching IDs
                if (accountsData && accountsData.length > 0) {
                    // For account_from - find by name
                    const foundAccountFromId = findAccountIdByName(accountFromValue, accountsData);
                    if (foundAccountFromId) {
                        accountFromValue = foundAccountFromId;
                        console.log('Found account_from ID:', foundAccountFromId, 'for name:', initialData.account_from);
                    } else {
                        // If not found, keep the original value (might be ID or name)
                        console.warn('Could not find account_from ID for:', accountFromValue);
                    }
                    
                    // For account_to - find by name (if it's a name)
                    if (accountToValue && isNaN(accountToValue)) {
                        const foundAccountToId = findAccountIdByName(accountToValue, accountsData);
                        if (foundAccountToId) {
                            accountToValue = foundAccountToId;
                            console.log('Found account_to ID:', foundAccountToId, 'for name:', initialData.account_to);
                        }
                    }
                }
                
                // Populate form with initial data
                setFormData({
                    ...defaultFormData,
                    ...initialData,
                    transaction_date: initialData.transaction_date || new Date().toISOString().split('T')[0],
                    amount: initialData.amount || '',
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
                    second_person_signature: initialData.second_person_signature || '',
                    created_at: initialData.created_at || '',
                    updated_at: initialData.updated_at || '',
                });
                
                // Set payment method based on data
                if (initialData.payment_method) {
                    setPaymentMethod(initialData.payment_method);
                } else if (initialData.bank) {
                    setPaymentMethod('banks');
                } else if (initialData.cashbox) {
                    setPaymentMethod('cash');
                }
            } else {
                // ADD MODE: Reset form to default values
                console.log('Resetting form to default (ADD MODE)');
                setIsEditMode(false);
                setTransactionId(null);
                setFormData(defaultFormData);
                setPaymentMethod(null);
                setErrors({});
            }
            
            setIsDataLoaded(true);
        };
        
        loadDataAndPopulate();
    }, [initialData]);

    // Handle input change
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] });
            if (files[0]) {
                setErrors({ ...errors, [name]: '' });
            }
        } else if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
            setErrors({ ...errors, [name]: '' });
            
            // Auto-generate amount words when amount changes
            if (name === 'amount' && value) {
                const amountNum = parseFloat(value);
                if (amountNum > 0) {
                    setFormData(prev => ({
                        ...prev,
                        [name]: value,
                        amount_to_arabic: formatAmountInWords(amountNum),
                        amount_to_english: formatAmountInWords(amountNum),
                    }));
                }
            }
        }
    };

    // Handle payment method change
    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
        setFormData({ 
            ...formData, 
            payment_method: method,
            bank: '',
            cashbox: '',
            account_to: ''
        });
        setErrors({ ...errors, bank: '', cashbox: '' });
    };

    // Handle Enter key - move to next field
    const handleKeyDown = (e, nextRef) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextRef && nextRef.current) {
                nextRef.current.focus();
            }
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('يرجى تسجيل الدخول');
                setLoading(false);
                return;
            }

            // Validate
            const newErrors = {};
            if (!formData.account_from) {
                newErrors.account_from = 'يرجى اختيار الحساب المصدر';
            }
            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                newErrors.amount = 'يرجى إدخال مبلغ صحيح';
            }
            if (!formData.statement || formData.statement.trim() === '') {
                newErrors.statement = 'يرجى إدخال البيان';
            }
            if (!paymentMethod) {
                newErrors.payment_method = 'يرجى اختيار طريقة الدفع';
            }
            if (paymentMethod === 'banks' && !formData.bank) {
                newErrors.bank = 'يرجى اختيار البنك';
            }
            if (paymentMethod === 'cash' && !formData.cashbox) {
                newErrors.cashbox = 'يرجى اختيار الخزينة النقدية';
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                toast.error('يرجى تصحيح الأخطاء في النموذج');
                setLoading(false);
                return;
            }

            // Prepare data - Use JSON for all fields
            const submitData = {
                type: 'deposit',
                transaction_date: formData.transaction_date,
                amount: parseFloat(formData.amount),
                payment_method: paymentMethod,
                account_from: formData.account_from,
                account_to: '',
                statement: formData.statement,
                person_deliver: formData.person_deliver || '',
                person_receipt: formData.person_receipt || '',
                notes: formData.notes || '',
                has_check: formData.has_check,
                currency: formData.currency || 'AED',
                amount_to_arabic: formatAmountInWords(parseFloat(formData.amount)) || '',
                amount_to_english: formatAmountInWords(parseFloat(formData.amount)) || '',
                user_signature: formData.user_signature || '',
                manager_signature: formData.manager_signature || '',
                second_person_signature: formData.second_person_signature || '',
            };

            // Add bank or cashbox ID based on payment method
            if (paymentMethod === 'banks') {
                submitData.bank = parseInt(formData.bank);
            } else if (paymentMethod === 'cash') {
                submitData.cashbox = parseInt(formData.cashbox);
            }

            // Add check fields if has_check
            if (formData.has_check) {
                submitData.check_no = formData.check_no || '';
                submitData.check_bank = formData.check_bank || '';
                submitData.check_date = formData.check_date || '';
            }

            // Add document fields if has_document
            if (formData.has_document) {
                submitData.has_document = true;
                submitData.document_no = formData.document_no || '';
            }

            // Determine if we need FormData (for file upload)
            const hasFileUpload = formData.has_document && formData.document;

            // Determine URL and method based on edit mode
            const url = isEditMode 
                ? `${BASE}/api/transactions/${transactionId}/update/`
                : `${BASE}/api/transactions/create/`;
            
            const method = isEditMode ? 'PUT' : 'POST';

            let response;

            if (hasFileUpload) {
                const formDataObj = new FormData();
                Object.keys(submitData).forEach(key => {
                    if (submitData[key] !== undefined && submitData[key] !== null) {
                        formDataObj.append(key, submitData[key]);
                    }
                });
                formDataObj.append('document', formData.document);

                response = await fetch(url, {
                    method: method,
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formDataObj
                });
            } else {
                response = await fetch(url, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(submitData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                
                if (errorData) {
                    const errorMessages = [];
                    Object.keys(errorData).forEach(key => {
                        if (Array.isArray(errorData[key])) {
                            errorMessages.push(`${key}: ${errorData[key].join(', ')}`);
                        } else if (typeof errorData[key] === 'string') {
                            errorMessages.push(`${key}: ${errorData[key]}`);
                        }
                    });
                    throw new Error(errorMessages.join('\n') || 'فشل حفظ المعاملة');
                }
                throw new Error('فشل حفظ المعاملة');
            }

            const result = await response.json();
            console.log('Transaction saved:', result);

            // Handle auto-switch to edit mode for new deposits
            if (!isEditMode) {
                toast.success('✅ تم إضافة الإيداع بنجاح');
                
                const newTransactionId = result.id || result.data?.id;
                
                if (newTransactionId) {
                    setIsEditMode(true);
                    setTransactionId(newTransactionId);
                    
                    if (result.data) {
                        setFormData(prev => ({
                            ...prev,
                            ...result.data,
                            bank: result.data.bank?.id || result.data.bank || prev.bank,
                            cashbox: result.data.cashbox?.id || result.data.cashbox || prev.cashbox,
                        }));
                    }
                    
                    await fetchTransactionDetails(newTransactionId);
                    onSuccess?.();
                    toast.info('📝 يمكنك الآن اضافه التوقيعات');
                } else {
                    toast.success('تم الإضافة بنجاح');
                    onSuccess?.();
                    handleClose();
                }
            } else {
                toast.success('✅ تم تحديث التوقيعات بنجاح');
                onSuccess?.();
                handleClose();
            }
            
        } catch (error) {
            console.error('Error saving transaction:', error);
            toast.error('❌ ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to fetch transaction details
    const fetchTransactionDetails = async (transactionId) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${BASE}/api/transactions/${transactionId}/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Find account IDs by name if needed
                let accountFromId = data.account_from || '';
                let accountToId = data.account_to || '';
                
                // If account_from is a name (string), find the ID
                if (accountFromId && isNaN(accountFromId) && accounts.length > 0) {
                    const foundId = findAccountIdByName(accountFromId, accounts);
                    if (foundId) {
                        accountFromId = foundId;
                    }
                }
                
                // If account_to is a name (string), find the ID
                if (accountToId && isNaN(accountToId) && accounts.length > 0) {
                    const foundId = findAccountIdByName(accountToId, accounts);
                    if (foundId) {
                        accountToId = foundId;
                    }
                }
                
                setFormData(prev => ({
                    ...prev,
                    ...data,
                    account_from: accountFromId,
                    account_to: accountToId,
                    bank: data.bank?.id || data.bank || prev.bank,
                    cashbox: data.cashbox?.id || data.cashbox || prev.cashbox,
                    transaction_user: data.transaction_user || prev.transaction_user,
                }));
                
                if (data.payment_method) {
                    setPaymentMethod(data.payment_method);
                } else if (data.bank) {
                    setPaymentMethod('banks');
                } else if (data.cashbox) {
                    setPaymentMethod('cash');
                }
                
                return data;
            }
        } catch (error) {
            console.error('Error fetching transaction details:', error);
        }
    };

    // Close handler to reset edit mode
    const handleClose = () => {
        setIsEditMode(false);
        setTransactionId(null);
        setFormData(defaultFormData);
        setPaymentMethod(null);
        setErrors({});
        setLoading(false);
        onClose();
    };

    // Format date for display
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

    // Get user display name
    const getUserDisplayName = (user) => {
        if (!user) return 'غير معروف';
        if (typeof user === 'object') {
            return user.username || user.name || user.id || 'غير معروف';
        }
        return user;
    };

    // Get account name by ID for display
    const getAccountName = (accountId) => {
        if (!accountId) return '';
        const account = accounts.find(acc => acc.id === parseInt(accountId));
        return account ? account.name : accountId;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/1 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 z-10 bg-green-50 shadow-lg">
                    <div>
                        <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                            {isEditMode ? 'تحديث التوقيعات' : 'إيداع جديد'}
                        </h3>
                        {isEditMode && formData.transaction_no && (
                            <p className="text-sm text-gray-500 mt-1">
                                رقم المعاملة: <span className="font-bold text-[#a47d52]">{formData.transaction_no}</span>
                            </p>
                        )}
                    </div>
                    <button 
                        className="cursor-pointer animate-spin text-gray-400 hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
                    {/* Update Info (only in edit mode) */}
                    
                    
                    
{isEditMode && (
    <div className="bg-[#a47d52]/5 border border-[#a47d52]/20 rounded-lg p-4 space-y-3">
        {/* Created by */}
        {/* <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">تم الإنشاء بواسطة:</span>
            <span className="font-semibold text-[#a47d52]">
                {getUserDisplayName(formData.transaction_user)}
            </span>
        </div> */}
        
        {/* Created at */}
        {formData.created_at && (
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">تاريخ الاجراء:</span>
                <span className="font-medium text-gray-700">{formatDate(formData.created_at)}</span>
            </div>
        )}
        
        {/* Updated at */}
        {formData.updated_at && formData.updated_at !== formData.created_at && (
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">آخر تحديث:</span>
                <span className="font-medium text-gray-700">{formatDate(formData.updated_at)}</span>
            </div>
        )}

        {/* Account From and Account To Display */}
        <div className="pt-3 border-t border-[#a47d52]/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex gap-2 items-center text-sm">
                    <span className="text-gray-600">من حساب:</span>
                    <span className="font-medium text-[#a47d52]">
                        {getAccountName(formData.account_from) || formData.account_from || '-'}
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

        {/* Transaction Details */}
        <div className="pt-3 border-t border-[#a47d52]/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex gap-2 items-center text-sm">
                    <span className="text-gray-600">المبلغ:</span>
                    <span className="font-medium text-[#a47d52]">
                        {formData.amount ? parseFloat(formData.amount).toFixed(2) : '-'}
                    </span>
                </div>
                <div className="flex gap-2 items-center text-sm">
                    <span className="text-gray-600">العملة:</span>
                    <span className="font-medium text-[#a47d52]">
                        {formData.currency || '-'}
                    </span>
                </div>
                <div className="flex gap-2 items-center text-sm">
                    <span className="text-gray-600">طريقة الدفع:</span>
                    <span className="font-medium text-[#a47d52]">
                        {paymentMethod === 'banks' ? 'بنوك' : 
                         paymentMethod === 'cash' ? 'نقدي' : 
                         formData.payment_method || '-'}
                    </span>
                </div>
            </div>
        </div>

        {/* Amount in Words */}
        {getAmountInWords() && (
            <div className="pt-3 border-t border-[#a47d52]/20">
                <div className="flex gap-2 items-center text-sm">
                    <span className="text-gray-600">المبلغ كتابةً:</span>
                    <span className="font-medium text-[#a47d52]">
                        {getAmountInWords()}
                    </span>
                    <span className="text-sm text-gray-500">فقظ لاغير</span>
                </div>
            </div>
        )}

        {/* Statement */}
        {formData.statement && (
            <div className="pt-3 border-t border-[#a47d52]/20">
                <div className="flex gap-2 items-center text-sm">
                    <span className="text-gray-600">البيان:</span>
                    <span className="font-medium text-[#a47d52]">
                        {formData.statement}
                    </span>
                </div>
            </div>
        )}

        {/* Person Deliver */}
        {formData.person_deliver && (
            <div className="pt-3 border-t border-[#a47d52]/20">
                <div className="flex gap-2 items-center text-sm">
                    <span className="text-gray-600">الشخص المسلم:</span>
                    <span className="font-medium text-[#a47d52]">
                        {formData.person_deliver}
                    </span>
                </div>
            </div>
        )}

        {/* Check Details */}
        {formData.has_check && (
            <div className="pt-3 border-t border-[#a47d52]/20">
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

        {/* Document Details */}
        {formData.has_document && (
            <div className="pt-3 border-t border-[#a47d52]/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex gap-2 items-center text-sm">
                        <span className="text-gray-600">رقم المستند:</span>
                        <span className="font-medium text-[#a47d52]">
                            {formData.document_no || '-'}
                        </span>
                    </div>
                    {formData.document && (
                        <div className="flex gap-2 items-center text-sm">
                            <span className="text-gray-600">المستند:</span>
                            <span className="font-medium text-[#a47d52]">
                                {typeof formData.document === 'string' ? formData.document : formData.document?.name || 'مرفق'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Notes */}
        {formData.notes && (
            <div className="pt-3 border-t border-[#a47d52]/20">
                <div className="flex gap-2 items-center text-sm">
                    <span className="text-gray-600">ملاحظات:</span>
                    <span className="font-medium text-[#a47d52]">
                        {formData.notes}
                    </span>
                </div>
            </div>
        )}

        {/* ===== SIGNATURES SECTION - EDITABLE ===== */}
        <div className="pt-3 border-t-2 border-[#a47d52]/30">
            <div className="flex items-center gap-2 mb-3">
                <FaSignature className="text-[#a47d52] text-sm" />
                <h4 className="text-sm font-bold text-gray-700">التوقيعات</h4>
                <span className="text-xs text-gray-400 mr-auto">(قابل للتعديل)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* User Signature - Editable */}
                <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">
                          توقيع المحاسب
                    </label>
                    <input
                        ref={userSignatureRef}
                        type="text"
                        name="user_signature"
                        value={formData.user_signature || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white rounded-sm shadow-sm focus:outline-none transition-all duration-300 text-right text-sm"
                        style={{
                            borderTopColor: 'transparent',
                            borderBottomColor: 'white',
                            borderLeftColor: 'transparent',
                            borderRightColor: formData.user_signature ? '#a47d52' : '#ef4444',
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            boxShadow: formData.user_signature ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : 'none'
                        }}
                        placeholder=" توقيع المحاسب ..."
                        disabled={loading}
                    />
                </div>

                {/* Manager Signature - Editable */}
                <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">
                        توقيع المدير
                    </label>
                    <input
                        ref={managerSignatureRef}
                        type="text"
                        name="manager_signature"
                        value={formData.manager_signature || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white rounded-sm shadow-sm focus:outline-none transition-all duration-300 text-right text-sm"
                        style={{
                            borderTopColor: 'transparent',
                            borderBottomColor: 'white',
                            borderLeftColor: 'transparent',
                            borderRightColor: formData.manager_signature ? '#a47d52' : '#ef4444',
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            boxShadow: formData.manager_signature ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : 'none'
                        }}
                        placeholder="توقيع المدير ..."
                        disabled={loading}
                    />
                </div>

                {/* Second Person Signature - Editable */}
                <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">
                        توقيع الشخص المستلم
                    </label>
                    <input
                        ref={secondPersonSignatureRef}
                        type="text"
                        name="second_person_signature"
                        value={formData.second_person_signature || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white rounded-sm shadow-sm focus:outline-none transition-all duration-300 text-right text-sm"
                        style={{
                            borderTopColor: 'transparent',
                            borderBottomColor: 'white',
                            borderLeftColor: 'transparent',
                            borderRightColor: formData.second_person_signature ? '#a47d52' : '#ef4444',
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            boxShadow: formData.second_person_signature ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : 'none'
                        }}
                        placeholder="توقيع الشخص المستلم ..."
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    </div>
)}
                   
        

        {!isEditMode && (
    <>
        {/* Currency Selection */}
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                العملة <span className="text-red-500">*</span>
            </label>
            <select
                ref={currencyRef}
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, accountFromRef)}
                className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                style={{
                    borderTopColor: 'transparent',
                    borderBottomColor: 'white',
                    borderLeftColor: 'transparent',
                    borderRightColor: formData.currency ? '#a47d52' : '#ef4444',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    boxShadow: formData.currency ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                }}
                disabled={loading}
            >
                {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label} ({option.value})
                    </option>
                ))}
            </select>
        </div>

        {/* Payment Method Selection */}
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                طريقة الدفع <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('banks')}
                    className={`p-4 rounded-xs shadow-xl cursor-pointer border-r-2 transition-all duration-200 flex items-center justify-center gap-3 ${
                        paymentMethod === 'banks'
                            ? 'border-[#a47d52] bg-white shadow-md'
                            : paymentMethod === null
                            ? 'border-red-500 bg-[#f8f7f5] hover:border-[#a47d52]/50'
                            : 'border-gray-200 bg-[#f8f7f5] hover:border-[#a47d52]/50'
                    }`}
                >
                    <FaUniversity className={`text-xl ${
                        paymentMethod === 'banks' ? 'text-[#a47d52]' : 
                        paymentMethod === null ? 'text-red-500' : 'text-gray-400'
                    }`} />
                    <span className={`font-medium ${
                        paymentMethod === 'banks' ? 'text-[#a47d52]' : 
                        paymentMethod === null ? 'text-red-500' : 'text-gray-600'
                    }`}>
                        بنوك
                    </span>
                    {paymentMethod === 'banks' && <FaCheck className="text-[#a47d52]" />}
                </button>
                <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('cash')}
                    className={`p-4 rounded-xs shadow-xl cursor-pointer border-r-2 transition-all duration-200 flex items-center justify-center gap-3 ${
                        paymentMethod === 'cash'
                            ? 'border-[#a47d52] bg-white shadow-md'
                            : paymentMethod === null
                            ? 'border-red-500 bg-[#f8f7f5] hover:border-[#a47d52]/50'
                            : 'border-gray-200 bg-[#f8f7f5] hover:border-[#a47d52]/50'
                    }`}
                >
                    <FaMoneyBillWave className={`text-xl ${
                        paymentMethod === 'cash' ? 'text-[#a47d52]' : 
                        paymentMethod === null ? 'text-red-500' : 'text-gray-400'
                    }`} />
                    <span className={`font-medium ${
                        paymentMethod === 'cash' ? 'text-[#a47d52]' : 
                        paymentMethod === null ? 'text-red-500' : 'text-gray-600'
                    }`}>
                        نقدي
                    </span>
                    {paymentMethod === 'cash' && <FaCheck className="text-[#a47d52]" />}
                </button>
            </div>
            {errors.payment_method && (
                <p className="text-red-500 text-sm mt-1">{errors.payment_method}</p>
            )}
        </div>

        {/* Account From + Bank/Cashbox in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">
                    من حساب <span className="text-red-500">*</span>
                </label>
                <select
                    ref={accountFromRef}
                    name="account_from"
                    value={formData.account_from}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, amountRef)}
                    className="w-full cursor-pointer px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                    style={{
                        borderTopColor: 'transparent',
                        borderBottomColor: 'white',
                        borderLeftColor: 'transparent',
                        borderRightColor: getFieldBorderColor(isAccountFromFilled, errors.account_from),
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        boxShadow: getFieldShadow(isAccountFromFilled, errors.account_from)
                    }}
                    required
                    disabled={loading}
                    autoFocus
                >
                    <option value="">اختر الحساب...</option>
                    {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                            {account.name} {account.category_name ? `- ${account.category_name}` : ''}
                        </option>
                    ))}
                </select>
                {errors.account_from && (
                    <p className="text-red-500 text-sm mt-1">{errors.account_from}</p>
                )}
            </div>

            {paymentMethod === 'banks' ? (
                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">
                        البنك <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="bank"
                        value={formData.bank}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, amountRef)}
                        className="w-full cursor-pointer px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                        style={{
                            borderTopColor: 'transparent',
                            borderBottomColor: 'white',
                            borderLeftColor: 'transparent',
                            borderRightColor: getFieldBorderColor(!!formData.bank, errors.bank),
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            boxShadow: getFieldShadow(!!formData.bank, errors.bank)
                        }}
                        required
                        disabled={loading}
                    >
                        <option value="">اختر البنك...</option>
                        {banks.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                                {bank.name}
                            </option>
                        ))}
                    </select>
                    {errors.bank && (
                        <p className="text-red-500 text-sm mt-1">{errors.bank}</p>
                    )}
                </div>
            ) : paymentMethod === 'cash' ? (
                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">
                        الخزينة النقدية <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="cashbox"
                        value={formData.cashbox}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, amountRef)}
                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                        style={{
                            borderTopColor: 'transparent',
                            borderBottomColor: 'white',
                            borderLeftColor: 'transparent',
                            borderRightColor: getFieldBorderColor(!!formData.cashbox, errors.cashbox),
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            boxShadow: getFieldShadow(!!formData.cashbox, errors.cashbox)
                        }}
                        required
                        disabled={loading}
                    >
                        <option value="">اختر الخزينة...</option>
                        {cashboxes.map((cashbox) => (
                            <option key={cashbox.id} value={cashbox.id}>
                                {cashbox.name}
                            </option>
                        ))}
                    </select>
                    {errors.cashbox && (
                        <p className="text-red-500 text-sm mt-1">{errors.cashbox}</p>
                    )}
                </div>
            ) : (
                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">
                        الى حساب - البنك / الخزينة <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-100 rounded-sm border-2 border-red-500 text-gray-500 text-right">
                        اختر طريقة الدفع أولاً
                    </div>
                </div>
            )}
        </div>

        {/* Amount with Words Display */}
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
                المبلغ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <input
                    ref={amountRef}
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, statementRef)}
                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                    style={{
                        borderTopColor: 'transparent',
                        borderBottomColor: 'white',
                        borderLeftColor: 'transparent',
                        borderRightColor: getFieldBorderColor(isAmountFilled, errors.amount),
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        boxShadow: getFieldShadow(isAmountFilled, errors.amount)
                    }}
                    placeholder="أدخل المبلغ..."
                    step="0.01"
                    min="0.01"
                    required
                    disabled={loading}
                />
                {getAmountInWords() && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 px-4 py-1 bg-[#a47d52]/10 rounded-l-sm border-r-2 border-[#a47d52] text-[#a47d52] text-sm font-semibold whitespace-nowrap max-w-[200px] truncate">
                        {getAmountInWords()}
                    </div>
                )}
            </div>
            {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
            {getAmountInWords() && (
                <div className="mt-2 p-3 bg-[#a47d52]/5 border border-[#a47d52]/20 rounded-lg text-right">
                    <span className="text-sm font-medium text-gray-700">المبلغ كتابةً: </span>
                    <span className="text-sm font-bold text-[#a47d52]">{getAmountInWords()}</span>
                    <span> </span>
                    <span>فقظ لاغير</span>
                </div>
            )}
        </div>

        {/* Date + Statement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">
                    التاريخ <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, statementRef)}
                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                    style={{
                        borderTopColor: 'transparent',
                        borderBottomColor: 'white',
                        borderLeftColor: 'transparent',
                        borderRightColor: formData.transaction_date ? '#a47d52' : '#ef4444',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        boxShadow: formData.transaction_date ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                    }}
                    required
                    disabled={loading}
                />
            </div>

            <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">
                    البيان <span className="text-red-500">*</span>
                </label>
                <input
                    ref={statementRef}
                    type="text"
                    name="statement"
                    value={formData.statement}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, personDeliverRef)}
                    className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                    style={{
                        borderTopColor: 'transparent',
                        borderBottomColor: 'white',
                        borderLeftColor: 'transparent',
                        borderRightColor: getFieldBorderColor(isStatementFilled, errors.statement),
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        boxShadow: getFieldShadow(isStatementFilled, errors.statement)
                    }}
                    placeholder="وصف المعاملة..."
                    required
                    disabled={loading}
                />
                {errors.statement && (
                    <p className="text-red-500 text-sm mt-1">{errors.statement}</p>
                )}
            </div>
        </div>

        {/* Person Deliver */}
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
                الشخص المسلم
            </label>
            <input
                ref={personDeliverRef}
                type="text"
                name="person_deliver"
                value={formData.person_deliver}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, personReceiptRef)}
                className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                style={{
                    borderTopColor: 'transparent',
                    borderBottomColor: 'white',
                    borderLeftColor: 'transparent',
                    borderRightColor: getFieldBorderColor(isPersonDeliverFilled, errors.person_deliver),
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    boxShadow: getFieldShadow(isPersonDeliverFilled, errors.person_deliver)
                }}
                placeholder="اسم الشخص المسلم..."
                disabled={loading}
            />
        </div>

        {/* Person Receipt - hidden */}
        <div className="space-y-1 hidden">
            <label className="block text-sm font-semibold text-gray-700">
                الشخص المستلم
            </label>
            <input
                ref={personReceiptRef}
                type="text"
                name="person_receipt"
                value={formData.person_receipt}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, notesRef)}
                className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                style={{
                    borderTopColor: 'transparent',
                    borderBottomColor: 'white',
                    borderLeftColor: 'transparent',
                    borderRightColor: formData.person_receipt ? '#a47d52' : '#ef4444',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    boxShadow: formData.person_receipt ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                }}
                placeholder="اسم الشخص المستلم..."
                disabled={loading}
            />
        </div>

        {/* Check Section */}
        <div className="space-y-3 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    name="has_check"
                    checked={formData.has_check}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-[#a47d52] focus:ring-[#a47d52]"
                />
                <label className="text-sm font-semibold text-gray-700">
                    يوجد شيك ؟
                </label>
            </div>

            {formData.has_check && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-6 border-r-2 border-[#a47d52]/30 pl-2">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-600">
                            رقم الشيك
                        </label>
                        <input
                            ref={checkNoRef}
                            type="text"
                            name="check_no"
                            value={formData.check_no}
                            onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, checkBankRef)}
                            className="w-full px-4 py-2 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                            style={{
                                borderTopColor: 'transparent',
                                borderBottomColor: 'white',
                                borderLeftColor: 'transparent',
                                borderRightColor: formData.check_no ? '#a47d52' : '#ef4444',
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                boxShadow: formData.check_no ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                            }}
                            placeholder="رقم الشيك..."
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-600">
                            بنك الشيك
                        </label>
                        <input
                            ref={checkBankRef}
                            type="text"
                            name="check_bank"
                            value={formData.check_bank}
                            onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, checkDateRef)}
                            className="w-full px-4 py-2 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                            style={{
                                borderTopColor: 'transparent',
                                borderBottomColor: 'white',
                                borderLeftColor: 'transparent',
                                borderRightColor: formData.check_bank ? '#a47d52' : '#ef4444',
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                boxShadow: formData.check_bank ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                            }}
                            placeholder="بنك الشيك..."
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-600">
                            تاريخ الشيك
                        </label>
                        <input
                            ref={checkDateRef}
                            type="date"
                            name="check_date"
                            value={formData.check_date}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                            style={{
                                borderTopColor: 'transparent',
                                borderBottomColor: 'white',
                                borderLeftColor: 'transparent',
                                borderRightColor: formData.check_date ? '#a47d52' : '#ef4444',
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                boxShadow: formData.check_date ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                            }}
                            disabled={loading}
                        />
                    </div>
                </div>
            )}
        </div>

        {/* Document Section */}
        <div className="space-y-3 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    name="has_document"
                    checked={formData.has_document}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-[#a47d52] focus:ring-[#a47d52]"
                />
                <label className="text-sm font-semibold text-gray-700">
                    يوجد مستند ؟
                </label>
            </div>

            {formData.has_document && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6 border-r-2 border-[#a47d52]/30 pl-2">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-600">
                            رقم المستند
                        </label>
                        <input
                            ref={documentNoRef}
                            type="text"
                            name="document_no"
                            value={formData.document_no}
                            onChange={handleChange}
                            onKeyDown={(e) => handleKeyDown(e, notesRef)}
                            className="w-full px-4 py-2 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                            style={{
                                borderTopColor: 'transparent',
                                borderBottomColor: 'white',
                                borderLeftColor: 'transparent',
                                borderRightColor: formData.document_no ? '#a47d52' : '#ef4444',
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                boxShadow: formData.document_no ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                            }}
                            placeholder="رقم المستند..."
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-600">
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
                            <div className="w-full px-4 py-2 bg-white rounded-sm shadow-lg flex items-center justify-between text-right"
                                style={{
                                    borderTopColor: 'transparent',
                                    borderBottomColor: 'white',
                                    borderLeftColor: 'transparent',
                                    borderRightColor: formData.document ? '#a47d52' : '#ef4444',
                                    borderWidth: '2px',
                                    borderStyle: 'solid',
                                    boxShadow: formData.document ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                                }}
                            >
                                <span className={`text-sm ${formData.document ? 'text-[#a47d52]' : 'text-red-400'}`}>
                                    {formData.document ? formData.document.name : 'اختر ملف...'}
                                </span>
                                <FaUpload className={`${formData.document ? 'text-[#a47d52]' : 'text-red-400'}`} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Notes */}
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
                ملاحظات
            </label>
            <textarea
                ref={notesRef}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right resize-none"
                style={{
                    borderTopColor: 'transparent',
                    borderBottomColor: 'white',
                    borderLeftColor: 'transparent',
                    borderRightColor: formData.notes ? '#a47d52' : '#ef4444',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    boxShadow: formData.notes ? '0 0 0 3px rgba(164, 125, 82, 0.12)' : '0 0 0 3px rgba(239, 68, 68, 0.08)'
                }}
                placeholder="ملاحظات إضافية..."
                disabled={loading}
            />
        </div>
    </>
)}

{/* Buttons */}
<div className="flex gap-3 pt-4 border-t border-gray-200">
    {isEditMode ? (
        // In edit mode, show only Update and Close buttons
        <>
            <button
                type="submit"
                disabled={loading}
                className={`cursor-pointer flex-1 bg-[#a47d52] text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:bg-[#8a6a44] hover:scale-[1.02] active:scale-95 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
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
                        تحديث التوقيعات
                    </span>
                )}
            </button>
            <button
                type="button"
                onClick={handleClose}
                className="cursor-pointer px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all duration-200"
                disabled={loading}
            >
                إلغاء
            </button>
        </>
    ) : (
        // In add mode, show Save and Cancel buttons
        <>
            <button
                type="submit"
                disabled={loading}
                className={`cursor-pointer flex-1 bg-[#a47d52] text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:bg-[#8a6a44] hover:scale-[1.02] active:scale-95 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
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
                className="cursor-pointer px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all duration-200"
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
