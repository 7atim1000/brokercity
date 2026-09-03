// npm install recharts chart.js react-chartjs-2 --force
import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaMoneyBillWave, 
  FaArrowUp, 
  FaArrowDown, 
  FaBalanceScale,
  FaExchangeAlt,
  FaSpinner,
  FaCalendarAlt,
  FaDownload,
  FaUsers,
  FaUserCheck,
  FaUserClock,
  FaUserSlash,
  FaChartLine,
  FaUserTie,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaCity,
  FaHome,
  FaBuilding,
  FaUserPlus,

} from 'react-icons/fa';
import { GiChart } from "react-icons/gi";

import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_deposits: 0,
    total_withdraws: 0,
    total_balance: 0,
    total_transactions: 0,
    deposit_count: 0,
    withdraw_count: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);

  // Mock data for employee stats
  const [employeeStats] = useState({
    total_employees: 45,
    active_employees: 28,
    on_break_employees: 8,
    logged_out_employees: 9,
    agent_performance: 85,
  });

  // Mock data for agent performance chart with evaluation
  const agentPerformanceData = [
    { name: 'أحمد', leads: 95, conversions: 80 },
    { name: 'محمد', leads: 88, conversions: 75 },
    { name: 'سارة', leads: 5, conversions: 10 },
    { name: 'خالد', leads: 78, conversions: 70 },
    { name: 'نورة', leads: 85, conversions: 78 },
    { name: 'علي', leads: 6, conversions: 15 },
    { name: 'فاطمة', leads: 82, conversions: 76 },
  ];

  // Function to get evaluation based on leads count
  const getEvaluation = (leads) => {
    if (leads >= 90) return { 
      text: 'ممتاز جدا', 
      color: 'bg-purple-100 text-purple-800',
      borderColor: 'border-purple-500',
      icon: '⭐⭐⭐⭐⭐',
      stars: 5
    };
    if (leads >= 80) return { 
      text: 'ممتاز', 
      color: 'bg-green-100 text-green-800',
      borderColor: 'border-green-500',
      icon: '⭐⭐⭐⭐',
      stars: 4
    };
    if (leads >= 70) return { 
      text: 'جيد جدا', 
      color: 'bg-blue-100 text-blue-800',
      borderColor: 'border-blue-500',
      icon: '⭐⭐⭐',
      stars: 3
    };
    if (leads >= 60) return { 
      text: 'جيد', 
      color: 'bg-cyan-100 text-cyan-800',
      borderColor: 'border-cyan-500',
      icon: '⭐⭐',
      stars: 2
    };
    if (leads >= 40) return { 
      text: 'مقبول', 
      color: 'bg-yellow-100 text-yellow-800',
      borderColor: 'border-yellow-500',
      icon: '⭐',
      stars: 1
    };
    return { 
      text: 'ضعيف', 
      color: 'bg-red-100 text-red-800',
      borderColor: 'border-red-500',
      icon: '⭐',
      stars: 0.5
    };
  };

  // Get evaluation for each employee
  const employeeEvaluations = agentPerformanceData.map(emp => ({
    ...emp,
    evaluation: getEvaluation(emp.leads)
  }));

  // Render stars function
  const renderStars = (stars) => {
    const fullStars = Math.floor(stars);
    const hasHalfStar = stars % 1 !== 0;
    const emptyStars = 5 - Math.ceil(stars);
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-yellow-400 text-xs" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-xs" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="text-gray-300 text-xs" />
        ))}
      </div>
    );
  };

  // Custom Tooltip for BarChart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const evaluation = getEvaluation(data.leads);
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800">{label}</p>
          <p className="text-sm text-gray-600">Leads عدد: <span className="font-bold">{data.leads}</span></p>
          <p className="text-sm text-gray-600">الأداء: <span className="font-bold">{data.conversions}%</span></p>
          <p className="text-sm mt-1">
            التقييم: 
            <span className={`mr-1 px-2 py-0.5 rounded-full text-xs font-bold ${evaluation.color}`}>
              {evaluation.text}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Legend for BarChart
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex justify-center gap-6 mt-2">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('يرجى تسجيل الدخول');
        setLoading(false);
        return;
      }

      // Fetch summary
      const summaryRes = await fetch(
        `${BASE}/api/dashboard/summary/?days=${days}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (summaryRes.status === 401) {
        toast.error('⚠️ انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        setLoading(false);
        return;
      }
      
      if (!summaryRes.ok) throw new Error('Failed to fetch summary');
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      // Fetch chart data
      const chartRes = await fetch(
        `${BASE}/api/dashboard/chart/?period=${period}&days=${days}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (chartRes.status === 401) {
        toast.error('⚠️ انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        setLoading(false);
        return;
      }
      
      if (!chartRes.ok) {
        setChartData([]);
        throw new Error('Failed to fetch chart data');
      }
      
      const chartData = await chartRes.json();
      
      if (chartData && chartData.labels && Array.isArray(chartData.labels)) {
        const formattedChartData = chartData.labels.map((label, index) => ({
          name: label,
          deposits: chartData.deposits?.[index] || 0,
          withdraws: chartData.withdraws?.[index] || 0,
          balance: chartData.balance?.[index] || 0,
        }));
        setChartData(formattedChartData);
      } else {
        console.warn('Unexpected chart data format:', chartData);
        setChartData([]);
      }

      // Fetch recent transactions
      const recentRes = await fetch(
        `${BASE}/api/dashboard/recent/?limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (recentRes.status === 401) {
        toast.error('⚠️ انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        setLoading(false);
        return;
      }
      
      if (!recentRes.ok) throw new Error('Failed to fetch recent transactions');
      const recentData = await recentRes.json();
      setRecentTransactions(Array.isArray(recentData) ? recentData : []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('❌ حدث خطأ أثناء تحميل بيانات لوحة التحكم');
      setChartData([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period, days]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor, subtitle }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-4 rounded-full ${bgColor}`}>
          <Icon className={`text-2xl ${color}`} />
        </div>
      </div>
    </div>
  );
  
  // Employee Stat Card Component
  const EmployeeStatCard = ({ title, value, icon: Icon, color, bgColor, subtitle, progress }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {progress !== undefined && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}%</p>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-full ${bgColor}`}>
          <Icon className={`text-2xl ${color}`} />
        </div>
      </div>
    </div>
  );

  // Employee Evaluation Card Component
  const EmployeeEvaluationCard = ({ employee }) => {
    const { name, leads, conversions, evaluation } = employee;
    
    return (
      <div className={`bg-white rounded-xs shadow-md p-4 border-r-4 ${evaluation.borderColor} hover:shadow-lg transition-shadow`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <FaUserTie className="text-gray-600 text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${evaluation.color}`}>
                  {evaluation.text}
                </span>
              </div>
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              {renderStars(evaluation.stars)}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm   text-gray-500">
              <span>Leads: {leads}</span>
              <span>|</span>
              <span>أداء: {conversions}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // Broker Activity Stat Card Component
  // Mock data for Broker City Activities
  const [brokerActivities] = useState({
    properties_for_sale: 44,
    properties_for_rent: 99,
    total_clients: 5000,
    potential_clients: 3000,
  });

  const BrokerActivityCard = ({ title, value, icon: Icon, color, bgColor, evaluation, subtitle }) => {
    const evaluationColors = {
      'ممتاز جدا': 'bg-purple-100 text-purple-800',
      'ممتاز': 'bg-green-100 text-green-800',
      'جيد جدا': 'bg-blue-100 text-blue-800',
      'جيد': 'bg-cyan-100 text-cyan-800',
      'مقبول': 'bg-yellow-100 text-yellow-800',
      'ضعيف': 'bg-red-100 text-red-800',
      'perfect': 'bg-green-100 text-green-800',
    };

    const evaluationColor = evaluationColors[evaluation] || 'bg-gray-100 text-gray-800';

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
            <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-bold ${evaluationColor}`}>
              {evaluation}
            </span>
          </div>
          <div className={`p-4 rounded-full ${bgColor}`}>
            <Icon className={`text-2xl ${color}`} />
          </div>
        </div>
      </div>
    );
  };

  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8B7355] mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'الإيداعات', value: summary.total_deposits },
    { name: 'السحوبات', value: summary.total_withdraws },
  ];
  
  const COLORS = ['#22c55e', '#ef4444'];

  // Safe check for chart data
  const safeChartData = Array.isArray(chartData) ? chartData : [];
  
  //PieChart labels
  const renderCustomLabel = ({ name, percent, cx, cy, midAngle }) => {
    const radius = 30;
    const angle = (midAngle * Math.PI) / 180;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    
    return (
      <text 
        x={x}
        y={y}
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {name} {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f7f5] p-6" dir="rtl">
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

      {/* ============================================================ */}
      {/* FINANCIAL DEPARTMENT SECTION */}
      {/* ============================================================ */}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shadow-md p-2">
        <div>
          <div className='flex gap-2 items-center'>
            <h1 className="text-3xl font-bold text-gray-800 font-extrabold">الموقف المالي</h1>
            <GiChart size='25' className='text-green-600 font-bold'/>
          </div>
          <p className="text-gray-500 mt-1">نظرة عامة على المعاملات المالية</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-4 py-2">
            <FaCalendarAlt className="text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent outline-none text-gray-700 text-sm cursor-pointer"
            >
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>
          
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="bg-white rounded-lg shadow-sm px-4 py-2 outline-none text-gray-700 text-sm border border-gray-200 cursor-pointer"
          >
            <option value="7">آخر 7 أيام</option>
            <option value="14">آخر 14 يوم</option>
            <option value="30">آخر 30 يوم</option>
            <option value="60">آخر 60 يوم</option>
            <option value="90">آخر 90 يوم</option>
          </select>

          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5B45] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FaSpinner className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي الإيداعات"
          value={formatCurrency(summary.total_deposits)}
          icon={FaArrowUp}
          color="text-green-600"
          bgColor="bg-green-50"
          subtitle={`عدد: ${summary.deposit_count} معاملة`}
        />
        <StatCard
          title="إجمالي السحوبات"
          value={formatCurrency(summary.total_withdraws)}
          icon={FaArrowDown}
          color="text-red-600"
          bgColor="bg-red-50"
          subtitle={`عدد: ${summary.withdraw_count} معاملة`}
        />
        <StatCard
          title="الرصيد الكلي"
          value={formatCurrency(summary.total_balance)}
          icon={FaBalanceScale}
          color={summary.total_balance >= 0 ? 'text-green-600' : 'text-red-600'}
          bgColor={summary.total_balance >= 0 ? 'bg-green-50' : 'bg-red-50'}
          subtitle={`${summary.total_transactions} معاملة`}
        />
        <StatCard
          title="إجمالي المعاملات"
          value={summary.total_transactions}
          icon={FaExchangeAlt}
          color="text-blue-600"
          bgColor="bg-blue-50"
          subtitle={`إيداع: ${summary.deposit_count} | سحب: ${summary.withdraw_count}`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">اتجاه المعاملات</h3>
          {safeChartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              لا توجد بيانات للعرض
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `التاريخ: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="deposits" 
                    stroke="#22c55e" 
                    name="الإيداعات"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="withdraws" 
                    stroke="#ef4444" 
                    name="السحوبات"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#8B7355" 
                    name="الرصيد"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">توزيع المعاملات</h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">الإيداعات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">السحوبات</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HR / EMPLOYEE DEPARTMENT SECTION */}
      {/* ============================================================ */}

      {/* Employee Department Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shadow-md px-2 mt-12">
        <div>
          <div className='flex gap-2 items-center'>
            <h1 className="text-3xl font-bold text-gray-800 font-extrabold">الموارد البشرية</h1>
            <FaUsers size='25' className='text-blue-600 font-bold'/>
          </div>
          <p className="text-gray-500 mt-1">نظرة عامة على الموظفين والأداء</p>
        </div>
      </div>

      {/* Employee Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <EmployeeStatCard
          title="إجمالي الموظفين"
          value={employeeStats.total_employees}
          icon={FaUsers}
          color="text-blue-600"
          bgColor="bg-blue-50"
          subtitle="جميع الموظفين"
        />
        <EmployeeStatCard
          title="المتصليين حالياً"
          value={employeeStats.active_employees}
          icon={FaUserCheck}
          color="text-green-600"
          bgColor="bg-green-50"
          subtitle="نشطين حالياً"
        />
        <EmployeeStatCard
          title="في الراحة/بريك"
          value={employeeStats.on_break_employees}
          icon={FaUserClock}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
          subtitle="في فترة الراحة"
        />
        <EmployeeStatCard
          title="غير متصلين"
          value={employeeStats.logged_out_employees}
          icon={FaUserSlash}
          color="text-red-600"
          bgColor="bg-red-50"
          subtitle="تم تسجيل الخروج"
        />
        <EmployeeStatCard
          title="أداء الوسطاء"
          value="ممتاز جدا"
          icon={FaChartLine}
          color="text-purple-600"
          bgColor="bg-purple-50"
          subtitle="نسبة النجاح"
          progress={employeeStats.agent_performance}
        />
      </div>


      {/* Agent Performance Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">أداء الوسطاء - نسبة الـ Leads</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agentPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
              <Bar 
                dataKey="leads" 
                fill="#a47d52" 
                name="عدد Leads"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="conversions" 
                fill="#82ca9d" 
                name="الأداءوالمتابعة"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Evaluations Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">تقييم أداء الموظفين</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {/* <FaStar className="text-yellow-400" />
            <span>التقييم بالنجوم</span> */}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 rounded-xs" >
          {employeeEvaluations.map((employee, index) => (
            <EmployeeEvaluationCard key={index} employee={employee} />
          ))}
        </div>

        {/* Evaluation Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">ممتاز جدا</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">ممتاز</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">جيد جدا</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">جيد</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">مقبول</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">ضعيف</span>
          </div>
        </div>
      </div>

      {/* ==========================Start Actvities========================= */}
      
      {/* Broker City Activities Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shadow-md px-2 mt-12">
        <div>
          <div className='flex gap-2 items-center'>
            <h1 className="text-3xl font-bold text-gray-800 font-extrabold">أنشطة بروكر سيتي</h1>
            <FaCity size='25' className='text-orange-600 font-bold'/>
          </div>
          <p className="text-gray-500 mt-1">نظرة عامة على انشطة الشركة</p>
        </div>
      </div>

      {/* Broker Activities Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <BrokerActivityCard
          title="عقارات البيع"
          value={brokerActivities.properties_for_sale}
          icon={FaHome}
          color="text-blue-600"
          bgColor="bg-blue-50"
          evaluation="جيد جدا"
          subtitle="عدد العقارات المعروضة للبيع"
        />
        <BrokerActivityCard
          title="عقارات الإيجار"
          value={brokerActivities.properties_for_rent}
          icon={FaBuilding}
          color="text-green-600"
          bgColor="bg-green-50"
          evaluation="ممتاز جدا"
          subtitle="عدد العقارات المعروضة للإيجار"
        />
        <BrokerActivityCard
          title="إجمالي العملاء"
          value={brokerActivities.total_clients}
          icon={FaUsers}
          color="text-purple-600"
          bgColor="bg-purple-50"
          evaluation="perfect"
          subtitle="إجمالي عدد العملاء"
        />
        <BrokerActivityCard
          title="العملاء المحتملين"
          value={brokerActivities.potential_clients}
          icon={FaUserPlus}
          color="text-orange-600"
          bgColor="bg-orange-50"
          evaluation="perfect"
          subtitle="عدد العملاء المحتملين"
        />
      </div>
      {/* ==========================End Actvities=========================== */}

      


      {/* ============================================================ */}
      {/* START RECENT TRANSACTIONS - COMMENTED OUT */}
      {/* ============================================================ */}
      
      {/* <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">أحدث المعاملات</h3>
          <button className="text-[#8B7355] hover:text-[#6B5B45] text-sm font-medium">
            عرض الكل
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">رقم المعاملة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">النوع</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">طريقة الدفع</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">المبلغ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">البيان</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    لا توجد معاملات حديثة
                  </td>
                </tr>
              ) : (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-800">{transaction.transaction_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(transaction.transaction_date).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'deposit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.payment_method_display}
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">
                      {transaction.statement || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div> */}

      {/* ============================================================ */}
      {/* END RECENT TRANSACTIONS */}
      {/* ============================================================ */}

      {/* ============================================================ */}
      {/* PRINT/DOWNLOAD BUTTON - COMMENTED OUT */}
      {/* ============================================================ */}
      
      {/* <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5B45] transition-colors"
        >
          <FaDownload />
          طباعة التقرير
        </button>
      </div> */}
      
      {/* ============================================================ */}
      {/* END PRINT/DOWNLOAD BUTTON */}
      {/* ============================================================ */}

    </div>
  );
};

