import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { useNavigate } from "react-router-dom";

const SystemNotifications = () => {
  const [highValueAlerts, setHighValueAlerts] = useState(true);
  const [couponExportFailures, setCouponExportFailures] = useState(true);
  const [suspiciousUserActivity, setSuspiciousUserActivity] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Account Management" />

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="space-y-5">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1E2633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-[#1E2633] font-bricolage">System Notification</h1>
            </div>

            {/* Alert Protocols Section */}
            <div className="space-y-5">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-bold text-text-primary tracking-tight font-bricolage">Alert Protocols</h2>
                <p className="text-secondary text-base mt-1 font-medium leading-relaxed">
                  Configure high-priority system signals that require
                  immediate administrative oversight.
                </p>
              </div>

              <div className="space-y-4 pb-12">
                <p className="text-base font-bold text-secondary ml-2 font-bricolage">System Alerts</p>

                <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-[#1E2633]/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-15 h-15 bg-gray-50 rounded-[20px] flex items-center justify-center text-[#1E2633] group-hover:bg-[#1E2633] group-hover:text-white transition-all shadow-inner border border-gray-50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 9V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V9M5 9H19V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="15" r="1" fill="currentColor" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#1E2633] tracking-tight">High-Value Redemptions</h4>
                      <p className="text-sm text-secondary font-medium mt-0">Immediate SMS & Email</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setHighValueAlerts(!highValueAlerts)}
                    className={`w-15 h-8 rounded-full transition-all relative ${highValueAlerts ? 'bg-[#F26522]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-[5px] w-5 h-5 bg-white rounded-full transition-all shadow-lg ${highValueAlerts ? 'left-8' : 'left-2'}`}></div>
                  </button>
                </div>
                <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-[#1E2633]/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-15 h-15 bg-gray-50 rounded-[20px] flex items-center justify-center text-[#1E2633] group-hover:bg-[#1E2633] group-hover:text-white transition-all shadow-inner border border-gray-50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M7 7H17M7 12H17M7 17H13"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#1E2633] tracking-tight">
                        Coupon Export Failures
                      </h4>
                      <p className="text-sm text-secondary font-medium mt-0 ">
                        Email summary every 15 minutes
                      </p>                    </div>
                  </div>
                  <button
                    onClick={() => setCouponExportFailures(!couponExportFailures)}
                    className={`w-15 h-8 rounded-full transition-all relative ${couponExportFailures ? 'bg-[#F26522]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-[5px] w-5 h-5 bg-white rounded-full transition-all shadow-lg ${couponExportFailures ? 'left-8' : 'left-2'}`}></div>
                  </button>
                </div>


                <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-[#1E2633]/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-15 h-15 bg-gray-50 rounded-[20px] flex items-center justify-center text-[#1E2633] group-hover:bg-[#1E2633] group-hover:text-white transition-all shadow-inner border border-gray-50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 3L4 7V12C4 17 7.5 21.5 12 23C16.5 21.5 20 17 20 12V7L12 3Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#1E2633] tracking-tight">
                        Suspicious User Activity
                      </h4>
                      <p className="text-sm text-secondary font-medium mt-0 ">
                        Fraud-risk pattern detection alerts
                      </p>                    </div>
                  </div>
                  <button
                    onClick={() => setSuspiciousUserActivity(!suspiciousUserActivity)}
                    className={`w-15 h-8 rounded-full transition-all relative ${suspiciousUserActivity ? 'bg-[#F26522]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-[5px] w-5 h-5 bg-white rounded-full transition-all shadow-lg ${suspiciousUserActivity ? 'left-8' : 'left-2'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemNotifications;
