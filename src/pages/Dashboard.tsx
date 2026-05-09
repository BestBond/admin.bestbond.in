import Sidebar from "../components/layout/Sidebar"
import Header from "../components/layout/Header"
import { useEffect, useState } from "react";
import axios from "axios";
import type { DashboardData } from "../utils/types";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const userRoleStr = localStorage.getItem('userRole');
  const userRoles = userRoleStr ? JSON.parse(userRoleStr) : [];
const isSuperAdmin = userRoles.includes('SUPERADMIN');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(res.data);
    } catch (error) {
      console.error("FETCH DASHBOARD DATA ERROR", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex h-screen bg-[#F8F9FA]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F26522]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Dashboard" />

        <div className="p-8 max-w-6xl mx-auto w-full space-y-10">
          {/* Greeting Section */}
          <div>
            <h2 className="text-3xl font-medium text-[#1E2633]">
              Good Morning, <span className="text-[#1E2633] font-bold ">{isSuperAdmin ? "Super Admin" : "Operational Admin"}</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              System status: <span className="text-gray-400 ">All services operational.</span>
            </p>
          </div>

          {/* Pending Approvals Card */}
          <div className="relative rounded-[32px] p-10 overflow-hidden shadow-sm border border-gray-100 " style={{
            backgroundImage:
              "linear-gradient(30deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 58%, rgba(255, 243, 237, 1) 100%)",
          }}>

            {/* Background Wave */}
            <div className="absolute right-0 bottom-0 w-[80%] h-full opacity-30 pointer-events-none">
              <svg viewBox="0 0 500 200" className="w-full h-full">
                <path
                  d="M0,120 C80,180 180,40 260,110 C340,180 420,40 500,120"
                  fill="none"
                  stroke="#F26522"
                  strokeWidth="5"
                  strokeOpacity="0.2"
                />
              </svg>
            </div>

            <div className="relative z-10 flex justify-between items-end">

              {/* Left Content */}
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                    ACTION QUEUE
                  </span>

                  <h3 className="text-[32px] font-bold text-[#1E2633] mt-2 font-bricolage">
                    Pending Approvals
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Requires validation for high-value reward redemptions
                  </p>
                </div>

                <div className="flex items-end gap-3">
                  <span className="text-[72px] leading-none font-black text-[#1E2633] font-bricolage">
                    {dashboardData?.pendingApprovalsCount || 0}
                  </span>
                  <span className="text-lg font-semibold text-secondary mb-2 font-bricolage">
                    requests
                  </span>
                </div>
              </div>

              {/* Button */}
              <Link
                to="/approvals"
                className="bg-[#F26522] hover:bg-[#D9541E] text-white px-8 py-3 rounded-full 
      font-semibold text-sm font-medium flex items-center gap-2 transition-all 
      shadow-[0_10px_25px_rgba(242,101,34,0.25)] hover:scale-105"
              >
                Request Queue →
              </Link>
            </div>
          </div>

          {/* Key Metrics Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-400">Key Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Total Points Issued */}
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-4">
                <div className="w-12 h-12 bg-text-muted/5 rounded-full flex items-center justify-center text-2xl">
                  <img src="/cards_star.svg" alt="cards_star" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TOTAL POINTS ISSUED</p>
                  <p className="text-4xl font-black text-[#1E2633] mt-2 font-bricolage">
                    {formatNumber(dashboardData?.pointsIssued?.totalLast7Days || 0)}
                  </p>
                </div>
                <div className={`flex items-center gap-2 text-sm font-bold ${(dashboardData?.pointsIssued?.percentVsPriorWeek || 0) >= 0 ? "text-[#27AE60]" : "text-red-500"
                  }`}>
                  <span>{(dashboardData?.pointsIssued?.percentVsPriorWeek || 0) >= 0 ? "📈" : "📉"}</span>
                  <span>
                    {Math.abs(dashboardData?.pointsIssued?.percentVsPriorWeek || 0)}%
                    {(dashboardData?.pointsIssued?.percentVsPriorWeek || 0) >= 0 ? " increase" : " decrease"} in last week
                  </span>
                </div>
              </div>

              {/* Points Redeemed */}
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-4">
                <div className="w-12 h-12 bg-text-muted/5 rounded-full flex items-center justify-center text-2xl">
                  <img src="/shopping_cart_checkout.svg" alt="shopping_cart_checkout" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">POINTS REDEEMED</p>
                  <p className="text-4xl font-black text-[#1E2633] mt-2 font-bricolage">
                    {formatNumber(dashboardData?.pointsRedeemed?.totalLast7Days || 0)}
                  </p>
                </div>
                <div className={`flex items-center gap-2 text-sm font-bold font-bricolage ${(dashboardData?.pointsRedeemed?.percentVsPriorWeek || 0) >= 0 ? "text-[#27AE60]" : "text-red-500"
                  }`}>
                  <span>{(dashboardData?.pointsRedeemed?.percentVsPriorWeek || 0) >= 0 ? "📈" : "📉"}</span>
                  <span>
                    {Math.abs(dashboardData?.pointsRedeemed?.percentVsPriorWeek || 0)}%
                    {(dashboardData?.pointsRedeemed?.percentVsPriorWeek || 0) >= 0 ? " increase" : " decrease"} in last week
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Engagement Metrics */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-400">User Engagement Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
              {/* Total Active Users */}
              <div className="bg-[#EFF2F7] rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[320px]">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl">
                    <img src="/group.svg" alt="users" className="w-6 h-6" />
                  </div>
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">LAST 7 DAYS</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TOTAL ACTIVE USERS</p>
                  <p className="text-5xl font-black text-[#1E2633] mt-2 font-bricolage">
                    {formatNumber(dashboardData?.activeUsers?.countLast7Days || 0)}
                  </p>
                </div>
                {/* Simple Bar Chart Mockup */}
                <div className="flex items-end gap-1.5 h-16 mt-4">
                  {(dashboardData?.activeUsers?.dailyActiveUsersLast5Days || [0, 0, 0, 0, 0]).map((count, i) => {
                    const max = Math.max(...(dashboardData?.activeUsers?.dailyActiveUsersLast5Days || [1]));
                    const height = max > 0 ? (count / max) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t-lg bg-[#F26522]"
                        style={{ height: `${Math.max(height, 5)}%`, opacity: (i + 1) / 5 }}
                        title={`Count: ${count}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Coupons Scanned Today */}
              <div className="bg-[#EFF2F7] rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[320px]">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl">
                    <img src="/qr_code_scanner.svg" alt="qr_code_scanner" className="w-6 h-6" />
                  </div>
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">DAILY TOTAL</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">COUPONS SCANNED TODAY</p>
                  <p className="text-5xl font-black text-[#1E2633] mt-2">
                    {formatNumber(dashboardData?.couponsScannedToday?.count || 0)}
                  </p>
                </div>

                {/* Recent Activity Footer */}
                <div className="bg-gray-50 rounded-full p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <img
                          key={i}
                          src={`https://ui-avatars.com/api/?name=User${i}&background=random`}
                          className="w-8 h-8 rounded-full border-2 border-white"
                          alt="user"
                        />
                      ))}
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                        +{dashboardData?.couponsScannedToday?.last5MinutesCount || 0}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 leading-tight">Last 5 min<br />activity</span>
                  </div>
                  <span className="text-[#F26522] text-xl font-bold">↗</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
