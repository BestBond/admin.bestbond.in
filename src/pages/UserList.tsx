import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { MdSearch } from "react-icons/md";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type { User } from "../utils/types";

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [professionFilter, setProfessionFilter] = useState("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: searchTerm, profession: professionFilter === "all" ? undefined : professionFilter }
      });
      setUsers(res.data.items || []);
    } catch (error) {
      console.error("FETCH USERS ERROR", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, professionFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const professions = ["all", "Contractor", "Painter", "Dealer", "10,000 Pts"];


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
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1E2633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-xl font-bold text-[#1E2633] font-bricolage">User Management</h1>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <MdSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input 
                type="text"
                placeholder="Search by Name or Mobile Number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white rounded-full py-4 pl-16 pr-8 shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-[#1E2633]/5 transition-all text-base"
              />
            </div>

            {/* Profession Filters */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {professions.map((p) => (
                <button
                  key={p}
                  onClick={() => setProfessionFilter(p)}
                  className={`px-8 py-3 rounded-full font-bricolage text-base font-semibold transition-all whitespace-nowrap shadow-sm border ${
                    professionFilter === p 
                      ? "bg-text-primary text-white border-text-primary" 
                      : "bg-white text-text-primary border-border hover:bg-text-primary/10"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* User List */}
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E2633]"></div>
                </div>
              ) : (
                <>
                  {users.map((user) => (
                    <div 
                      key={user.id} 
                      onClick={() => navigate(`/users/profile/${user.id}`)}
                      className="rounded-[24px] p-6 hover:bg-border transition-all cursor-pointer  flex items-center justify-between group "
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`} 
                            alt={user.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#1E2633] group-hover:text-primary transition-colors font-bricolage">{user.name}</p>
                          <p className="text-sm font-medium text-gray-400">{user.profession}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-[#F26522]">{user.walletBalance}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WALLET BALANCE</p>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="bg-white rounded-[32px] p-20 text-center text-gray-400 border border-dashed border-gray-200">
                      <p className="text-lg font-medium italic">No users found matching your criteria.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;
