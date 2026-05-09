import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { MdSecurity, MdNotifications, MdLogout } from "react-icons/md";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BiPhone } from "react-icons/bi";

interface AdminProfile {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  empId?: string;
  profession?: string;
  
}

const AccountManagement = () => {
  const [profile, setProfile] = useState<AdminProfile>({
    fullName: "Jamie Barnes",
    email: "admin.central@nexus-corp.com",
    phone: "+1 202-555-0156",
    role: "SUPER ADMIN",
    empId: "EMP-ID: 99284-SA"
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/me/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          setProfile(res.data);
        }
      } catch (error) {
        console.error("FETCH PROFILE ERROR", error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Account Management" />

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1E2633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-xl font-bold text-[#1E2633] font-bricolage ">User Profile</h1>
            </div>

            {/* Profile Main Card */}
            <div className="flex flex-col items-center text-center space-y-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              
              <div className="relative">
                <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-8 border-white shadow-2xl">
                  <img 
                    src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.fullName}&background=1E2633&color=fff&size=512`} 
                    alt="Admin" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-black text-[#1E2633] tracking-tight font-bricolage">{profile?.fullName}</h2>
                <div className="inline-block bg-[#FFF8F3] px-6 py-2 rounded-full border border-[#FFE7D6]">
                  <p className="text-xs font-bold text-[#F26522] tracking-[0.2em] uppercase font-bricolage">{profile?.profession}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-0">
                <div className="flex items-center gap-3 font-bricolage text-secondary font-medium text-sm tracking-widest uppercase px-6 py-2">
                    <BiPhone  size={22}/>
                  {profile?.phone}
                </div>
                <div className="flex items-center font-bricolage gap-2 text-secondary font-medium text-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {profile.email}
                </div>
              </div>
            </div>

            {/* Navigation Options */}
            <div className="space-y-4">
              <button 
                onClick={() => navigate("/settings/security")}
                className="w-full bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl hover:scale-[1.01] transition-all"
              >
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center text-[#1E2633] group-hover:bg-[#1E2633] group-hover:text-white transition-all shadow-inner">
                    <MdSecurity className="text-3xl" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xl font-bold text-[#1E2633] font-bricolage">Security & Preferences</h4>
                    <p className="text-sm text-gray-400 font-medium mt-1">Manage credentials and PIN</p>
                  </div>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full group-hover:bg-gray-50 transition-all">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="#1E2633" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>

              <button 
                onClick={() => navigate("/settings/notifications")}
                className="w-full bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl hover:scale-[1.01] transition-all"
              >
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center text-[#1E2633] group-hover:bg-[#1E2633] group-hover:text-white transition-all shadow-inner">
                    <MdNotifications className="text-3xl" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xl font-bold text-[#1E2633] font-bricolage">System Notification</h4>
                    <p className="text-sm text-gray-400 font-medium mt-1">Critical alerts and notifications</p>
                  </div>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full group-hover:bg-gray-50 transition-all">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="#1E2633" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            </div>

            {/* Logout Button */}
            <div className="flex justify-end pt-4 pb-12">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-10 py-5 bg-[#FFF8F3] text-[#F26522] rounded-[24px] font-bold text-lg hover:bg-[#F26522] hover:text-white transition-all shadow-lg shadow-[#F26522]/5"
              >
                <MdLogout className="text-2xl" /> Log Out
              </button>
            </div>
          </div>
        </div>
        
        {/* Version Footer */}
        <div className="text-center pb-8">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.4em]">APP VERSION 2.1</p>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;