export default Dashboard;
// Dashboard.jsx
// import React, { useState, useEffect } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { 
//   FaMoneyBillWave, 
//   FaArrowUp, 
//   FaArrowDown, 
//   FaBalanceScale,
//   FaExchangeAlt,
//   FaSpinner,
//   FaCalendarAlt,
//   FaDownload
// } from 'react-icons/fa';
// import { GiChart } from "react-icons/gi";

// import { 
//   LineChart, 
//   Line, 
//   BarChart, 
//   Bar, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip, 
//   Legend, 
//   ResponsiveContainer,
//   Area,
//   AreaChart,
//   PieChart,
//   Pie,
//   Cell
// } from 'recharts';

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// const Dashboard = () => {
//   const [loading, setLoading] = useState(true);
//   const [summary, setSummary] = useState({
//     total_deposits: 0,
//     total_withdraws: 0,
//     total_balance: 0,
//     total_transactions: 0,
//     deposit_count: 0,
//     withdraw_count: 0,
//   });
//   const [chartData, setChartData] = useState([]); // Changed to empty array
//   const [recentTransactions, setRecentTransactions] = useState([]);
//   const [period, setPeriod] = useState('daily');
//   const [days, setDays] = useState(30);
//   const [exporting, setExporting] = useState(false);

