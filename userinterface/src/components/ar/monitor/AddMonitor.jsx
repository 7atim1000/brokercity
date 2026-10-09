import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// ---------- Agent list ----------
const AGENTS = [
    'Zakam Ahmed',
    'Mohammed Alrawi',
    'Amro Ahmed',
    'Sultan',
    'Mohammed Sabri',
    'Mohammed Elmusa',
    'Rana Ahmed',
    'Wala',
    'Nora',
    'Abdalla',
    'Ahmed Rezg',
    'Wesam Mohammed',
    'Mohammed Alahmed',
];

// ---------- Month list ----------
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// ---------- Helper: today in YYYY-MM-DD ----------
const todayISO = () => new Date().toISOString().split('T')[0];

// ---------- Helper: derive month name from date ----------
const monthFromDate = (isoDate) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    return MONTHS[d.getMonth()];
};

const AddMonitor = ({ onClose, monitorData, onSuccess }) => {
    const [formData, setFormData] = useState({
        date: todayISO(),
        month: monthFromDate(todayISO()),
        lead_no: '',
        lead_reassigned_no: '',
        agent: '',
        agent_lead_no: '',
        // ✅ Now free-text strings on the backend
        agent_contact_duration: '',
        agent_contact_comment: '',
        agent_assigned_duration: '',
        agent_reassigned_comment: '',
        draws: '',
        draws_no: '',
        draws_cause: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const dateRef = useRef(null);
    const monthRef = useRef(null);
    const leadNoRef = useRef(null);
    const leadReassignedNoRef = useRef(null);
    const agentRef = useRef(null);
    const agentLeadNoRef = useRef(null);
    const durationRef = useRef(null);
    const commentRef = useRef(null);
    const assignedDurationRef = useRef(null);
    const reassignedCommentRef = useRef(null);
    const drawsRef = useRef(null);
    const drawsNoRef = useRef(null);
    const drawsCauseRef = useRef(null);

    // ---------- Load / populate ----------
    useEffect(() => {
        if (monitorData) {
            setFormData({
                date: monitorData.date || todayISO(),
                month: monitorData.month || monthFromDate(monitorData.date) || '',
                lead_no: monitorData.lead_no ?? '',
                lead_reassigned_no: monitorData.lead_reassigned_no ?? '',
                agent: monitorData.agent || '',
                agent_lead_no: monitorData.agent_lead_no ?? '',
                // ✅ Strings now — fall back to '' if null/undefined
                agent_contact_duration: monitorData.agent_contact_duration ?? '',
                agent_contact_comment: monitorData.agent_contact_comment || '',
                agent_assigned_duration: monitorData.agent_assigned_duration ?? '',
                agent_reassigned_comment: monitorData.agent_reassigned_comment || '',
                draws: monitorData.draws ?? '',
                draws_no: monitorData.draws_no ?? '',
                draws_cause: monitorData.draws_cause || '',
            });
        }
        if (dateRef.current) dateRef.current.focus();
    }, [monitorData]);

    // ---------- Auto sync month with date ----------
    useEffect(() => {
        if (formData.date) {
            const m = monthFromDate(formData.date);
            if (m && m !== formData.month) {
                setFormData(prev => ({ ...prev, month: m }));
            }
        }
    }, [formData.date]);

    // ---------- Field helpers ----------
    const getFieldBorderColor = (isFilled, hasError) => {
        if (hasError) return '#ef4444';
        if (isFilled) return '#a47d52';
        return '#ef4444';
    };

    const getFieldIndicatorColor = (isFilled, hasError) => {
        if (hasError) return 'bg-red-500';
        if (isFilled) return 'bg-[#a47d52]';
        return 'bg-red-500';
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleKeyDown = (e, nextRef) => {
        if (e.key === 'Enter' && nextRef && nextRef.current) {
            e.preventDefault();
            nextRef.current.focus();
        }
    };

    // ---------- Submit ----------
    const handleSubmit = async (e) => {
        e.preventDefault();

        // All fields optional — no required validation

        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('يرجى تسجيل الدخول');
                setLoading(false);
                return;
            }

            const url = monitorData
                ? `${BASE}/api/monitor/${monitorData.id}/`
                : `${BASE}/api/monitor/create/`;

            const method = monitorData ? 'PUT' : 'POST';

            const toIntOrNull = (v) =>
                v === '' || v === null || v === undefined
                    ? null
                    : parseInt(v, 10);
            const toFloatOrNull = (v) =>
                v === '' || v === null || v === undefined
                    ? null
                    : parseFloat(v);
            // ✅ New helper — keep strings as-is, empty → null
            const toStrOrNull = (v) =>
                v === '' || v === null || v === undefined
                    ? null
                    : String(v);

            const requestData = {
                date: formData.date || null,
                month: formData.month || null,
                lead_no: toIntOrNull(formData.lead_no),
                lead_reassigned_no: toIntOrNull(formData.lead_reassigned_no),
                agent: formData.agent || null,
                agent_lead_no: toIntOrNull(formData.agent_lead_no),
                // ✅ These two are strings now (was toIntOrNull before)
                agent_contact_duration: toStrOrNull(formData.agent_contact_duration),
                agent_contact_comment: formData.agent_contact_comment || null,
                agent_assigned_duration: toStrOrNull(formData.agent_assigned_duration),
                agent_reassigned_comment: formData.agent_reassigned_comment || null,
                draws: toFloatOrNull(formData.draws),
                draws_no: toIntOrNull(formData.draws_no),
                draws_cause: formData.draws_cause || null,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestData),
            });

            const responseText = await response.text();
            let data;
            try { data = JSON.parse(responseText); }
            catch { data = { detail: responseText }; }

            if (!response.ok) {
                let errorMessage = 'حدث خطأ أثناء حفظ السجل';
                if (data && typeof data === 'object') {
                    errorMessage = Object.entries(data)
                        .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
                        .join('; ') || errorMessage;
                }
                toast.error(`❌ ${errorMessage}`);
                setLoading(false);
                return;
            }

            toast.success(monitorData ? '✅ تم تحديث السجل' : '✅ تم إضافة السجل بنجاح');
            if (onSuccess) onSuccess(data);
            onClose();
        } catch (err) {
            console.error('Error saving monitor:', err);
            toast.error('خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    // ---------- Reusable input style ----------
    const inputStyle = (isFilled, hasError) => ({
        borderTopColor: 'transparent',
        borderBottomColor: 'white',
        borderLeftColor: 'transparent',
        borderRightColor: getFieldBorderColor(isFilled, hasError),
        borderWidth: '2px',
        borderStyle: 'solid',
        boxShadow: hasError
            ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
            : isFilled
                ? '0 0 0 3px rgba(164, 125, 82, 0.1)'
                : '0 0 0 3px rgba(239, 68, 68, 0.1)',
    });

    const isFilled = (v) => v !== '' && v !== null && v !== undefined;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-[#f8f7f5] z-10">
                    <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
                        {monitorData ? 'تعديل سجل مراقبة' : 'إضافة سجل مراقبة جديد'}
                    </h3>
                    <button
                        className="text-red-600 cursor-pointer hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
                        onClick={onClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit}>

                        {/* ================= ROW 1 : date + month + lead_no ================= */}
                        <div className="flex flex-row flex-wrap gap-4 mb-5">
                            {/* Date */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    التاريخ
                                </label>
                                <div className="relative">
                                    <input
                                        ref={dateRef}
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleChange('date', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, monthRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={inputStyle(isFilled(formData.date), errors.date)}
                                        disabled={loading}
                                    />
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.date), errors.date)}`} />
                                </div>
                                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                            </div>

                            {/* Month */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    الشهر
                                </label>
                                <div className="relative">
                                    <select
                                        ref={monthRef}
                                        value={formData.month}
                                        onChange={(e) => handleChange('month', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, leadNoRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right appearance-none"
                                        style={inputStyle(isFilled(formData.month), errors.month)}
                                        disabled={loading}
                                        dir="rtl"
                                    >
                                        <option value="">اختر الشهر</option>
                                        {MONTHS.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.month), errors.month)}`} />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {errors.month && <p className="text-red-500 text-sm mt-1">{errors.month}</p>}
                            </div>

                            {/* Lead No */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Lead No</label>
                                <div className="relative">
                                    <input
                                        ref={leadNoRef}
                                        type="number"
                                        value={formData.lead_no}
                                        onChange={(e) => handleChange('lead_no', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, leadReassignedNoRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={inputStyle(isFilled(formData.lead_no), errors.lead_no)}
                                        placeholder="أدخل Lead No"
                                        disabled={loading}
                                        dir="rtl"
                                    />
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.lead_no), errors.lead_no)}`} />
                                </div>
                            </div>
                        </div>

                        {/* ================= ROW 2 : lead_reassigned_no + agent + agent_lead_no ================= */}
                        <div className="flex flex-row flex-wrap gap-4 mb-5">
                            {/* Lead Reassigned No */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Lead Reassigned No</label>
                                <div className="relative">
                                    <input
                                        ref={leadReassignedNoRef}
                                        type="number"
                                        value={formData.lead_reassigned_no}
                                        onChange={(e) => handleChange('lead_reassigned_no', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, agentRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={inputStyle(isFilled(formData.lead_reassigned_no), errors.lead_reassigned_no)}
                                        placeholder="أدخل Lead Reassigned No"
                                        disabled={loading}
                                        dir="rtl"
                                    />
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.lead_reassigned_no), errors.lead_reassigned_no)}`} />
                                </div>
                            </div>

                            {/* Agent */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    الوكيل
                                </label>
                                <div className="relative">
                                    <select
                                        ref={agentRef}
                                        value={formData.agent}
                                        onChange={(e) => handleChange('agent', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, agentLeadNoRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right appearance-none"
                                        style={inputStyle(isFilled(formData.agent), errors.agent)}
                                        disabled={loading}
                                        dir="rtl"
                                    >
                                        <option value="">اختر الوكيل</option>
                                        {AGENTS.map((a) => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </select>
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.agent), errors.agent)}`} />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {errors.agent && <p className="text-red-500 text-sm mt-1">{errors.agent}</p>}
                            </div>

                            {/* Agent Lead No */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Agent Lead No</label>
                                <div className="relative">
                                    <input
                                        ref={agentLeadNoRef}
                                        type="number"
                                        value={formData.agent_lead_no}
                                        onChange={(e) => handleChange('agent_lead_no', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, durationRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={inputStyle(isFilled(formData.agent_lead_no), errors.agent_lead_no)}
                                        placeholder="أدخل Agent Lead No"
                                        disabled={loading}
                                        dir="rtl"
                                    />
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.agent_lead_no), errors.agent_lead_no)}`} />
                                </div>
                            </div>
                        </div>

                        {/* ================= ROW 3 : agent_contact_duration + agent_contact_comment ================= */}
                        <div className="flex flex-row flex-wrap gap-4 mb-5">
                            {/* Duration — ✅ now text input */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">مدة الاتصال</label>
                                <div className="relative">
                                    <input
                                        ref={durationRef}
                                        type="text"
                                        value={formData.agent_contact_duration}
                                        onChange={(e) => handleChange('agent_contact_duration', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, commentRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={inputStyle(isFilled(formData.agent_contact_duration), errors.agent_contact_duration)}
                                        placeholder="مده التواصل (نص حر)"
                                        disabled={loading}
                                        dir="rtl"
                                    />
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.agent_contact_duration), errors.agent_contact_duration)}`} />
                                </div>
                            </div>

                            {/* Agent Contact Comment */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">تعليق على مده التواصل</label>
                                <div className="relative">
                                    <input
                                        ref={commentRef}
                                        type="text"
                                        value={formData.agent_contact_comment}
                                        onChange={(e) => handleChange('agent_contact_comment', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, assignedDurationRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={inputStyle(isFilled(formData.agent_contact_comment), errors.agent_contact_comment)}
                                        placeholder="تعليق ع مده التواصل"
                                        disabled={loading}
                                        dir="rtl"
                                    />
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.agent_contact_comment), errors.agent_contact_comment)}`} />
                                </div>
                            </div>
                        </div>

                        {/* ================= ROW 3B : agent_assigned_duration + agent_reassigned_comment ================= */}
                        <div className="flex flex-row flex-wrap gap-4 mb-5">
                            {/* Agent Assigned Duration — ✅ now text input */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">مدة التعيين</label>
                                <div className="relative">
                                    <input
                                        ref={assignedDurationRef}
                                        type="text"
                                        value={formData.agent_assigned_duration}
                                        onChange={(e) => handleChange('agent_assigned_duration', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, reassignedCommentRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={inputStyle(isFilled(formData.agent_assigned_duration), errors.agent_assigned_duration)}
                                        placeholder="مده التعيين (نص حر)"
                                        disabled={loading}
                                        dir="rtl"
                                    />
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.agent_assigned_duration), errors.agent_assigned_duration)}`} />
                                </div>
                            </div>

                            {/* Agent Reassigned Comment */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">تعليق على إعادة التعيين</label>
                                <div className="relative">
                                    <input
                                        ref={reassignedCommentRef}
                                        type="text"
                                        value={formData.agent_reassigned_comment}
                                        onChange={(e) => handleChange('agent_reassigned_comment', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, drawsNoRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={inputStyle(isFilled(formData.agent_reassigned_comment), errors.agent_reassigned_comment)}
                                        placeholder="تعليق ع اعاده التعيين"
                                        disabled={loading}
                                        dir="rtl"
                                    />
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.agent_reassigned_comment), errors.agent_reassigned_comment)}`} />
                                </div>
                            </div>
                        </div>

                        {/* ================= ROW 4 : draws_no + draws_cause ================= */}
                        <div className="flex flex-row flex-wrap gap-4 mb-5">
                            {/* Draws No */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Draws No</label>
                                <div className="relative">
                                    <input
                                        ref={drawsNoRef}
                                        type="number"
                                        value={formData.draws_no}
                                        onChange={(e) => handleChange('draws_no', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, drawsCauseRef)}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={inputStyle(isFilled(formData.draws_no), errors.draws_no)}
                                        placeholder="أدخل Draws No"
                                        disabled={loading}
                                        dir="rtl"
                                    />
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.draws_no), errors.draws_no)}`} />
                                </div>
                            </div>

                            {/* Draws Cause */}
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">سبب الـ Draws</label>
                                <div className="relative">
                                    <input
                                        ref={drawsCauseRef}
                                        type="text"
                                        value={formData.draws_cause}
                                        onChange={(e) => handleChange('draws_cause', e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }
                                        }}
                                        className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
                                        style={inputStyle(isFilled(formData.draws_cause), errors.draws_cause)}
                                        placeholder="أدخل السبب"
                                        disabled={loading}
                                        dir="rtl"
                                    />
                                    <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.draws_cause), errors.draws_cause)}`} />
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-8 border-t border-gray-200 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-3 cursor-pointer font-extrabold bg-[#a47d52] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 disabled:opacity-50"
                            >
                                {loading ? 'جاري الحفظ...' : (monitorData ? 'تحديث' : 'إضافة')}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 cursor-pointer font-extrabold bg-gray-300 text-red-600 px-6 py-3 rounded-lg transition-all duration-300 hover:bg-gray-400"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddMonitor;




// import React, { useState, useEffect, useRef } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// // ---------- Agent list ----------
// const AGENTS = [
//     'Zakam Ahmed',
//     'Mohammed Alrawi',
//     'Amro Ahmed',
//     'Sultan',
//     'Mohammed Sabri',
//     'Rana Ahmed',
//     'Wala',
//     'Nora',
//     'Abdalla',
//     'Ahmed Rezg',
//     'Wesam Mohammed',
//     'Mohammed Alahmed',
// ];

// // ---------- Month list ----------
// const MONTHS = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December',
// ];

// // ---------- Helper: today in YYYY-MM-DD ----------
// const todayISO = () => new Date().toISOString().split('T')[0];

// // ---------- Helper: derive month name from date ----------
// const monthFromDate = (isoDate) => {
//     if (!isoDate) return '';
//     const d = new Date(isoDate);
//     if (isNaN(d.getTime())) return '';
//     return MONTHS[d.getMonth()];
// };

// const AddMonitor = ({ onClose, monitorData, onSuccess }) => {
//     const [formData, setFormData] = useState({
//         date: todayISO(),
//         month: monthFromDate(todayISO()),
//         lead_no: '',
//         lead_reassigned_no: '',
//         agent: '',
//         agent_lead_no: '',
//         agent_contact_duration: '',
//         agent_contact_comment: '',
//         draws: '',
//         draws_no: '',
//         draws_cause: '',
//     });
//     const [loading, setLoading] = useState(false);
//     const [errors, setErrors] = useState({});

//     const dateRef = useRef(null);
//     const monthRef = useRef(null);
//     const leadNoRef = useRef(null);
//     const leadReassignedNoRef = useRef(null);
//     const agentRef = useRef(null);
//     const agentLeadNoRef = useRef(null);
//     const durationRef = useRef(null);
//     const commentRef = useRef(null);
//     const drawsRef = useRef(null);
//     const drawsNoRef = useRef(null);
//     const drawsCauseRef = useRef(null);

//     // ---------- Load / populate ----------
//     useEffect(() => {
//         if (monitorData) {
//             setFormData({
//                 date: monitorData.date || todayISO(),
//                 month: monitorData.month || monthFromDate(monitorData.date) || '',
//                 lead_no: monitorData.lead_no ?? '',
//                 lead_reassigned_no: monitorData.lead_reassigned_no ?? '',
//                 agent: monitorData.agent || '',
//                 agent_lead_no: monitorData.agent_lead_no ?? '',
//                 agent_contact_duration: monitorData.agent_contact_duration ?? '',
//                 agent_contact_comment: monitorData.agent_contact_comment || '',
//                 draws: monitorData.draws ?? '',
//                 draws_no: monitorData.draws_no ?? '',
//                 draws_cause: monitorData.draws_cause || '',
//             });
//         }
//         if (dateRef.current) dateRef.current.focus();
//     }, [monitorData]);

//     // ---------- Auto sync month with date ----------
//     useEffect(() => {
//         if (formData.date) {
//             const m = monthFromDate(formData.date);
//             if (m && m !== formData.month) {
//                 setFormData(prev => ({ ...prev, month: m }));
//             }
//         }
//     }, [formData.date]);

//     // ---------- Field helpers ----------
//     const getFieldBorderColor = (isFilled, hasError) => {
//         if (hasError) return '#ef4444';
//         if (isFilled) return '#a47d52';
//         return '#ef4444';
//     };

//     const getFieldIndicatorColor = (isFilled, hasError) => {
//         if (hasError) return 'bg-red-500';
//         if (isFilled) return 'bg-[#a47d52]';
//         return 'bg-red-500';
//     };

//     const handleChange = (field, value) => {
//         setFormData(prev => ({ ...prev, [field]: value }));
//         setErrors(prev => ({ ...prev, [field]: '' }));
//     };

//     const handleKeyDown = (e, nextRef) => {
//         if (e.key === 'Enter' && nextRef && nextRef.current) {
//             e.preventDefault();
//             nextRef.current.focus();
//         }
//     };

//     // ---------- Submit ----------
//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         // All fields optional — no required validation

//         setLoading(true);
//         try {
//             const token = localStorage.getItem('access_token');
//             if (!token) {
//                 toast.error('يرجى تسجيل الدخول');
//                 setLoading(false);
//                 return;
//             }

//             const url = monitorData
//                 ? `${BASE}/api/monitor/${monitorData.id}/`
//                 : `${BASE}/api/monitor/create/`;

//             const method = monitorData ? 'PUT' : 'POST';

//             const toIntOrNull = (v) =>
//                 v === '' || v === null || v === undefined
//                     ? null
//                     : parseInt(v, 10);
//             const toFloatOrNull = (v) =>
//                 v === '' || v === null || v === undefined
//                     ? null
//                     : parseFloat(v);

//             const requestData = {
//                 date: formData.date || null,
//                 month: formData.month || null,
//                 lead_no: toIntOrNull(formData.lead_no),
//                 lead_reassigned_no: toIntOrNull(formData.lead_reassigned_no),
//                 agent: formData.agent || null,
//                 agent_lead_no: toIntOrNull(formData.agent_lead_no),
//                 agent_contact_duration: toIntOrNull(formData.agent_contact_duration),
//                 agent_contact_comment: formData.agent_contact_comment || null,
//                 draws: toFloatOrNull(formData.draws),
//                 draws_no: toIntOrNull(formData.draws_no),
//                 draws_cause: formData.draws_cause || null,
//             };

//             const response = await fetch(url, {
//                 method,
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`,
//                 },
//                 body: JSON.stringify(requestData),
//             });

//             const responseText = await response.text();
//             let data;
//             try { data = JSON.parse(responseText); }
//             catch { data = { detail: responseText }; }

//             if (!response.ok) {
//                 let errorMessage = 'حدث خطأ أثناء حفظ السجل';
//                 if (data && typeof data === 'object') {
//                     errorMessage = Object.entries(data)
//                         .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
//                         .join('; ') || errorMessage;
//                 }
//                 toast.error(`❌ ${errorMessage}`);
//                 setLoading(false);
//                 return;
//             }

//             toast.success(monitorData ? '✅ تم تحديث السجل' : '✅ تم إضافة السجل بنجاح');
//             if (onSuccess) onSuccess(data);
//             onClose();
//         } catch (err) {
//             console.error('Error saving monitor:', err);
//             toast.error('خطأ في الاتصال بالخادم');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ---------- Reusable input style ----------
//     const inputStyle = (isFilled, hasError) => ({
//         borderTopColor: 'transparent',
//         borderBottomColor: 'white',
//         borderLeftColor: 'transparent',
//         borderRightColor: getFieldBorderColor(isFilled, hasError),
//         borderWidth: '2px',
//         borderStyle: 'solid',
//         boxShadow: hasError
//             ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
//             : isFilled
//                 ? '0 0 0 3px rgba(164, 125, 82, 0.1)'
//                 : '0 0 0 3px rgba(239, 68, 68, 0.1)',
//     });

//     const isFilled = (v) => v !== '' && v !== null && v !== undefined;

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//             <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
//                 {/* Header */}
//                 <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-[#f8f7f5] z-10">
//                     <h3 className="text-xl md:text-2xl font-extrabold text-gray-800">
//                         {monitorData ? 'تعديل سجل مراقبة' : 'إضافة سجل مراقبة جديد'}
//                     </h3>
//                     <button
//                         className="text-red-600 cursor-pointer hover:text-gray-600 text-2xl font-light hover:rotate-90 transition-transform"
//                         onClick={onClose}
//                         disabled={loading}
//                     >
//                         ✕
//                     </button>
//                 </div>

//                 <div className="p-6">
//                     <form onSubmit={handleSubmit}>

//                         {/* ================= ROW 1 : date + month + lead_no ================= */}
//                         <div className="flex flex-row flex-wrap gap-4 mb-5">
//                             {/* Date */}
//                             <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                                     التاريخ
//                                 </label>
//                                 <div className="relative">
//                                     <input
//                                         ref={dateRef}
//                                         type="date"
//                                         value={formData.date}
//                                         onChange={(e) => handleChange('date', e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(e, monthRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={inputStyle(isFilled(formData.date), errors.date)}
//                                         disabled={loading}
//                                     />
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.date), errors.date)}`} />
//                                 </div>
//                                 {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
//                             </div>

