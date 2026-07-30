import { useState, useEffect, useCallback } from "react";
import { useRefetchOnDocumentVisible } from "../utils/useRefetchOnDocumentVisible";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { MdSearch } from "react-icons/md";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import type { AdminUserListItem } from "../utils/types";

const PAGE_SIZE = 50;

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [professionFilter, setProfessionFilter] = useState("all");
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchUsers = useCallback(async (offset: number) => {
    const isFirstPage = offset === 0;
    isFirstPage ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await api.get("/admin/users", {
        params: {
          q: searchTerm,
          profession: professionFilter === "all" ? undefined : professionFilter,
          take: PAGE_SIZE,
          offset,
        }
      });
      const items: AdminUserListItem[] = res.data.items || [];
      setUsers((prev) => (isFirstPage ? items : [...prev, ...items]));
      setTotal(res.data.total ?? items.length);
      setHasMore(Boolean(res.data.hasMore));
    } catch (error) {
      console.error("FETCH USERS ERROR", error);
    } finally {
      isFirstPage ? setLoading(false) : setLoadingMore(false);
    }
  }, [searchTerm, professionFilter]);

  useEffect(() => {
    fetchUsers(0);
  }, [fetchUsers]);

  useRefetchOnDocumentVisible(() => {
    void fetchUsers(0);
  });

  const handleLoadMore = () => {
    void fetchUsers(users.length);
  };

  const professionFilters = [
    { value: "all", label: "All" },
    { value: "Contractor/Painter", label: "Contractor / Painter" },
    { value: "Dealer", label: "Dealer" },
    { value: "Ops Admin", label: "Ops Admin" },
  ] as const;


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
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1E2633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
              {professionFilters.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setProfessionFilter(value)}
                  className={`px-8 py-3 rounded-full font-bricolage text-base font-semibold transition-all whitespace-nowrap shadow-sm border ${professionFilter === value
                      ? "bg-text-primary text-white border-text-primary"
                      : "bg-white text-text-primary border-border hover:bg-text-primary/10"
                    }`}
                >
                  {label}
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
                  {users
                    ?.filter((user) => user.profession !== "Super Admin")
                    ?.map((user) => (
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
                            <p className="text-sm font-medium text-gray-400">{user.profession || "—"}</p>
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
                  {users.length > 0 && (
                    <div className="flex flex-col items-center gap-3 pt-4 pb-2">
                      <p className="text-sm text-gray-400">
                        Showing {users.length} of {total} users
                      </p>
                      {hasMore && (
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="px-8 py-3 rounded-full font-bricolage text-base font-semibold bg-text-primary text-white hover:bg-text-primary/90 transition-all disabled:opacity-50"
                        >
                          {loadingMore ? "Loading…" : "Load More"}
                        </button>
                      )}
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