//   const fetchDashboardData = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('access_token');
//       if (!token) {
//         toast.error('يرجى تسجيل الدخول');
//         setLoading(false);
//         return;
//       }

//       // Fetch summary
//       const summaryRes = await fetch(
//         `${BASE}/api/dashboard/summary/?days=${days}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           }
//         }
//       );
      
//       if (!summaryRes.ok) throw new Error('Failed to fetch summary');
//       const summaryData = await summaryRes.json();
//       setSummary(summaryData);

//       // Fetch chart data
//       const chartRes = await fetch(
//         `${BASE}/api/dashboard/chart/?period=${period}&days=${days}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           }
//         }
//       );
      
//       if (!chartRes.ok) {
//         // If API fails, set empty data
//         setChartData([]);
//         throw new Error('Failed to fetch chart data');
//       }
      
//       const chartData = await chartRes.json();
      
//       // Format chart data for recharts - with safety checks
//       if (chartData && chartData.labels && Array.isArray(chartData.labels)) {
//         const formattedChartData = chartData.labels.map((label, index) => ({
//           name: label,
//           deposits: chartData.deposits?.[index] || 0,
//           withdraws: chartData.withdraws?.[index] || 0,
//           balance: chartData.balance?.[index] || 0,
//         }));
//         setChartData(formattedChartData);
//       } else {
//         console.warn('Unexpected chart data format:', chartData);
//         setChartData([]);
//       }