//                             {/* Month */}
//                             <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                                     الشهر
//                                 </label>
//                                 <div className="relative">
//                                     <select
//                                         ref={monthRef}
//                                         value={formData.month}
//                                         onChange={(e) => handleChange('month', e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(e, leadNoRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right appearance-none"
//                                         style={inputStyle(isFilled(formData.month), errors.month)}
//                                         disabled={loading}
//                                         dir="rtl"
//                                     >
//                                         <option value="">اختر الشهر</option>
//                                         {MONTHS.map((m) => (
//                                             <option key={m} value={m}>{m}</option>
//                                         ))}
//                                     </select>
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.month), errors.month)}`} />
//                                     <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
//                                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                                         </svg>
//                                     </div>
//                                 </div>
//                                 {errors.month && <p className="text-red-500 text-sm mt-1">{errors.month}</p>}
//                             </div>

//                             {/* Lead No */}
//                             <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">Lead No</label>
//                                 <div className="relative">
//                                     <input
//                                         ref={leadNoRef}
//                                         type="number"
//                                         value={formData.lead_no}
//                                         onChange={(e) => handleChange('lead_no', e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(e, leadReassignedNoRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={inputStyle(isFilled(formData.lead_no), errors.lead_no)}
//                                         placeholder="أدخل Lead No"
//                                         disabled={loading}
//                                         dir="rtl"
//                                     />
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.lead_no), errors.lead_no)}`} />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* ================= ROW 2 : lead_reassigned_no + agent + agent_lead_no ================= */}
//                         <div className="flex flex-row flex-wrap gap-4 mb-5">
//                             {/* Lead Reassigned No */}
//                             <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">Lead Reassigned No</label>
//                                 <div className="relative">
//                                     <input
//                                         ref={leadReassignedNoRef}
//                                         type="number"
//                                         value={formData.lead_reassigned_no}
//                                         onChange={(e) => handleChange('lead_reassigned_no', e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(e, agentRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={inputStyle(isFilled(formData.lead_reassigned_no), errors.lead_reassigned_no)}
//                                         placeholder="أدخل Lead Reassigned No"
//                                         disabled={loading}
//                                         dir="rtl"
//                                     />
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.lead_reassigned_no), errors.lead_reassigned_no)}`} />
//                                 </div>
//                             </div>

//                             {/* Agent */}
//                             <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                                     الوكيل
//                                 </label>
//                                 <div className="relative">
//                                     <select
//                                         ref={agentRef}
//                                         value={formData.agent}
//                                         onChange={(e) => handleChange('agent', e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(e, agentLeadNoRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right appearance-none"
//                                         style={inputStyle(isFilled(formData.agent), errors.agent)}
//                                         disabled={loading}
//                                         dir="rtl"
//                                     >
//                                         <option value="">اختر الوكيل</option>
//                                         {AGENTS.map((a) => (
//                                             <option key={a} value={a}>{a}</option>
//                                         ))}
//                                     </select>
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.agent), errors.agent)}`} />
//                                     <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
//                                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                                         </svg>
//                                     </div>
//                                 </div>
//                                 {errors.agent && <p className="text-red-500 text-sm mt-1">{errors.agent}</p>}
//                             </div>

