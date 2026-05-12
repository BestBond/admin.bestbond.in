import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { MdHistory } from "react-icons/md";
import api from "../utils/api";
import type { AdminUserDetail, AdminUserLedgerResponse } from "../utils/types";

const UserTransactions = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [ledger, setLedger] = useState<AdminUserLedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"THIS_MONTH" | "ALL">("THIS_MONTH");

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        const [userRes, ledgerRes] = await Promise.all([
          api.get(`/admin/users/${userId}`),
          api.get<AdminUserLedgerResponse>(
            `/admin/users/${userId}/transactions`,
            { params: { period, limit: 50, offset: 0 } },
          ),
        ]);
        setUser(userRes.data);
        setLedger(ledgerRes.data);
      } catch (error) {
        console.error("FETCH DATA ERROR", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [userId, period]);

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

  const displayName = user.displayName || user.fullName?.trim() || "User";
  const balance = ledger?.totalBalance ?? user.loyaltyPoints ?? 0;
  const txs = ledger?.transactions ?? [];

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="User Management" />

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/users/profile/${userId}`)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1E2633" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-[#1E2633] font-bricolage">Transaction History</h1>
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#1E2633] font-bricolage">{displayName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <svg width="10" height="14" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 0C3.13 0 0 3.13 0 7C0 12.25 7 18 7 18C7 18 14 12.25 14 7C14 3.13 10.87 0 7 0ZM7 9.5C5.62 9.5 4.5 8.38 4.5 7C4.5 5.62 5.62 4.5 7 4.5C8.38 4.5 9.5 5.62 9.5 7C9.5 8.38 8.38 9.5 7 9.5Z" fill="#F26522" />
                    </svg>
                    <span className="text-sm font-bold text-[#F26522]">{user.profession || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest">STATUS: {user?.status}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-orange-50 text-[#F26522] rounded-2xl">
                <MdHistory className="text-3xl" />
              </div>
            </div>

            <div className="grid grid-cols-1  gap-6">
              <div className="bg-orange-50/50 rounded-[40px] p-10 border border-orange-100 relative overflow-hidden group">
                <div className="space-y-3">
                  <p className="text-[14px] font-bold text-secondary uppercase tracking-[0.2em]">Total Points Balance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-text-primary tracking-tighter font-bricolage">
                      {balance.toLocaleString()}
                    </span>
                    <span className="text-xl font-bold text-secondary">PTS</span>
                  </div>
                  {ledger ? (
                    <p className="text-sm text-secondary">
                      Period: {ledger.period === "ALL" ? "All time" : "This month"} — earned{" "}
                      {ledger.totalPointsEarned.toLocaleString()}, spent{" "}
                      {ledger.totalPointsSpent.toLocaleString()}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="bg-border/50 rounded-[40px] p-10 border border-gray-100 flex items-center gap-8 shadow-sm">
                <div className="flex items-center justify-center ">
                  <img src="/receipt_long.svg" alt="Receipt" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-secondary uppercase tracking-widest">Monthly coupon scans</p>
                  <p className="text-6xl font-black text-text-primary mt-1 font-bricolage">
                    {(ledger?.monthlyScans ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-text-primary">Recent Transactions</h3>
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2 text-[14px] font-medium text-secondary uppercase tracking-widest bg-white px-6 py-3 rounded-full border border-gray-100 shadow-sm">
                  <span>SHOW:</span>
                  <select
                    value={period}
                    onChange={(e) =>
                      setPeriod(e.target.value === "ALL" ? "ALL" : "THIS_MONTH")
                    }
                    className="bg-transparent outline-none text-text-primary cursor-pointer"
                  >
                    <option value="THIS_MONTH">This Month</option>
                    <option value="ALL">All Time</option>
                  </select>
                </div>
                <p className="text-[12px] font-medium text-secondary uppercase tracking-widest">
                  Showing {txs.length} transactions
                </p>
              </div>

              <div className="space-y-3">
                {txs.length > 0 ? (
                  txs.map((tx) => {
                    const pts = tx.pointsDelta;
                    const positive = pts > 0;
                    return (
                      <div
                        key={tx.id}
                        className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow group"
                      >
                        <div className="flex items-center gap-5">
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                              positive ? "bg-green-50 text-green-500" : "bg-orange-50 text-[#F26522]"
                            }`}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
                              <path
                                d={positive ? "M12 8V16M8 12H16" : "M8 12H16"}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-[#1E2633] group-hover:text-primary transition-colors">{tx.title}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                              {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                              • {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {tx.site ? ` • ${tx.site}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-2xl font-black ${
                              positive ? "text-green-500" : "text-[#F26522]"
                            }`}
                          >
                            {positive ? `+${pts.toLocaleString()}` : pts.toLocaleString()}
                          </p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">POINTS</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-[40px] p-20 text-center text-gray-400 border border-dashed border-gray-200">
                    <p className="text-lg font-medium italic">No transactions found for this period.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 pb-12">
              <button
                type="button"
                className="flex items-center gap-3 bg-gray-50 text-gray-500 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-colors border border-gray-100 shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16L12 8M12 16L9 13M12 16L15 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 20H18C19.1046 20 20 19.1046 20 18V12M4 12V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Export Ledger (CSV)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTransactions;
