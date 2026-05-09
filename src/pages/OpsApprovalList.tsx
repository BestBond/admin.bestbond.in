import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { MdOutlineMail, MdPhone } from "react-icons/md";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import api from "../utils/api";

interface PendingOpsAdmin {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
}

const OpsApprovalList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<PendingOpsAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchPendingAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/operational-admins/pending?take=20&offset=0");
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("FETCH PENDING ADMINS ERROR", error);
      toast.error("Failed to fetch pending approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingAdmins();
  }, [fetchPendingAdmins]);

  const handleApprove = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Approve Admin?",
      text: `Are you sure you want to approve ${name} as an Operational Admin?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#F26522",
      cancelButtonColor: "#1E2633",
      confirmButtonText: "Yes, approve!",
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/admin/operational-admins/${id}/approve`);
        toast.success(`${name} approved successfully`);
        fetchPendingAdmins();
      } catch (error) {
        console.error("APPROVE ERROR", error);
        toast.error("Failed to approve admin");
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Ops Admin Approval" />

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1E2633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-xl font-bold text-[#1E2633] font-bricolage">Operational Admin Queue</h1>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-text-primary tracking-tight font-bricolage">Pending Registrations</h2>
              <p className="text-secondary text-base mt-3 font-medium max-w-2xl">
                Review and approve new operational staff registrations for system access
              </p>
            </div>

            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F26522]"></div>
                </div>
              ) : (
                <>
                  {items.map((admin) => (
                    <div 
                      key={admin.id} 
                      className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-8">
                          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl group-hover:bg-orange-50 transition-colors shadow-inner">
                            <img src={`https://ui-avatars.com/api/?name=${admin.fullName}&background=random&color=fff`} alt="" className="w-full h-full object-cover opacity-80 rounded-3xl" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-[#1E2633] tracking-tight">{admin.fullName}</h3>
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-2">
                                <MdOutlineMail className="text-gray-400 text-lg" />
                                <span className="text-sm font-bold text-gray-500">{admin.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MdPhone className="text-gray-400 text-lg" />
                                <span className="text-sm font-bold text-gray-500">{admin.phone}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleApprove(admin.id, admin.fullName)}
                          className="bg-[#1E2633] hover:bg-black text-white px-8 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:scale-105 active:scale-95"
                        >
                          Approve Staff
                        </button>
                      </div>
                      <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#27AE60] rounded-full"></span>
                          Registered on {new Date(admin.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          ID: {admin.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="bg-white rounded-[40px] p-24 text-center text-gray-400 border border-dashed border-gray-200 shadow-inner">
                      <p className="text-xl font-medium italic">No pending registrations found.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {total > items.length && (
              <div className="flex flex-col items-center gap-6 pt-4 pb-12">
                <button className="px-12 py-4 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-[#F26522] uppercase tracking-[0.2em] hover:bg-gray-50 transition-all shadow-xl shadow-gray-200/50 hover:scale-105 active:scale-95">
                  Load More Registrations
                </button>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  Showing {items.length} of {total} pending requests
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpsApprovalList;