//                             {/* Agent Lead No */}
//                             <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">Agent Lead No</label>
//                                 <div className="relative">
//                                     <input
//                                         ref={agentLeadNoRef}
//                                         type="number"
//                                         value={formData.agent_lead_no}
//                                         onChange={(e) => handleChange('agent_lead_no', e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(e, durationRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={inputStyle(isFilled(formData.agent_lead_no), errors.agent_lead_no)}
//                                         placeholder="أدخل Agent Lead No"
//                                         disabled={loading}
//                                         dir="rtl"
//                                     />
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.agent_lead_no), errors.agent_lead_no)}`} />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* ================= ROW 3 : agent_contact_duration + agent_contact_comment + draws ================= */}
//                         <div className="flex flex-row flex-wrap gap-4 mb-5">
//                             {/* Duration */}
//                             <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">مدة الاتصال (دقيقه)</label>
//                                 <div className="relative">
//                                     <input
//                                         ref={durationRef}
//                                         type="number"
//                                         value={formData.agent_contact_duration}
//                                         onChange={(e) => handleChange('agent_contact_duration', e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(e, commentRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={inputStyle(isFilled(formData.agent_contact_duration), errors.agent_contact_duration)}
//                                         placeholder="مده التواصل"
//                                         disabled={loading}
//                                         dir="rtl"
//                                     />
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.agent_contact_duration), errors.agent_contact_duration)}`} />
//                                 </div>
//                             </div>

