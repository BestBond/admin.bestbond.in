import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { MdBlock } from "react-icons/md";
import axios from "axios";
import Swal from "sweetalert2";
import type { User } from "../utils/types";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (error) {
        console.error("FETCH USER DETAIL ERROR", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetail();
  }, [userId]);

  const handleSuspendSubmit = async () => {
    if (!suspensionReason || !user) return;
    setIsSuspending(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${import.meta.env.VITE_API_URL}/admin/users/${user.id}/suspend`, 
        { reason: suspensionReason }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Swal.fire({
        title: 'Suspended!',
        text: 'User account has been suspended.',
        icon: 'success',
        confirmButtonColor: '#1E2633',
        customClass: { popup: 'rounded-[32px]' }
      });

      // Refresh data
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setIsModalOpen(false);
      setSuspensionReason("");
    } catch (error) {
      console.error("SUSPEND ERROR", error);
      Swal.fire('Error', 'Failed to suspend account', 'error');
    } finally {
      setIsSuspending(false);
    }
  };

  const handleSuspend = () => {
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F8F9FA]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E2633]"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="User Management" />

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="space-y-8">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/users')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-text-primary font-bricolage">User Profile</h1>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 flex justify-between items-start">
              <div className="flex items-start gap-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                    <img
                      src={`https://ui-avatars.com/api/?name=${user.fullName}&background=random&color=fff`}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4 bg-green-50 px-4 py-1 rounded-full w-fit">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-medium text-green-500 uppercase tracking-widest">STATUS: {user.isActive ? "ACTIVE" : "SUSPENDED"}</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[#1E2633] mt-3 font-bricolage">{user.fullName}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-normal text-primary">{user.profession || 'Painter'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSuspend}
                className="w-14 h-14 text-primary cursor-pointer transition-all"
              >
                <MdBlock className="text-3xl" />
              </button>
            </div>

            {/* Balance Card */}
            <div className=" rounded-[40px] p-12 shadow-sm border border-gray-100 relative overflow-hidden group bg-[linear-gradient(30deg,_rgba(255,255,255,1)_0%,_rgba(255,255,255,1)_58%,_rgba(255,243,237,1)_100%)]">
              <div className="absolute right-12 bottom-3 -translate-y-1/2 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V6" stroke="#F26522" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 10V14C21 15.1 20.1 16 19 16H17C15.9 16 15 15.1 15 14V10C15 8.9 15.9 8 17 8H19C20.1 8 21 8.9 21 10Z" stroke="#F26522" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">CURRENT BALANCE</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-7xl font-black text-[#1E2633] tracking-tighter font-bricolage">{user.loyaltyPoints}</span>
                  <span className="text-2xl font-bold text-secondary">PTS</span>
                </div>
                <div className="pt-6">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">LAST UPDATED</p>
                  <p className="text-sm font-bold text-[#1E2633] mt-1 font-bricolage">{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-4 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                  <img src="/person.svg" alt="" />
                </div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">User Information</h3>
              </div>
              <div className="p-10 grid grid-cols-1 gap-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">MOBILE NUMBER</p>
                  <p className="text-xl font-bold text-[#1E2633] font-bricolage">{user.phone}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">ADDRESS</p>
                  <p className="text-xl font-bold text-[#1E2633] leading-relaxed max-w-2xl font-bricolage">
                    {user.deliveryAddress || "123 Main St, Block B Metropolis Industrial Zone"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 pb-12">
              <button
                onClick={handleSuspend}
                className="flex items-center gap-3 text-primary font-bold hover:opacity-80 transition-opacity"
              >
                <MdBlock className="text-2xl" />
                <span>Suspend Account</span>
              </button>

              <button
                onClick={() => navigate(`/users/transactions/${user.id}`)}
                className="bg-primary text-white px-10 py-3 rounded-[24px] font-semibold text-base flex items-center gap-4 shadow-xl shadow-[#F26522]/20 hover:scale-105 active:scale-95 transition-all"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.11 21 21 20.1 21 19V5C21 3.9 20.11 3 19 3ZM19 19H5V5H19V19ZM7 10H17V12H7V10ZM7 14H17V16H7V14ZM7 6H17V8H7V6Z" fill="currentColor" />
                </svg>
                View Transaction Ledger
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Suspend Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#1E2633]/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-[40px] p-10 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-bold text-[#1E2633] mb-8">Suspend this Account?</h2>
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2 mb-10">
                REASON FOR SUSPENSION
              </label>
              <textarea
                placeholder="Enter the reason for suspension"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full bg-white mt-5 border-2 border-border rounded-[28px] p-6 min-h-[160px] outline-none focus:ring-2 focus:ring-[#A73A00]/10 transition-all text-lg resize-none"
              ></textarea>
            </div>

            <div className="flex gap-4 mt-5">
              <button
                onClick={handleSuspendSubmit}
                disabled={!suspensionReason || isSuspending}
                className="flex-1 bg-brand-orange-dark text-white py-3 rounded-full font-normal text-sm shadow-xl  hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {isSuspending ? (
                  <div className="w-6  border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Confirm Suspension"
                )}
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSuspensionReason("");
                }}
                className="flex-1 bg-white text-text-primary py-3 rounded-full font-normal text-sm border border-border shadow-sm hover:bg-gray-50 transition-all"
              >
                Go to Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