//       // Fetch recent transactions
//       const recentRes = await fetch(
//         `${BASE}/api/dashboard/recent/?limit=10`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           }
//         }
//       );
      
//       if (!recentRes.ok) throw new Error('Failed to fetch recent transactions');
//       const recentData = await recentRes.json();
//       setRecentTransactions(Array.isArray(recentData) ? recentData : []);

//       setLoading(false);
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//       toast.error('❌ حدث خطأ أثناء تحميل بيانات لوحة التحكم');
//       setChartData([]); // Reset chart data on error
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData();
//   }, [period, days]);

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('ar-EG', {
//       style: 'currency',
//       currency: 'AED',
//       minimumFractionDigits: 2,
//     }).format(amount);
//   };

//   const StatCard = ({ title, value, icon: Icon, color, bgColor, subtitle }) => (
//     <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm text-gray-500 font-medium">{title}</p>
//           <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
//           {subtitle && (
//             <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
//           )}
//         </div>
//         <div className={`p-4 rounded-full ${bgColor}`}>
//           <Icon className={`text-2xl ${color}`} />
//         </div>
//       </div>
//     </div>
//   );
  
  
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#f8f7f5] flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8B7355] mx-auto"></div>
//           <p className="mt-4 text-gray-600 text-lg">جاري تحميل لوحة التحكم...</p>
//         </div>
//       </div>
//     );
//   }

//   const pieData = [
//     { name: 'الإيداعات', value: summary.total_deposits },
//     { name: 'السحوبات', value: summary.total_withdraws },
//   ];
  
//   const COLORS = ['#22c55e', '#ef4444'];

//   // Safe check for chart data
//   const safeChartData = Array.isArray(chartData) ? chartData : [];
  
//   //PieChart labels
//   const renderCustomLabel = ({ name, percent, cx, cy, midAngle }) => {
//   // Calculate position based on angle
//   const radius = 30; // Distance from center
//   const angle = (midAngle * Math.PI) / 180;
//   const x = cx + radius * Math.cos(angle);
//   const y = cy + radius * Math.sin(angle);
  
//   return (
//     <text 
//       x={x}
//       y={y}
//       fill="white" 
//       textAnchor="middle" 
//       dominantBaseline="central"
//       fontSize={12}
//       fontWeight="bold"
//     >
//       {name} {(percent * 100).toFixed(0)}%
//     </text>
//   );
// };


//   return (
//     <div className="min-h-screen bg-[#f8f7f5] p-6" dir="rtl">
//       <ToastContainer
//         position="top-center"
//         autoClose={3000}
//         hideProgressBar={false}
//         newestOnTop={false}
//         closeOnClick
//         rtl={true}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         theme="light"
//       />

//       {/* Header */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shadow-md px-2">
//         <div>
//           <div className = 'flex gap-2 items-center'>
//               <h1 className="text-3xl font-bold text-gray-800 font-extrabold">الموقف المالي</h1>
//              <GiChart size='25' className ='text-green-600 font-bold'/>
//           </div>
          
//           <p className="text-gray-500 mt-1">نظرة عامة على المعاملات المالية</p>
//         </div>
//         <div className="flex flex-wrap items-center gap-3">
//           <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-4 py-2">
//             <FaCalendarAlt className="text-gray-400" />
//             <select
//               value={period}
//               onChange={(e) => setPeriod(e.target.value)}
//               className="bg-transparent outline-none text-gray-700 text-sm cursor-pointer"
//             >
//               <option value="daily">يومي</option>
//               <option value="weekly">أسبوعي</option>
//               <option value="monthly">شهري</option>
//             </select>
//           </div>
          
//           <select
//             value={days}
//             onChange={(e) => setDays(parseInt(e.target.value))}
//             className="bg-white rounded-lg shadow-sm px-4 py-2 outline-none text-gray-700 text-sm border border-gray-200 cursor-pointer"
//           >
//             <option value="7">آخر 7 أيام</option>
//             <option value="14">آخر 14 يوم</option>
//             <option value="30">آخر 30 يوم</option>
//             <option value="60">آخر 60 يوم</option>
//             <option value="90">آخر 90 يوم</option>
//           </select>

//           <button
//             onClick={fetchDashboardData}
//             className="px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5B45] transition-colors flex items-center gap-2 cursor-pointer"
//           >
//             <FaSpinner className={loading ? 'animate-spin' : ''} />
//             تحديث
//           </button>
//         </div>
//       </div>



//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <StatCard
//           title="إجمالي الإيداعات"
//           value={formatCurrency(summary.total_deposits)}
//           icon={FaArrowUp}
//           color="text-green-600"
//           bgColor="bg-green-50"
//           subtitle={`عدد: ${summary.deposit_count} معاملة`}
//         />
//         <StatCard
//           title="إجمالي السحوبات"
//           value={formatCurrency(summary.total_withdraws)}
//           icon={FaArrowDown}
//           color="text-red-600"
//           bgColor="bg-red-50"
//           subtitle={`عدد: ${summary.withdraw_count} معاملة`}
//         />
//         <StatCard
//           title="الرصيد الكلي"
//           value={formatCurrency(summary.total_balance)}
//           icon={FaBalanceScale}
//           color={summary.total_balance >= 0 ? 'text-green-600' : 'text-red-600'}
//           bgColor={summary.total_balance >= 0 ? 'bg-green-50' : 'bg-red-50'}
//           subtitle={`${summary.total_transactions} معاملة`}
//         />
//         <StatCard
//           title="إجمالي المعاملات"
//           value={summary.total_transactions}
//           icon={FaExchangeAlt}
//           color="text-blue-600"
//           bgColor="bg-blue-50"
//           subtitle={`إيداع: ${summary.deposit_count} | سحب: ${summary.withdraw_count}`}
//         />
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//         {/* Line Chart */}
//         <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
//           <h3 className="text-lg font-semibold text-gray-700 mb-4">اتجاه المعاملات</h3>
//           {safeChartData.length === 0 ? (
//             <div className="h-80 flex items-center justify-center text-gray-500">
//               لا توجد بيانات للعرض
//             </div>
//           ) : (
//             <div className="h-80">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={safeChartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip 
//                     formatter={(value) => formatCurrency(value)}
//                     labelFormatter={(label) => `التاريخ: ${label}`}
//                   />
//                   <Legend />
//                   <Line 
//                     type="monotone" 
//                     dataKey="deposits" 
//                     stroke="#22c55e" 
//                     name="الإيداعات"
//                     strokeWidth={2}
//                     dot={{ r: 4 }}
//                   />
//                   <Line 
//                     type="monotone" 
//                     dataKey="withdraws" 
//                     stroke="#ef4444" 
//                     name="السحوبات"
//                     strokeWidth={2}
//                     dot={{ r: 4 }}
//                   />
//                   <Line 
//                     type="monotone" 
//                     dataKey="balance" 
//                     stroke="#8B7355" 
//                     name="الرصيد"
//                     strokeWidth={2}
//                     strokeDasharray="5 5"
//                     dot={{ r: 4 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}
//         </div>

//         {/* Pie Chart */}
//         <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
//           <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">توزيع المعاملات</h3>
          
//           <div className="h-64 ">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
                
//                 <Pie
//                   data={pieData}
//                   cx="50%"
//                   cy="50%"
//                   labelLine={false}
//                   label={renderCustomLabel}
//                   outerRadius={80}
//                   fill="#8884d8"
//                   dataKey="value"
//                 >
//                   {pieData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>

//                 <Tooltip formatter={(value) => formatCurrency(value)} />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>

//           <div className="flex justify-center gap-6 mt-4">
//             <div className="flex items-center gap-2">
//               <div className="w-3 h-3 rounded-full bg-green-500"></div>
//               <span className="text-sm text-gray-600">الإيداعات</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-3 h-3 rounded-full bg-red-500"></div>
//               <span className="text-sm text-gray-600">السحوبات</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Start Recent Transactions */}
      
//       {/* <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold text-gray-700">أحدث المعاملات</h3>
//           <button className="text-[#8B7355] hover:text-[#6B5B45] text-sm font-medium">
//             عرض الكل
//           </button>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-gray-200">
//                 <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">رقم المعاملة</th>
//                 <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">التاريخ</th>
//                 <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">النوع</th>
//                 <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">طريقة الدفع</th>
//                 <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">المبلغ</th>
//                 <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">البيان</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recentTransactions.length === 0 ? (
//                 <tr>
//                   <td colSpan="6" className="text-center py-8 text-gray-500">
//                     لا توجد معاملات حديثة
//                   </td>
//                 </tr>
//               ) : (
//                 recentTransactions.map((transaction) => (
//                   <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
//                     <td className="px-4 py-3 text-sm text-gray-800">{transaction.transaction_no}</td>
//                     <td className="px-4 py-3 text-sm text-gray-600">
//                       {new Date(transaction.transaction_date).toLocaleDateString('ar-EG')}
//                     </td>
//                     <td className="px-4 py-3">
//                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                         transaction.type === 'deposit' 
//                           ? 'bg-green-100 text-green-800' 
//                           : 'bg-red-100 text-red-800'
//                       }`}>
//                         {transaction.type_display}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-600">
//                       {transaction.payment_method_display}
//                     </td>
//                     <td className={`px-4 py-3 text-sm font-bold ${
//                       transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
//                     }`}>
//                       {formatCurrency(transaction.amount)}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">
//                       {transaction.statement || '-'}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div> */}

//       {/* End Recent Transactions */}

//       {/* Print/Download button */}
//       {/* <div className="mt-6 flex justify-end gap-3">
//         <button
//           onClick={() => window.print()}
//           className="flex items-center gap-2 px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5B45] transition-colors"
//         >
//           <FaDownload />
//           طباعة التقرير
//         </button>
//       </div> */}
//       {/* Print/Download button */}


//     </div>
//   );
// };

// export default Dashboard;





// import { useState, useEffect } from "react";

// const Dashboard = () => {
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         // Simulate loading delay (remove this in production)
//         const timer = setTimeout(() => {
//             setLoading(false);
//         }, 2000);

//         return () => clearTimeout(timer);
//     }, []);

//     if (loading) {
//         return (
//             <div className="
//                 min-h-screen
//                 flex flex-col items-center justify-center
//                 bg-gradient-to-br from-[#f8f7f5] to-[#e9e6e1]
//                 p-6
//             ">
//                 {/* Loading Spinner */}
//                 <div className="relative">
//                     <div className="
//                         w-20 h-20
//                         border-4 border-[#e9e6e1]
//                         border-t-[#a47d52]
//                         rounded-full
//                         animate-spin
//                         shadow-lg
//                     "></div>
                    
//                     {/* Pulsing ring effect */}
//                     <div className="
//                         absolute inset-0
//                         w-20 h-20
//                         border-4 border-[#a47d52]/20
//                         rounded-full
//                         animate-ping
//                     "></div>
//                 </div>

//                 {/* Loading Text */}
//                 <div className="mt-8 text-center">
//                     <h2 className="
//                         text-2xl font-extrabold
//                         text-[#a47d52]
//                         animate-pulse
//                     ">
//                         جاري التحميل...
//                     </h2>
//                     <p className="
//                         mt-2 text-sm
//                         text-[#8a7e6f]
//                     ">
//                         يرجى الانتظار قليلاً
//                     </p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="
//             min-h-screen
//             bg-gradient-to-br from-[#f8f7f5] to-[#e9e6e1]
//             p-6 md:p-10
//             flex items-center justify-center
//         ">
//             <div className="
//                 w-full max-w-4xl
//                 bg-white/80 backdrop-blur-sm
//                 rounded-3xl shadow-2xl
//                 border border-[#e9e6e1]
//                 p-8 md:p-12
//                 text-center
//                 transform transition-all duration-500
//                 hover:shadow-3xl
//             ">
//                 {/* Decorative line */}
//                 <div className="
//                     w-24 h-1
//                     bg-gradient-to-r from-[#a47d52] to-[#b88d63]
//                     rounded-full
//                     mx-auto mb-6
//                 "></div>

//                 {/* Main Title */}
//                 <h1 className="
//                     text-4xl md:text-5xl
//                     font-extrabold
//                     text-[#a47d52]
//                     mb-4
//                     tracking-tight
//                 ">
//                     مرحباً بيك في شركة بروكر سيتي
//                 </h1>

//                 {/* Subtitle with animation */}
//                 <div className="
//                     text-lg md:text-xl
//                     font-medium
//                     text-[#8a7e6f]
//                     mb-6
//                 ">
//                     <span className="inline-block animate-pulse">🏗️</span>
//                     <span className="mx-2">•</span>
//                     <span>نعمل على بناء مستقبل أفضل</span>
//                 </div>

//                 {/* Main Content Card */}
//                 <div className="
//                     bg-[#f8f7f5]
//                     rounded-2xl
//                     border border-[#e9e6e1]
//                     p-6 md:p-8
//                     mb-6
//                     text-right
//                 ">
//                     <div className="space-y-4">
//                         {/* Arabic Message */}
//                         <p className="
//                             text-base md:text-lg
//                             text-[#5a4a3a]
//                             leading-relaxed
//                             font-medium
//                         ">
//                             <span className="text-[#a47d52] font-extrabold">⚠️</span>
//                             {" "}عفواً النظام قيد التصميم والإنشاء .. يتم حالياً بناء قاعدة البيانات وتصميم الدوال التشغيلية
//                         </p>

//                         {/* Divider */}
//                         <div className="
//                             w-full h-px
//                             bg-gradient-to-r from-transparent via-[#a47d52]/30 to-transparent
//                         "></div>

//                         {/* English Message */}
//                         <p className="
//                             text-sm md:text-base
//                             text-[#8a7e6f]
//                             leading-relaxed
//                         ">
//                             <span className="text-[#a47d52] font-extrabold">📊</span>
//                             {" "}The database and operational functions are under construction in the backend section.
//                         </p>
//                     </div>
//                 </div>

//                 {/* Status Indicators */}
//                 <div className="
//                     flex flex-wrap items-center justify-center
//                     gap-4 md:gap-6
//                     mt-6
//                 ">
//                     <div className="
//                         flex items-center gap-2
//                         px-4 py-2
//                         bg-[#f8f7f5]
//                         rounded-full
//                         border border-[#e9e6e1]
//                     ">
//                         <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//                         <span className="text-xs text-[#8a7e6f] font-medium">قيد التطوير</span>
//                     </div>

//                     <div className="
//                         flex items-center gap-2
//                         px-4 py-2
//                         bg-[#f8f7f5]
//                         rounded-full
//                         border border-[#e9e6e1]
//                     ">
//                         <span className="w-2 h-2 bg-[#a47d52] rounded-full animate-bounce"></span>
//                         <span className="text-xs text-[#8a7e6f] font-medium">Under Construction</span>
//                     </div>
//                 </div>

//                 {/* Progress Bar */}
//                 <div className="mt-6">
//                     <div className="
//                         w-full h-2
//                         bg-[#e9e6e1]
//                         rounded-full
//                         overflow-hidden
//                     ">
//                         <div className="
//                             h-full
//                             bg-gradient-to-r from-[#a47d52] to-[#b88d63]
//                             rounded-full
//                             animate-[progress_3s_ease-in-out_infinite]
//                             w-1/8
//                         "></div>
//                     </div>
//                     <p className="
//                         mt-2 text-xs
//                         text-[#8a7e6f]
//                     ">
//                         نسبة الإنجاز: 15%
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Dashboard;