//                             {/* Agent Contact Comment */}
//                             <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">تعليق على مده التواصل</label>
//                                 <div className="relative">
//                                     <input
//                                         ref={commentRef}
//                                         type="text"
//                                         value={formData.agent_contact_comment}
//                                         onChange={(e) => handleChange('agent_contact_comment', e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(e, drawsRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={inputStyle(isFilled(formData.agent_contact_comment), errors.agent_contact_comment)}
//                                         placeholder="تعليق ع مده التواصل"
//                                         disabled={loading}
//                                         dir="rtl"
//                                     />
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.agent_contact_comment), errors.agent_contact_comment)}`} />
//                                 </div>
//                             </div>

//                             {/* Draws */}
//                             {/* <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">Draws</label>
//                                 <div className="relative">
//                                     <input
//                                         ref={drawsRef}
//                                         type="number"
//                                         step="0.01"
//                                         value={formData.draws}
//                                         onChange={(e) => handleChange('draws', e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(e, drawsNoRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={inputStyle(isFilled(formData.draws), errors.draws)}
//                                         placeholder="أدخل Draws"
//                                         disabled={loading}
//                                         dir="rtl"
//                                     />
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.draws), errors.draws)}`} />
//                                 </div>
//                             </div> */}
//                         </div>

//                         {/* ================= ROW 4 : draws_no + draws_cause ================= */}
//                         <div className="flex flex-row flex-wrap gap-4 mb-5">
//                             {/* Draws No */}
//                             <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">Draws No</label>
//                                 <div className="relative">
//                                     <input
//                                         ref={drawsNoRef}
//                                         type="number"
//                                         value={formData.draws_no}
//                                         onChange={(e) => handleChange('draws_no', e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(e, drawsCauseRef)}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={inputStyle(isFilled(formData.draws_no), errors.draws_no)}
//                                         placeholder="أدخل Draws No"
//                                         disabled={loading}
//                                         dir="rtl"
//                                     />
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.draws_no), errors.draws_no)}`} />
//                                 </div>
//                             </div>

//                             {/* Draws Cause */}
//                             <div className="flex-1 min-w-[220px]">
//                                 <label className="block text-sm font-semibold text-gray-700 mb-2">سبب الـ Draws</label>
//                                 <div className="relative">
//                                     <input
//                                         ref={drawsCauseRef}
//                                         type="text"
//                                         value={formData.draws_cause}
//                                         onChange={(e) => handleChange('draws_cause', e.target.value)}
//                                         onKeyDown={(e) => {
//                                             if (e.key === 'Enter') {
//                                                 e.preventDefault();
//                                                 handleSubmit(e);
//                                             }
//                                         }}
//                                         className="w-full px-4 py-3 bg-white rounded-sm shadow-lg focus:outline-none transition-all duration-300 text-right"
//                                         style={inputStyle(isFilled(formData.draws_cause), errors.draws_cause)}
//                                         placeholder="أدخل السبب"
//                                         disabled={loading}
//                                         dir="rtl"
//                                     />
//                                     <div className={`absolute right-0 top-0 h-full w-1 rounded-r-lg transition-all duration-300 ${getFieldIndicatorColor(isFilled(formData.draws_cause), errors.draws_cause)}`} />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Buttons */}
//                         <div className="flex gap-3 mt-8 border-t border-gray-200 pt-6">
//                             <button
//                                 type="submit"
//                                 disabled={loading}
//                                 className="flex-3 cursor-pointer font-extrabold bg-[#a47d52] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-[#8a6a44] hover:scale-105 disabled:opacity-50"
//                             >
//                                 {loading ? 'جاري الحفظ...' : (monitorData ? 'تحديث' : 'إضافة')}
//                             </button>
//                             <button
//                                 type="button"
//                                 onClick={onClose}
//                                 disabled={loading}
//                                 className="flex-1 cursor-pointer font-extrabold bg-gray-300 text-red-600 px-6 py-3 rounded-lg transition-all duration-300 hover:bg-gray-400"
//                             >
//                                 إلغاء
//                             </button>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default AddMonitor;