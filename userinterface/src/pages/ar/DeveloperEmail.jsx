// DeveloperEmail.jsx
// npm install react-icons react-toastify

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FaPaperPlane,
    FaEnvelopeOpenText,
    FaUserCheck,
    FaUserTimes,
    FaCheckSquare,
    FaRegSquare,
    FaFlask,
    FaTimes,
    FaSpinner,
    FaSearch,
} from 'react-icons/fa';

import logo from '../../assets/images/logogo-removebg-old.png';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// =============================================================
// PRESET TEMPLATES
// =============================================================

const GREETING_PLACEHOLDER = '[Development Company Name]';

const PRESET_TEMPLATES = [
    {
        id: 'registration',
        label: 'تسجيل جديد',
        subject: 'Registration Request – Broker City Properties',
        dir: 'ltr',

        body: `Dear ${GREETING_PLACEHOLDER},

I hope this message finds you well.

I am writing on behalf of Broker City Properties. We would like to formally request registration with your company as an authorized real estate brokerage.

Broker City Properties is a real estate company specializing in [property sales / leasing / investment consulting – adjust as needed]. We are keen to collaborate with your esteemed development company and to present your projects to our clients and investors.

To complete the registration process, kindly let us know the required documents and procedures. We are happy to provide any information needed, including:

• Company trade license
• Brokerage registration certificate
• Contact details of authorized representatives
• Any additional forms or agreements required

We would also appreciate it if you could share your current and upcoming project offerings, along with the applicable commission structure and sales policies.

Thank you for your time and consideration. We look forward to building a successful and long-term partnership with you.

Best regards,`,
    },

    {
        id: 'followup',
        label: 'متابعة المطور',
        subject: 'متابعة المطور - Broker City Properties',
        dir: 'rtl',
        body: `مرحباً،

نود متابعة آخر مستجدات المطور والتأكد من سير الأمور وفق ما هو مخطط له.

في حال وجود أي استفسارات أو تحديثات جديدة، يرجى التواصل معنا حتى نتمكن من متابعتها وإدراجها في النظام.

شكراً لتعاونكم المستمر.

مع خالص التحية،
Broker City Properties`,
    },
];

// =============================================================
// COMPONENT
// =============================================================

