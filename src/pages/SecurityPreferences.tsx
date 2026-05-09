import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const SecurityPreferences = () => {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [quickLoginPin, setQuickLoginPin] = useState(true);
  const navigate = useNavigate();

  const handleUpdatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      return Swal.fire("Error", "Passwords do not match", "error");
    }
    setLoading(true);
    try {
      // In a real app, call the update password API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Swal.fire({
        title: "Success",
        text: "Password updated successfully",
        icon: "success",
        confirmButtonColor: "#1E2633",
        customClass: { popup: 'rounded-[32px]' }
      });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      console.error("PASSWORD UPDATE ERROR", error);
      Swal.fire("Error", "Failed to update password", "error");
    } finally {
      setLoading(false);
    }
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
                onClick={() => navigate('/settings')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1E2633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-xl font-bold text-[#1E2633]">Security & Preferences</h1>
            </div>

            {/* Authentication Section */}
            <div className="space-y-10">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-semibold text-text-primary tracking-wide">Authentication</h2>
                <p className="text-secondary text-base mt-1 font-medium leading-relaxed">
                  Update your access credentials regularly to maintain site-wide integrity. 
                  We recommend complex phrases.
                </p>
              </div>

              <div className="flex justify-center">
                <div className="bg-border/50 rounded-[48px] p-12 w-full max-w-2xl shadow-sm border border-gray-50 space-y-10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  
                  <div className="space-y-8 relative">
                    <div className="space-y-5">
                      <label className="text-[12px] font-bold text-secondary uppercase tracking-wide ml-2">Current Password</label>
                      <input 
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                        className="w-full bg-white border border-gray-100 rounded-[24px] px-8 py-4 mt-3 text-text-primary outline-none focus:ring-4 focus:ring-[#F26522]/5 transition-all text-base"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[12px] font-bold text-secondary uppercase tracking-wide ml-2">New Password</label>
                      <input 
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        className="w-full bg-white border border-gray-100 rounded-[24px] px-8 py-4 mt-3 text-text-primary outline-none focus:ring-4 focus:ring-[#F26522]/5 transition-all text-base"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[12px] font-bold text-secondary uppercase tracking-wide ml-2">Confirm New Password</label>
                      <input 
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full bg-white border border-gray-100 rounded-[24px] px-8 py-4 mt-3 text-text-primary outline-none focus:ring-4 focus:ring-[#F26522]/5 transition-all text-base"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <div className="pt-4 flex justify-center">
                      <button 
                        onClick={handleUpdatePassword}
                        disabled={loading || !passwords.current || !passwords.new}
                        className="bg-primary text-white px-16 py-3 rounded-full font-bold text-lg shadow-2xl shadow-[#F26522]/20 hover:scale-[1.02] active:scale-[0.98] transition-all  flex items-center gap-3"
                      >
                        {loading ? (
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : "Update Password"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Efficiency Section */}
            <div className="space-y-8 pt-6 pb-12">
              <div className="max-w-2xl">
                <h3 className="text-xl font-bold text-text-primary tracking-tight">Efficiency</h3>
                <p className="text-secondary text-base mt-2 font-medium">Streamline your workflow with biometric-ready authentication shortcuts.</p>
              </div>
              
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-[#1E2633]/20 transition-all">
                <div className="flex items-center gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-[#1E2633]">Quick Login PIN</h4>
                    <p className="text-md text-gray-400 font-medium mt-1">Use a 4-digit PIN instead of a password</p>
                  </div>
                </div>
                <button 
                  onClick={() => setQuickLoginPin(!quickLoginPin)}
                  className={`w-16 h-8 rounded-full transition-all relative ${quickLoginPin ? 'bg-[#F26522]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${quickLoginPin ? 'left-9' : 'left-1.5'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPreferences;
