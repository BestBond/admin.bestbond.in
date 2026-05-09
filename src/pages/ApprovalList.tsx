import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { MdOutlineAccountCircle } from "react-icons/md";
import axios from "axios";

interface RedemptionRequest {
  id: string;
  code: string;
  points: number;
  itemName: string;
  requester: string;
  status: string;
  createdAt: string;
  flagged?: boolean;
}

const ApprovalList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("HIGH_VALUE");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/redemptions?status=PENDING&take=20&offset=0&sort=NEWEST`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          sort: sortBy, 
          flagged: flaggedOnly,
          status: 'PROCESSING'
        }
      });
      setRequests(res.data.items || []);
    } catch (error) {
      console.error("FETCH REQUESTS ERROR", error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, flaggedOnly]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Redemption Approval" />

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="space-y-8">
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
              <h1 className="text-xl font-bold text-[#1E2633] font-bricolage">Approval Request List</h1>
            </div>

            {/* Title Section */}
            <div>
              <h2 className="text-4xl font-bold text-text-primary tracking-tight font-bricolage">Pending Approvals</h2>
              <p className="text-secondary text-base mt-3 font-medium max-w-2xl">
                Review and authorise high-value rewards for the loyalty program ecosystem
              </p>
            </div>

            {/* Filters Bar */}
            <div className="flex justify-between items-center bg-white rounded-[32px] p-6 shadow-sm border border-gray-50">
              <div className="flex items-center gap-6 px-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">SORT BY</span>
                <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-gray-50 border border-gray-100 rounded-full py-2 px-6 pr-10 text-sm font-bold text-[#1E2633] outline-none cursor-pointer hover:bg-gray-100 transition-all"
                  >
                    <option value="HIGH_VALUE">High Value</option>
                    <option value="NEWEST">Newest First</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L5 5L9 1" stroke="#1E2633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pr-4 border-l border-gray-100 pl-8">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Flagged Requests</span>
                <button 
                  onClick={() => setFlaggedOnly(!flaggedOnly)}
                  className={`w-12 h-6 rounded-full transition-all relative ${flaggedOnly ? 'bg-[#F26522]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${flaggedOnly ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Request Cards */}
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E2633]"></div>
                </div>
              ) : (
                <>
                  {requests.map((req) => (
                    <div 
                      key={req.id} 
                      onClick={() => navigate(`/approvals/details/${req.id}`)}
                      className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-8">
                          <div className="relative">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl group-hover:bg-orange-50 transition-colors shadow-inner overflow-hidden">
                              <img src={`https://ui-avatars.com/api/?name=${req.itemName}&background=random&color=fff`} alt="" className="w-full h-full object-cover opacity-80" />
                            </div>
                            <div className="absolute -top-3 -left-3 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{req.code}</span>
                            </div>
                            {req.flagged && (
                              <div className="absolute -top-3 -right-3 bg-red-500 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                                <span className="text-white text-[10px] font-bold">!</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-[#1E2633] tracking-tight">{req.itemName}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              <MdOutlineAccountCircle className="text-gray-400 text-lg" />
                              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{req.requester}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="text-4xl font-black text-[#F26522] tracking-tighter">{req.points.toLocaleString()}</span>
                            <span className="text-sm font-bold text-[#F26522] uppercase">PTS</span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">REWARD VALUE</p>
                        </div>
                      </div>
                      <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-3 text-[#F26522] text-[10px] font-bold uppercase tracking-[0.2em]">
                          <span className="w-2 h-2 bg-[#F26522] rounded-full animate-pulse"></span>
                          Pending Review (2h ago)
                        </div>
                        <div className="flex items-center gap-2 text-[#1E2633] text-sm font-bold group-hover:translate-x-1 transition-transform">
                          Review
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div className="bg-white rounded-[40px] p-24 text-center text-gray-400 border border-dashed border-gray-200 shadow-inner">
                      <p className="text-xl font-medium italic">No pending approval requests found.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Pagination */}
            <div className="flex flex-col items-center gap-6 pt-4 pb-12">
              <button className="px-12 py-4 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-[#F26522] uppercase tracking-[0.2em] hover:bg-gray-50 transition-all shadow-xl shadow-gray-200/50 hover:scale-105 active:scale-95">
                Load More Requests
              </button>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                Showing {requests.length} of 28 pending high-ticket requests
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalList;
