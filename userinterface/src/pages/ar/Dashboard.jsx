// npm install recharts chart.js react-chartjs-2 --force

// Dashboard.jsx
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
  FaDownload
} from 'react-icons/fa';
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

// Base URL from environment variables
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
  const [chartData, setChartData] = useState({
    labels: [],
    deposits: [],
    withdraws: [],
    balance: [],
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);

  // Fetch all dashboard data
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
      
      if (!chartRes.ok) throw new Error('Failed to fetch chart data');
      const chartData = await chartRes.json();
      
      // Format chart data for recharts
      const formattedChartData = chartData.labels.map((label, index) => ({
        name: label,
        deposits: chartData.deposits[index] || 0,
        withdraws: chartData.withdraws[index] || 0,
        balance: chartData.balance[index] || 0,
      }));
      
      setChartData(formattedChartData);

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
      
      if (!recentRes.ok) throw new Error('Failed to fetch recent transactions');
      const recentData = await recentRes.json();
      setRecentTransactions(recentData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('❌ حدث خطأ أثناء تحميل بيانات لوحة التحكم');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period, days]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Stat Card Component
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

  // Loading state
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

  // Prepare chart data for pie chart
  const pieData = [
    { name: 'الإيداعات', value: summary.total_deposits },
    { name: 'السحوبات', value: summary.total_withdraws },
  ];
  
  const COLORS = ['#22c55e', '#ef4444'];

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

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
          <p className="text-gray-500 mt-1">نظرة عامة على المعاملات المالية</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-4 py-2">
            <FaCalendarAlt className="text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent outline-none text-gray-700 text-sm"
            >
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>
          
          {/* Days Filter */}
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="bg-white rounded-lg shadow-sm px-4 py-2 outline-none text-gray-700 text-sm border border-gray-200"
          >
            <option value="7">آخر 7 أيام</option>
            <option value="14">آخر 14 يوم</option>
            <option value="30">آخر 30 يوم</option>
            <option value="60">آخر 60 يوم</option>
            <option value="90">آخر 90 يوم</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5B45] transition-colors flex items-center gap-2"
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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
      </div>

      {/* Print/Download button */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5B45] transition-colors"
        >
          <FaDownload />
          طباعة التقرير
        </button>
      </div>
    </div>
  );
};

export default Dashboard;






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