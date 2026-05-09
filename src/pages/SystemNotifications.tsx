import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { useNavigate } from "react-router-dom";

const SystemNotifications = () => {
  const [highValueAlerts, setHighValueAlerts] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Account Management" />

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="space-y-12">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/settings')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1E2633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-lg font-bold text-[#1E2633] font-bricolage">System Notification</h1>
            </div>

            {/* Alert Protocols Section */}
            <div className="space-y-10">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-bold text-text-primary tracking-tight font-bricolage">Alert Protocols</h2>
                <p className="text-secondary text-base mt-1 font-medium leading-relaxed">
                  Configure high-priority system signals that require 
                  immediate administrative oversight.
                </p>
              </div>

              <div className="space-y-4 pb-12">
                <p className="text-base font-bold text-secondary ml-2 font-bricolage">System Alerts</p>
                
                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-[#1E2633]/20 transition-all">
                  <div className="flex items-center gap-10">
                    <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-[#1E2633] group-hover:bg-[#1E2633] group-hover:text-white transition-all shadow-inner border border-gray-50">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 9V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V9M5 9H19V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="15" r="1" fill="currentColor"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-[#1E2633] tracking-tight">High-Value Redemptions</h4>
                      <p className="text-base text-secondary font-medium mt-1">Immediate SMS & Email</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setHighValueAlerts(!highValueAlerts)}
                    className={`w-20 h-10 rounded-full transition-all relative ${highValueAlerts ? 'bg-[#F26522]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-2 w-6 h-6 bg-white rounded-full transition-all shadow-lg ${highValueAlerts ? 'left-12' : 'left-2'}`}></div>
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