const DeveloperEmail = () => {
    // ---------- STATE ----------
    const [developers, setDevelopers] = useState([]);
    const [loadingDevelopers, setLoadingDevelopers] = useState(true);
    const [developerError, setDeveloperError] = useState(null);

    const [selectedTemplateId, setSelectedTemplateId] = useState(
        PRESET_TEMPLATES[0].id
    );
    const [subject, setSubject] = useState(PRESET_TEMPLATES[0].subject);
    const [body, setBody] = useState(PRESET_TEMPLATES[0].body);

    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState('');

    const [sending, setSending] = useState(false);
    const [testSending, setTestSending] = useState(false);

    const bodyRef = useRef(null);
    const subjectRef = useRef(null);

    // =========================================================
    // FETCH DEVELOPERS
    // =========================================================
    useEffect(() => {
        fetchDevelopers();
    }, []);

    const fetchDevelopers = async () => {
        setLoadingDevelopers(true);
        setDeveloperError(null);

        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('يرجى تسجيل الدخول لعرض المطورين');
                setLoadingDevelopers(false);
                return;
            }

            const response = await fetch(`${BASE}/api/developers/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
                } else {
                    toast.error('فشل تحميل المطورين');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Backend may return either a list or { results: [...] }
            const list = Array.isArray(data) ? data : data.results || [];
            setDevelopers(list);
            setLoadingDevelopers(false);
        } catch (err) {
            console.error('Error fetching developers:', err);
            setDeveloperError('فشل تحميل المطورين');
            setLoadingDevelopers(false);
        }
    };

    // =========================================================
    // TEMPLATE PICKER
    // =========================================================
    const applyTemplate = (templateId) => {
        const tpl = PRESET_TEMPLATES.find((t) => t.id === templateId);
        if (!tpl) return;

        setSelectedTemplateId(templateId);

        // Rebuild body with the current greeting if it's the registration
        // template (contains the placeholder).
        let newBody = tpl.body;
        if (newBody.includes(GREETING_PLACEHOLDER)) {
            newBody = newBody.replace(
                GREETING_PLACEHOLDER,
                buildGreetingName()
            );
        }

        setSubject(tpl.subject);
        setBody(newBody);
    };

    // =========================================================
    // SELECTION HELPERS
    // =========================================================
    const developersWithEmail = useMemo(
        () =>
            developers.filter(
                (d) => d.email && String(d.email).trim() !== ''
            ),
        [developers]
    );

    const filteredDevelopers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return developers;

        return developers.filter((d) => {
            const name = (d.name || '').toLowerCase();
            const email = (d.email || '').toLowerCase();
            const phone = (d.phone || '').toLowerCase();
            const type = (d.type || '').toLowerCase();
            return (
                name.includes(q) ||
                email.includes(q) ||
                phone.includes(q) ||
                type.includes(q)
            );
        });
    }, [developers, search]);

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => {
        // Only select developers with valid email
        setSelectedIds(developersWithEmail.map((d) => d.id));
    };

    const deselectAll = () => {
        setSelectedIds([]);
    };

    const allWithEmailSelected =
        developersWithEmail.length > 0 &&
        developersWithEmail.every((d) => selectedIds.includes(d.id));

    // =========================================================
    // GREETING NAME BUILDER
    // =========================================================
    const buildGreetingName = () => {
        if (selectedIds.length === 0) {
            return GREETING_PLACEHOLDER;
        }

        const names = selectedIds
            .map((id) => {
                const dev = developers.find((d) => d.id === id);
                return dev?.name?.trim();
            })
            .filter(Boolean);

        if (names.length === 0) {
            return GREETING_PLACEHOLDER;
        }

        return names.join(', ');
    };

    // =========================================================
    // AUTO-UPDATE GREETING WHEN SELECTION CHANGES
    // =========================================================
    useEffect(() => {
        // Only touch the body if it belongs to the registration template
        // (i.e. it still contains the placeholder or a previous greeting).
        // We detect this by checking whether the current template's raw body
        // contains the placeholder.
        const tpl = PRESET_TEMPLATES.find(
            (t) => t.id === selectedTemplateId
        );
        if (!tpl || !tpl.body.includes(GREETING_PLACEHOLDER)) return;

        const newGreeting = buildGreetingName();

        setBody((prev) => {
            // Pattern: "Dear <anything up to first newline>,"
            const regex = /^Dear[^\n]*,/;
            if (regex.test(prev)) {
                return prev.replace(regex, `Dear ${newGreeting},`);
            }
            // If body doesn't start with "Dear ...", prepend it.
            return `Dear ${newGreeting},\n\n${prev}`;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIds, selectedTemplateId, developers]);

    // =========================================================
    // CURRENT TEMPLATE DIRECTION
    // =========================================================
    const currentDir = useMemo(() => {
        const tpl = PRESET_TEMPLATES.find(
            (t) => t.id === selectedTemplateId
        );
        return tpl?.dir || 'rtl';
    }, [selectedTemplateId]);

    // =========================================================
    // VALIDATION
    // =========================================================
    const canSend =
        subject.trim().length > 0 &&
        body.trim().length > 0 &&
        selectedIds.length > 0 &&
        !sending;

    // =========================================================
    // SEND BULK EMAIL
    // =========================================================
    const handleSend = async () => {
        if (sending) return;

        if (!subject.trim()) {
            toast.warning('يرجى إدخال الموضوع');
            subjectRef.current?.focus();
            return;
        }

        if (!body.trim()) {
            toast.warning('يرجى إدخال نص الرسالة');
            bodyRef.current?.focus();
            return;
        }

        if (selectedIds.length === 0) {
            toast.warning('يرجى تحديد مطور واحد على الأقل');
            return;
        }

        setSending(true);

        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('يرجى تسجيل الدخول أولاً');
                setSending(false);
                return;
            }

            const response = await fetch(
                `${BASE}/api/send-email/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        subject: subject.trim(),
                        message: body,
                        recipient_ids: selectedIds,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                // 400 — validation error
                if (response.status === 400) {
                    const msgs = [];
                    Object.keys(data).forEach((key) => {
                        if (Array.isArray(data[key])) {
                            msgs.push(`${key}: ${data[key].join(', ')}`);
                        } else if (typeof data[key] === 'string') {
                            msgs.push(`${key}: ${data[key]}`);
                        }
                    });
                    toast.error(
                        msgs.join(' | ') || 'فشل إرسال البريد الإلكتروني'
                    );
                    setSending(false);
                    return;
                }

                if (response.status === 500) {
                    toast.error(
                        data?.detail ||
                            'فشل إرسال البريد الإلكتروني. تحقق من إعدادات SMTP.'
                    );
                    setSending(false);
                    return;
                }

                toast.error('فشل إرسال البريد الإلكتروني');
                setSending(false);
                return;
            }

            // Success response shape:
            // { status, sent_count, failed_count, sent:[...], failed:[...] }
            const sentCount = data.sent_count ?? 0;
            const failedCount = data.failed_count ?? 0;

            if (sentCount > 0 && failedCount === 0) {
                toast.success(
                    `✅ تم إرسال ${sentCount} بريد إلكتروني بنجاح`
                );
            } else if (sentCount > 0 && failedCount > 0) {
                toast.warning(
                    `تم إرسال ${sentCount} بريد، وفشل ${failedCount} بريد`
                );
                console.warn('Failed recipients:', data.failed);
            } else {
                toast.error('لم يتم إرسال أي بريد. تحقق من السجلات.');
            }

            // Clear selection after success (keep subject/body for reuse)
            setSelectedIds([]);
            setSending(false);
        } catch (err) {
            console.error('Send email error:', err);
            toast.error('خطأ في الاتصال بالخادم');
            setSending(false);
        }
    };

    // =========================================================
    // SEND TEST EMAIL
    // =========================================================
    const handleSendTest = async () => {
        if (testSending) return;

        setTestSending(true);

        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('يرجى تسجيل الدخول أولاً');
                setTestSending(false);
                return;
            }

            const response = await fetch(
                `${BASE}/api/developers/test-email/`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status === 'error') {
                toast.error(
                    data?.message ||
                        'فشل إرسال البريد الاختباري. تحقق من SMTP.'
                );
                setTestSending(false);
                return;
            }

            toast.success('✅ تم إرسال البريد الاختباري بنجاح');
            setTestSending(false);
        } catch (err) {
            console.error('Send test email error:', err);
            toast.error('خطأ في الاتصال بالخادم');
            setTestSending(false);
        }
    };

    // =========================================================
    // RESET
    // =========================================================
    const handleReset = () => {
        setSelectedTemplateId(PRESET_TEMPLATES[0].id);
        setSubject(PRESET_TEMPLATES[0].subject);
        setBody(PRESET_TEMPLATES[0].body);
        setSelectedIds([]);
        setSearch('');
    };

    // =========================================================
    // RENDER
    // =========================================================
    return (
        <div
            dir="rtl"
            className="min-h-screen bg-[#f8f7f5] py-8 px-3 sm:px-5 lg:px-8"
        >
            <div className="max-w-7xl mx-auto">
                {/* =====================================================
                    HEADER
                ===================================================== */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                    <div className="text-center sm:text-right">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-800 flex items-center justify-center sm:justify-start gap-3">
                            <FaEnvelopeOpenText className="text-[#a47d52]" />
                            <span>إرسال بريد إلكتروني للمطورين</span>
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            اختر القالب، اكتب الرسالة، وحدّد المطورين المُستلمين
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSendTest}
                            disabled={testSending || sending}
                            className="flex items-center gap-2 bg-white border-2 border-[#a47d52]/40 text-[#a47d52] px-4 py-2.5 rounded-lg font-extrabold text-sm transition-all duration-300 hover:bg-[#a47d52]/10 hover:border-[#a47d52] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="إرسال بريد اختباري إلى بريدك المسجل"
                        >
                            {testSending ? (
                                <>
                                    <FaSpinner className="animate-spin" />
                                    <span>جاري الإرسال...</span>
                                </>
                            ) : (
                                <>
                                    <FaFlask />
                                    <span>بريد اختباري</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={sending || testSending}
                            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-extrabold text-sm transition-all duration-300 hover:bg-gray-300 active:scale-95 disabled:opacity-50"
                        >
                            <FaTimes />
                            <span>إعادة تعيين</span>
                        </button>
                    </div>
                </div>

                {/* =====================================================
                    MAIN GRID
                ===================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* =================================================
                        LEFT (form) — 3 columns
                    ================================================= */}
                    <div className="lg:col-span-3 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        {/* Logo */}
                        <div className="p-6 border-b border-gray-100 flex flex-col items-center justify-center bg-[#f8f7f5]">
                            <img
                                src={logo}
                                alt="Broker City Properties"
                                className="h-[70px] w-auto object-contain scale-[1.6] mb-6 mt-4"
                            />
                            <h2 className="text-lg font-extrabold text-gray-700">
                                إنشاء بريد إلكتروني
                            </h2>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Template Picker */}
                            <div>
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    قالب جاهز
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {PRESET_TEMPLATES.map((tpl) => {
                                        const active =
                                            selectedTemplateId === tpl.id;
                                        return (
                                            <button
                                                key={tpl.id}
                                                type="button"
                                                onClick={() =>
                                                    applyTemplate(tpl.id)
                                                }
                                                disabled={sending}
                                                className={`cursor-pointer text-right px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                                                    active
                                                        ? 'border-[#a47d52] bg-[#a47d52]/5 shadow-md'
                                                        : 'border-gray-200 bg-white hover:border-[#a47d52]/50'
                                                } disabled:opacity-60`}
                                            >
                                                <span
                                                    className={`block font-extrabold text-sm ${
                                                        active
                                                            ? 'text-[#a47d52]'
                                                            : 'text-gray-700'
                                                    }`}
                                                >
                                                    {tpl.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    الموضوع <span className="text-red-500">*</span>
                                </label>
                                <input
                                    ref={subjectRef}
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    disabled={sending}
                                    dir="rtl"
                                    placeholder="اكتب موضوع البريد الإلكتروني..."
                                    className="w-full px-4 py-3 bg-white rounded-lg shadow-sm border-2 border-gray-200 focus:border-[#a47d52] focus:outline-none transition-all duration-200 text-right"
                                    maxLength={255}
                                />
                                <div className="text-xs text-gray-400 mt-1 text-left">
                                    {subject.length}/255
                                </div>
                            </div>

                            {/* Body */}
                            <div>
                                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                                    نص الرسالة <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    ref={bodyRef}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    disabled={sending}
                                    dir={currentDir}
                                    rows={12}
                                    placeholder="اكتب نص الرسالة..."
                                    className={`w-full px-4 py-3 bg-white rounded-lg shadow-sm border-2 border-gray-200 focus:border-[#a47d52] focus:outline-none transition-all duration-200 resize-y leading-7 font-medium ${
                                        currentDir === 'rtl'
                                            ? 'text-right'
                                            : 'text-left'
                                    }`}
                                />
                            </div>

                            {/* Send Button */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleSend}
                                    disabled={!canSend}
                                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-extrabold text-white transition-all duration-300 shadow-md ${
                                        canSend
                                            ? 'bg-[#a47d52] hover:bg-[#8a6a44] hover:scale-[1.01] hover:shadow-lg active:scale-95 cursor-pointer'
                                            : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    {sending ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            <span>جاري الإرسال...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane />
                                            <span>
                                                إرسال
                                                {selectedIds.length > 0 && (
                                                    <span className="mr-2 text-white/90">
                                                        ({selectedIds.length})
                                                    </span>
                                                )}
                                            </span>
                                        </>
                                    )}
                                </button>
                                {selectedIds.length === 0 && (
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        يرجى تحديد مطور واحد على الأقل من القائمة
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        RIGHT (developers) — 2 columns
                    ================================================= */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 bg-[#f8f7f5]">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-extrabold text-gray-700 flex items-center gap-2">
                                    <FaUserCheck className="text-[#a47d52]" />
                                    <span>بيانات المطور</span>
                                </h2>
                                <span className="text-xs font-bold bg-[#a47d52] text-white px-3 py-1 rounded-full">
                                    {selectedIds.length} / {developers.length}
                                </span>
                            </div>

                            {/* Search */}
                            <div className="relative mb-3">
                                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="بحث بالاسم، البريد، الهاتف..."
                                    className="w-full pr-10 pl-3 py-2.5 bg-white rounded-lg border-2 border-gray-200 focus:border-[#a47d52] focus:outline-none transition-all text-right text-sm"
                                    dir="rtl"
                                />
                            </div>

                            {/* Bulk actions */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        allWithEmailSelected
                                            ? deselectAll
                                            : selectAll
                                    }
                                    disabled={developersWithEmail.length === 0}
                                    className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-white border-2 border-[#a47d52]/40 text-[#a47d52] py-2 rounded-lg font-extrabold text-xs transition-all duration-300 hover:bg-[#a47d52]/10 hover:border-[#a47d52] active:scale-95 disabled:opacity-50"
                                >
                                    {allWithEmailSelected ? (
                                        <>
                                            <FaRegSquare />
                                            <span>إلغاء تحديد الكل</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckSquare />
                                            <span>تحديد الكل</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto max-h-[600px]">
                            {loadingDevelopers ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <FaSpinner className="animate-spin text-3xl text-[#a47d52]" />
                                    <p className="text-sm text-gray-500 font-bold">
                                        جاري تحميل المطورين...
                                    </p>
                                </div>
                            ) : developerError ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                                    <FaUserTimes className="text-4xl text-red-400" />
                                    <p className="text-sm text-red-500 font-bold">
                                        {developerError}
                                    </p>
                                    <button
                                        onClick={fetchDevelopers}
                                        className="text-xs bg-[#a47d52] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#8a6a44]"
                                    >
                                        إعادة المحاولة
                                    </button>
                                </div>
                            ) : filteredDevelopers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                                    <FaUserTimes className="text-4xl text-gray-300" />
                                    <p className="text-sm text-gray-500 font-bold">
                                        لا يوجد مطورون
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-right">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-3 text-xs font-extrabold text-gray-600 border-b border-gray-200">
                                                بيانات المطور
                                            </th>
                                            <th className="px-3 py-3 text-xs font-extrabold text-gray-600 border-b border-gray-200 text-center w-24">
                                                هل ترغب بإرسالها له؟
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDevelopers.map((dev) => {
                                            const hasEmail =
                                                dev.email &&
                                                String(dev.email).trim() !== '';
                                            const isChecked =
                                                selectedIds.includes(dev.id);

                                            return (
                                                <tr
                                                    key={dev.id}
                                                    className={`border-b border-gray-100 transition-colors ${
                                                        isChecked
                                                            ? 'bg-[#a47d52]/5'
                                                            : 'hover:bg-gray-50'
                                                    } ${
                                                        !hasEmail
                                                            ? 'opacity-50'
                                                            : ''
                                                    }`}
                                                >
                                                    <td className="px-3 py-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-sm font-extrabold text-gray-800">
                                                                {dev.name || 'بدون اسم'}
                                                            </span>
                                                            <span
                                                                className="text-xs text-gray-500"
                                                                dir="ltr"
                                                            >
                                                                {dev.email || '— لا يوجد بريد —'}
                                                            </span>
                                                            {dev.phone && (
                                                                <span className="text-[11px] text-gray-400" dir="ltr">
                                                                    {dev.phone}
                                                                </span>
                                                            )}
                                                            {dev.type && (
                                                                <span className="text-[11px] text-[#a47d52] font-bold">
                                                                    {dev.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <label
                                                            className={`inline-flex items-center justify-center ${
                                                                hasEmail
                                                                    ? 'cursor-pointer'
                                                                    : 'cursor-not-allowed'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() =>
                                                                    hasEmail &&
                                                                    toggleSelect(dev.id)
                                                                }
                                                                disabled={!hasEmail || sending}
                                                                className="w-5 h-5 cursor-pointer accent-[#a47d52]"
                                                            />
                                                        </label>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer summary */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 font-bold">
                                    مطورون لديهم بريد إلكتروني:
                                </span>
                                <span className="font-extrabold text-[#a47d52]">
                                    {developersWithEmail.length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-gray-500 font-bold">
                                    مُحدَّد للإرسال:
                                </span>
                                <span className="font-extrabold text-[#a47d52]">
                                    {selectedIds.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    EMAIL PREVIEW FOOTER (matches voucher footer)
                ===================================================== */}
                <div className="mt-8 bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                    <p className="text-xs font-extrabold text-gray-500 mb-3 text-center">
                        سيتم إضافة التوقيع التالي تلقائياً إلى أسفل كل رسالة:
                    </p>
                    <div className="voucher-footer-contact max-w-md mx-auto text-center text-xs text-gray-600 space-y-2">
                        <div className="voucher-footer-contact-row flex items-center justify-center gap-2 flex-wrap">
                            <span dir="ltr">
                                P.O.BOX : 7833 Abu Dhabi - U.A.E
                            </span>
                            <span>|</span>
                            <span
                                className="voucher-footer-contact-ar"
                                dir="rtl"
                                lang="ar"
                            >
                                ص.ب 7833 أبوظبي - الإمارات العربية المتحدة
                            </span>
                        </div>

                        <div className="voucher-footer-contact-row flex items-center justify-center gap-2 flex-wrap">
                            <span dir="ltr">+971 50 2000 195</span>
                            <span>|</span>
                            <span dir="ltr">☎ +971 2 6666 101</span>
                        </div>

                        <div
                            className="voucher-footer-company font-extrabold text-[#a47d52] tracking-wide"
                            dir="ltr"
                        >
                            BROKER CITY PROPERTIES
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeveloperEmail;

// // DeveloperEmail.jsx
// // npm install react-icons react-toastify

// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import {
//     FaPaperPlane,
//     FaEnvelopeOpenText,
//     FaUserCheck,
//     FaUserTimes,
//     FaCheckSquare,
//     FaRegSquare,
//     FaFlask,
//     FaTimes,
//     FaSpinner,
//     FaSearch,
// } from 'react-icons/fa';

// import logo from '../../assets/images/logogo-removebg-old.png';

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// // =============================================================
// // PRESET TEMPLATES
// // =============================================================

// const PRESET_TEMPLATES = [
//     {
//         id: 'registration',
//         label: 'تسجيل جديد',
//         subject: 'Registration Request – Broker City Properties',
        
//         body: `
//         Dear [Development Company Name],
//         I hope this message finds you well.
//         I am writing on behalf of Broker City Properties. We would like to formally request registration with your company as an authorized real estate brokerage.
//         Broker City Properties is a real estate company specializing in [property sales / leasing / investment consulting – adjust as needed]. We are keen to collaborate with your esteemed development company and to present your projects to our clients and investors.
//         To complete the registration process, kindly let us know the required documents and procedures. We are happy to provide any information needed, including:
//         Company trade license
//         Brokerage registration certificate
//         Contact details of authorized representatives
//         Any additional forms or agreements required
//         We would also appreciate it if you could share your current and upcoming project offerings, along with the applicable commission structure and sales policies.
//         Thank you for your time and consideration. We look forward to building a successful and long-term partnership with you.
//         Best regards,
        
//         `,
//     },
    
//     {
//         id: 'followup',
//         label: 'متابعة المطور',
//         subject: 'متابعة المطور - Broker City Properties',
//         body: `مرحباً،

// نود متابعة آخر مستجدات المطور والتأكد من سير الأمور وفق ما هو مخطط له.

// في حال وجود أي استفسارات أو تحديثات جديدة، يرجى التواصل معنا حتى نتمكن من متابعتها وإدراجها في النظام.

// شكراً لتعاونكم المستمر.

// مع خالص التحية،
// Broker City Properties`,
//     },
// ];

// // =============================================================
// // COMPONENT
// // =============================================================

// const DeveloperEmail = () => {
//     // ---------- STATE ----------
//     const [developers, setDevelopers] = useState([]);
//     const [loadingDevelopers, setLoadingDevelopers] = useState(true);
//     const [developerError, setDeveloperError] = useState(null);

//     const [selectedTemplateId, setSelectedTemplateId] = useState(
//         PRESET_TEMPLATES[0].id
//     );
//     const [subject, setSubject] = useState(PRESET_TEMPLATES[0].subject);
//     const [body, setBody] = useState(PRESET_TEMPLATES[0].body);

//     const [selectedIds, setSelectedIds] = useState([]);
//     const [search, setSearch] = useState('');

//     const [sending, setSending] = useState(false);
//     const [testSending, setTestSending] = useState(false);

//     const bodyRef = useRef(null);
//     const subjectRef = useRef(null);

//     // =========================================================
//     // FETCH DEVELOPERS
//     // =========================================================
//     useEffect(() => {
//         fetchDevelopers();
//     }, []);

//     const fetchDevelopers = async () => {
//         setLoadingDevelopers(true);
//         setDeveloperError(null);

//         try {
//             const token = localStorage.getItem('access_token');

//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول لعرض المطورين');
//                 setLoadingDevelopers(false);
//                 return;
//             }

//             const response = await fetch(`${BASE}/api/developers/`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${token}`,
//                 },
//             });

//             if (!response.ok) {
//                 if (response.status === 401) {
//                     toast.error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى');
//                 } else {
//                     toast.error('فشل تحميل المطورين');
//                 }
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();
//             // Backend may return either a list or { results: [...] }
//             const list = Array.isArray(data) ? data : data.results || [];
//             setDevelopers(list);
//             setLoadingDevelopers(false);
//         } catch (err) {
//             console.error('Error fetching developers:', err);
//             setDeveloperError('فشل تحميل المطورين');
//             setLoadingDevelopers(false);
//         }
//     };

//     // =========================================================
//     // TEMPLATE PICKER
//     // =========================================================
//     const applyTemplate = (templateId) => {
//         const tpl = PRESET_TEMPLATES.find((t) => t.id === templateId);
//         if (!tpl) return;

//         setSelectedTemplateId(templateId);
//         setSubject(tpl.subject);
//         setBody(tpl.body);
//     };

//     // =========================================================
//     // SELECTION HELPERS
//     // =========================================================
//     const developersWithEmail = useMemo(
//         () =>
//             developers.filter(
//                 (d) => d.email && String(d.email).trim() !== ''
//             ),
//         [developers]
//     );

//     const filteredDevelopers = useMemo(() => {
//         const q = search.trim().toLowerCase();
//         if (!q) return developers;

//         return developers.filter((d) => {
//             const name = (d.name || '').toLowerCase();
//             const email = (d.email || '').toLowerCase();
//             const phone = (d.phone || '').toLowerCase();
//             const type = (d.type || '').toLowerCase();
//             return (
//                 name.includes(q) ||
//                 email.includes(q) ||
//                 phone.includes(q) ||
//                 type.includes(q)
//             );
//         });
//     }, [developers, search]);

//     const toggleSelect = (id) => {
//         setSelectedIds((prev) =>
//             prev.includes(id)
//                 ? prev.filter((x) => x !== id)
//                 : [...prev, id]
//         );
//     };

//     const selectAll = () => {
//         // Only select developers with valid email
//         setSelectedIds(developersWithEmail.map((d) => d.id));
//     };

//     const deselectAll = () => {
//         setSelectedIds([]);
//     };

//     const allWithEmailSelected =
//         developersWithEmail.length > 0 &&
//         developersWithEmail.every((d) => selectedIds.includes(d.id));

//     // =========================================================
//     // VALIDATION
//     // =========================================================
//     const canSend =
//         subject.trim().length > 0 &&
//         body.trim().length > 0 &&
//         selectedIds.length > 0 &&
//         !sending;

//     // =========================================================
//     // SEND BULK EMAIL
//     // =========================================================
//     const handleSend = async () => {
//         if (sending) return;

//         if (!subject.trim()) {
//             toast.warning('يرجى إدخال الموضوع');
//             subjectRef.current?.focus();
//             return;
//         }

//         if (!body.trim()) {
//             toast.warning('يرجى إدخال نص الرسالة');
//             bodyRef.current?.focus();
//             return;
//         }

//         if (selectedIds.length === 0) {
//             toast.warning('يرجى تحديد مطور واحد على الأقل');
//             return;
//         }

//         setSending(true);

//         try {
//             const token = localStorage.getItem('access_token');

//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول أولاً');
//                 setSending(false);
//                 return;
//             }

//             const response = await fetch(
//                 `${BASE}/api/send-email/`,
//                 {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         Authorization: `Bearer ${token}`,
//                     },
//                     body: JSON.stringify({
//                         subject: subject.trim(),
//                         message: body,
//                         recipient_ids: selectedIds,
//                     }),
//                 }
//             );

//             const data = await response.json().catch(() => ({}));

//             if (!response.ok) {
//                 // 400 — validation error
//                 if (response.status === 400) {
//                     const msgs = [];
//                     Object.keys(data).forEach((key) => {
//                         if (Array.isArray(data[key])) {
//                             msgs.push(`${key}: ${data[key].join(', ')}`);
//                         } else if (typeof data[key] === 'string') {
//                             msgs.push(`${key}: ${data[key]}`);
//                         }
//                     });
//                     toast.error(
//                         msgs.join(' | ') || 'فشل إرسال البريد الإلكتروني'
//                     );
//                     setSending(false);
//                     return;
//                 }

//                 if (response.status === 500) {
//                     toast.error(
//                         data?.detail ||
//                             'فشل إرسال البريد الإلكتروني. تحقق من إعدادات SMTP.'
//                     );
//                     setSending(false);
//                     return;
//                 }

//                 toast.error('فشل إرسال البريد الإلكتروني');
//                 setSending(false);
//                 return;
//             }

//             // Success response shape:
//             // { status, sent_count, failed_count, sent:[...], failed:[...] }
//             const sentCount = data.sent_count ?? 0;
//             const failedCount = data.failed_count ?? 0;

//             if (sentCount > 0 && failedCount === 0) {
//                 toast.success(
//                     `✅ تم إرسال ${sentCount} بريد إلكتروني بنجاح`
//                 );
//             } else if (sentCount > 0 && failedCount > 0) {
//                 toast.warning(
//                     `تم إرسال ${sentCount} بريد، وفشل ${failedCount} بريد`
//                 );
//                 console.warn('Failed recipients:', data.failed);
//             } else {
//                 toast.error('لم يتم إرسال أي بريد. تحقق من السجلات.');
//             }

//             // Clear selection after success (keep subject/body for reuse)
//             setSelectedIds([]);
//             setSending(false);
//         } catch (err) {
//             console.error('Send email error:', err);
//             toast.error('خطأ في الاتصال بالخادم');
//             setSending(false);
//         }
//     };

//     // =========================================================
//     // SEND TEST EMAIL
//     // =========================================================
//     const handleSendTest = async () => {
//         if (testSending) return;

//         setTestSending(true);

//         try {
//             const token = localStorage.getItem('access_token');

//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول أولاً');
//                 setTestSending(false);
//                 return;
//             }

//             const response = await fetch(
//                 `${BASE}/api/developers/test-email/`,
//                 {
//                     method: 'GET',
//                     headers: {
//                         Authorization: `Bearer ${token}`,
//                     },
//                 }
//             );

//             const data = await response.json().catch(() => ({}));

//             if (!response.ok || data.status === 'error') {
//                 toast.error(
//                     data?.message ||
//                         'فشل إرسال البريد الاختباري. تحقق من SMTP.'
//                 );
//                 setTestSending(false);
//                 return;
//             }

//             toast.success('✅ تم إرسال البريد الاختباري بنجاح');
//             setTestSending(false);
//         } catch (err) {
//             console.error('Send test email error:', err);
//             toast.error('خطأ في الاتصال بالخادم');
//             setTestSending(false);
//         }
//     };

//     // =========================================================
//     // RESET
//     // =========================================================
//     const handleReset = () => {
//         setSelectedTemplateId(PRESET_TEMPLATES[0].id);
//         setSubject(PRESET_TEMPLATES[0].subject);
//         setBody(PRESET_TEMPLATES[0].body);
//         setSelectedIds([]);
//         setSearch('');
//     };

//     // =========================================================
//     // RENDER
//     // =========================================================
//     return (
//         <div
//             dir="rtl"
//             className="min-h-screen bg-[#f8f7f5] py-8 px-3 sm:px-5 lg:px-8"
//         >
//             <div className="max-w-7xl mx-auto">
//                 {/* =====================================================
//                     HEADER
//                 ===================================================== */}
//                 <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
//                     <div className="text-center sm:text-right">
//                         <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-800 flex items-center justify-center sm:justify-start gap-3">
//                             <FaEnvelopeOpenText className="text-[#a47d52]" />
//                             <span>إرسال بريد إلكتروني للمطورين</span>
//                         </h1>
//                         <p className="text-sm sm:text-base text-gray-600 mt-1">
//                             اختر القالب، اكتب الرسالة، وحدّد المطورين المُستلمين
//                         </p>
//                     </div>

//                     <div className="flex items-center gap-3">
//                         <button
//                             type="button"
//                             onClick={handleSendTest}
//                             disabled={testSending || sending}
//                             className="flex items-center gap-2 bg-white border-2 border-[#a47d52]/40 text-[#a47d52] px-4 py-2.5 rounded-lg font-extrabold text-sm transition-all duration-300 hover:bg-[#a47d52]/10 hover:border-[#a47d52] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
//                             title="إرسال بريد اختباري إلى بريدك المسجل"
//                         >
//                             {testSending ? (
//                                 <>
//                                     <FaSpinner className="animate-spin" />
//                                     <span>جاري الإرسال...</span>
//                                 </>
//                             ) : (
//                                 <>
//                                     <FaFlask />
//                                     <span>بريد اختباري</span>
//                                 </>
//                             )}
//                         </button>

//                         <button
//                             type="button"
//                             onClick={handleReset}
//                             disabled={sending || testSending}
//                             className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-extrabold text-sm transition-all duration-300 hover:bg-gray-300 active:scale-95 disabled:opacity-50"
//                         >
//                             <FaTimes />
//                             <span>إعادة تعيين</span>
//                         </button>
//                     </div>
//                 </div>

//                 {/* =====================================================
//                     MAIN GRID
//                 ===================================================== */}
//                 <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
//                     {/* =================================================
//                         LEFT (form) — 3 columns
//                     ================================================= */}
//                     <div className="lg:col-span-3 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
//                         {/* Logo */}
//                         <div className="p-6 border-b border-gray-100 flex flex-col items-center justify-center bg-[#f8f7f5]">
//                             <img
//                                 src={logo}
//                                 alt="Broker City Properties"
//                                 className="h-[70px] w-auto object-contain scale-[1.6] mb-6 mt-4"
//                             />
//                             <h2 className="text-lg font-extrabold text-gray-700">
//                                 إنشاء بريد إلكتروني
//                             </h2>
//                         </div>

//                         <div className="p-6 space-y-5">
//                             {/* Template Picker */}
//                             <div>
//                                 <label className="block text-sm font-extrabold text-gray-700 mb-2">
//                                     قالب جاهز
//                                 </label>
//                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                                     {PRESET_TEMPLATES.map((tpl) => {
//                                         const active =
//                                             selectedTemplateId === tpl.id;
//                                         return (
//                                             <button
//                                                 key={tpl.id}
//                                                 type="button"
//                                                 onClick={() =>
//                                                     applyTemplate(tpl.id)
//                                                 }
//                                                 disabled={sending}
//                                                 className={`cursor-pointer text-right px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
//                                                     active
//                                                         ? 'border-[#a47d52] bg-[#a47d52]/5 shadow-md'
//                                                         : 'border-gray-200 bg-white hover:border-[#a47d52]/50'
//                                                 } disabled:opacity-60`}
//                                             >
//                                                 <span
//                                                     className={`block font-extrabold text-sm ${
//                                                         active
//                                                             ? 'text-[#a47d52]'
//                                                             : 'text-gray-700'
//                                                     }`}
//                                                 >
//                                                     {tpl.label}
//                                                 </span>
//                                             </button>
//                                         );
//                                     })}
//                                 </div>
//                             </div>

//                             {/* Subject */}
//                             <div>
//                                 <label className="block text-sm font-extrabold text-gray-700 mb-2">
//                                     الموضوع <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     ref={subjectRef}
//                                     type="text"
//                                     value={subject}
//                                     onChange={(e) => setSubject(e.target.value)}
//                                     disabled={sending}
//                                     dir="rtl"
//                                     placeholder="اكتب موضوع البريد الإلكتروني..."
//                                     className="w-full px-4 py-3 bg-white rounded-lg shadow-sm border-2 border-gray-200 focus:border-[#a47d52] focus:outline-none transition-all duration-200 text-right"
//                                     maxLength={255}
//                                 />
//                                 <div className="text-xs text-gray-400 mt-1 text-left">
//                                     {subject.length}/255
//                                 </div>
//                             </div>

//                             {/* Body */}
//                             <div>
//                                 <label className="block text-sm font-extrabold text-gray-700 mb-2">
//                                     نص الرسالة <span className="text-red-500">*</span>
//                                 </label>
//                                 <textarea
//                                     ref={bodyRef}
//                                     value={body}
//                                     onChange={(e) => setBody(e.target.value)}
//                                     disabled={sending}
//                                     dir="rtl"
//                                     rows={12}
//                                     placeholder="اكتب نص الرسالة..."
//                                     className="w-full px-4 py-3 bg-white rounded-lg shadow-sm border-2 border-gray-200 focus:border-[#a47d52] focus:outline-none transition-all duration-200 text-right resize-y leading-7 font-medium"
//                                 />
//                             </div>

//                             {/* Send Button */}
//                             <div className="pt-2">
//                                 <button
//                                     type="button"
//                                     onClick={handleSend}
//                                     disabled={!canSend}
//                                     className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-extrabold text-white transition-all duration-300 shadow-md ${
//                                         canSend
//                                             ? 'bg-[#a47d52] hover:bg-[#8a6a44] hover:scale-[1.01] hover:shadow-lg active:scale-95 cursor-pointer'
//                                             : 'bg-gray-300 cursor-not-allowed'
//                                     }`}
//                                 >
//                                     {sending ? (
//                                         <>
//                                             <FaSpinner className="animate-spin" />
//                                             <span>جاري الإرسال...</span>
//                                         </>
//                                     ) : (
//                                         <>
//                                             <FaPaperPlane />
//                                             <span>
//                                                 إرسال
//                                                 {selectedIds.length > 0 && (
//                                                     <span className="mr-2 text-white/90">
//                                                         ({selectedIds.length})
//                                                     </span>
//                                                 )}
//                                             </span>
//                                         </>
//                                     )}
//                                 </button>
//                                 {selectedIds.length === 0 && (
//                                     <p className="text-xs text-gray-500 text-center mt-2">
//                                         يرجى تحديد مطور واحد على الأقل من القائمة
//                                     </p>
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     {/* =================================================
//                         RIGHT (developers) — 2 columns
//                     ================================================= */}
//                     <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
//                         {/* Header */}
//                         <div className="p-5 border-b border-gray-100 bg-[#f8f7f5]">
//                             <div className="flex items-center justify-between mb-3">
//                                 <h2 className="text-lg font-extrabold text-gray-700 flex items-center gap-2">
//                                     <FaUserCheck className="text-[#a47d52]" />
//                                     <span>بيانات المطور</span>
//                                 </h2>
//                                 <span className="text-xs font-bold bg-[#a47d52] text-white px-3 py-1 rounded-full">
//                                     {selectedIds.length} / {developers.length}
//                                 </span>
//                             </div>

//                             {/* Search */}
//                             <div className="relative mb-3">
//                                 <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
//                                 <input
//                                     type="text"
//                                     value={search}
//                                     onChange={(e) => setSearch(e.target.value)}
//                                     placeholder="بحث بالاسم، البريد، الهاتف..."
//                                     className="w-full pr-10 pl-3 py-2.5 bg-white rounded-lg border-2 border-gray-200 focus:border-[#a47d52] focus:outline-none transition-all text-right text-sm"
//                                     dir="rtl"
//                                 />
//                             </div>

//                             {/* Bulk actions */}
//                             <div className="flex gap-2">
//                                 <button
//                                     type="button"
//                                     onClick={
//                                         allWithEmailSelected
//                                             ? deselectAll
//                                             : selectAll
//                                     }
//                                     disabled={developersWithEmail.length === 0}
//                                     className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-white border-2 border-[#a47d52]/40 text-[#a47d52] py-2 rounded-lg font-extrabold text-xs transition-all duration-300 hover:bg-[#a47d52]/10 hover:border-[#a47d52] active:scale-95 disabled:opacity-50"
//                                 >
//                                     {allWithEmailSelected ? (
//                                         <>
//                                             <FaRegSquare />
//                                             <span>إلغاء تحديد الكل</span>
//                                         </>
//                                     ) : (
//                                         <>
//                                             <FaCheckSquare />
//                                             <span>تحديد الكل</span>
//                                         </>
//                                     )}
//                                 </button>
//                             </div>
//                         </div>

//                         {/* List */}
//                         <div className="flex-1 overflow-y-auto max-h-[600px]">
//                             {loadingDevelopers ? (
//                                 <div className="flex flex-col items-center justify-center py-16 gap-3">
//                                     <FaSpinner className="animate-spin text-3xl text-[#a47d52]" />
//                                     <p className="text-sm text-gray-500 font-bold">
//                                         جاري تحميل المطورين...
//                                     </p>
//                                 </div>
//                             ) : developerError ? (
//                                 <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
//                                     <FaUserTimes className="text-4xl text-red-400" />
//                                     <p className="text-sm text-red-500 font-bold">
//                                         {developerError}
//                                     </p>
//                                     <button
//                                         onClick={fetchDevelopers}
//                                         className="text-xs bg-[#a47d52] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#8a6a44]"
//                                     >
//                                         إعادة المحاولة
//                                     </button>
//                                 </div>
//                             ) : filteredDevelopers.length === 0 ? (
//                                 <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
//                                     <FaUserTimes className="text-4xl text-gray-300" />
//                                     <p className="text-sm text-gray-500 font-bold">
//                                         لا يوجد مطورون
//                                     </p>
//                                 </div>
//                             ) : (
//                                 <table className="w-full text-right">
//                                     <thead className="bg-gray-50 sticky top-0 z-10">
//                                         <tr>
//                                             <th className="px-3 py-3 text-xs font-extrabold text-gray-600 border-b border-gray-200">
//                                                 بيانات المطور
//                                             </th>
//                                             <th className="px-3 py-3 text-xs font-extrabold text-gray-600 border-b border-gray-200 text-center w-24">
//                                                 هل ترغب بإرسالها له؟
//                                             </th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {filteredDevelopers.map((dev) => {
//                                             const hasEmail =
//                                                 dev.email &&
//                                                 String(dev.email).trim() !== '';
//                                             const isChecked =
//                                                 selectedIds.includes(dev.id);

//                                             return (
//                                                 <tr
//                                                     key={dev.id}
//                                                     className={`border-b border-gray-100 transition-colors ${
//                                                         isChecked
//                                                             ? 'bg-[#a47d52]/5'
//                                                             : 'hover:bg-gray-50'
//                                                     } ${
//                                                         !hasEmail
//                                                             ? 'opacity-50'
//                                                             : ''
//                                                     }`}
//                                                 >
//                                                     <td className="px-3 py-3">
//                                                         <div className="flex flex-col gap-0.5">
//                                                             <span className="text-sm font-extrabold text-gray-800">
//                                                                 {dev.name || 'بدون اسم'}
//                                                             </span>
//                                                             <span
//                                                                 className="text-xs text-gray-500"
//                                                                 dir="ltr"
//                                                             >
//                                                                 {dev.email || '— لا يوجد بريد —'}
//                                                             </span>
//                                                             {dev.phone && (
//                                                                 <span className="text-[11px] text-gray-400" dir="ltr">
//                                                                     {dev.phone}
//                                                                 </span>
//                                                             )}
//                                                             {dev.type && (
//                                                                 <span className="text-[11px] text-[#a47d52] font-bold">
//                                                                     {dev.type}
//                                                                 </span>
//                                                             )}
//                                                         </div>
//                                                     </td>
//                                                     <td className="px-3 py-3 text-center">
//                                                         <label
//                                                             className={`inline-flex items-center justify-center ${
//                                                                 hasEmail
//                                                                     ? 'cursor-pointer'
//                                                                     : 'cursor-not-allowed'
//                                                             }`}
//                                                         >
//                                                             <input
//                                                                 type="checkbox"
//                                                                 checked={isChecked}
//                                                                 onChange={() =>
//                                                                     hasEmail &&
//                                                                     toggleSelect(dev.id)
//                                                                 }
//                                                                 disabled={!hasEmail || sending}
//                                                                 className="w-5 h-5 cursor-pointer accent-[#a47d52]"
//                                                             />
//                                                         </label>
//                                                     </td>
//                                                 </tr>
//                                             );
//                                         })}
//                                     </tbody>
//                                 </table>
//                             )}
//                         </div>

//                         {/* Footer summary */}
//                         <div className="p-4 border-t border-gray-100 bg-gray-50">
//                             <div className="flex items-center justify-between text-xs">
//                                 <span className="text-gray-500 font-bold">
//                                     مطورون لديهم بريد إلكتروني:
//                                 </span>
//                                 <span className="font-extrabold text-[#a47d52]">
//                                     {developersWithEmail.length}
//                                 </span>
//                             </div>
//                             <div className="flex items-center justify-between text-xs mt-1">
//                                 <span className="text-gray-500 font-bold">
//                                     مُحدَّد للإرسال:
//                                 </span>
//                                 <span className="font-extrabold text-[#a47d52]">
//                                     {selectedIds.length}
//                                 </span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* =====================================================
//                     EMAIL PREVIEW FOOTER (matches voucher footer)
//                 ===================================================== */}
//                 <div className="mt-8 bg-white rounded-2xl shadow-md border border-gray-100 p-6">
//                     <p className="text-xs font-extrabold text-gray-500 mb-3 text-center">
//                         سيتم إضافة التوقيع التالي تلقائياً إلى أسفل كل رسالة:
//                     </p>
//                     <div className="voucher-footer-contact max-w-md mx-auto text-center text-xs text-gray-600 space-y-2">
//                         <div className="voucher-footer-contact-row flex items-center justify-center gap-2 flex-wrap">
//                             <span dir="ltr">
//                                 P.O.BOX : 7833 Abu Dhabi - U.A.E
//                             </span>
//                             <span>|</span>
//                             <span
//                                 className="voucher-footer-contact-ar"
//                                 dir="rtl"
//                                 lang="ar"
//                             >
//                                 ص.ب 7833 أبوظبي - الإمارات العربية المتحدة
//                             </span>
//                         </div>

//                         <div className="voucher-footer-contact-row flex items-center justify-center gap-2 flex-wrap">
//                             <span dir="ltr">+971 50 2000 195</span>
//                             <span>|</span>
//                             <span dir="ltr">☎ +971 2 6666 101</span>
//                         </div>

//                         <div
//                             className="voucher-footer-company font-extrabold text-[#a47d52] tracking-wide"
//                             dir="ltr"
//                         >
//                             BROKER CITY PROPERTIES
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default DeveloperEmail;