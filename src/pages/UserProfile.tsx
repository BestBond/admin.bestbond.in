import { useState, useEffect, useCallback } from "react";
import { useRefetchOnDocumentVisible } from "../utils/useRefetchOnDocumentVisible";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { MdAddCircleOutline, MdBlock, MdDeleteForever } from "react-icons/md";
import api from "../utils/api";
import Swal from "sweetalert2";
import type { AdminUserDetail } from "../utils/types";

function canSuspendAccounts(): boolean {
  try {
    const raw = localStorage.getItem("userPermissions");
    const p = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(p) && p.includes("rbac.manage");
  } catch {
    return false;
  }
}

function canDeleteAccounts(): boolean {
  try {
    const raw = localStorage.getItem("userPermissions");
    const p = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(p) && p.includes("users.delete");
  } catch {
    return false;
  }
}

function canManagePoints(): boolean {
  try {
    const raw = localStorage.getItem("userPermissions");
    const p = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(p) && p.includes("points.manage");
  } catch {
    return false;
  }
}

const MAX_POINTS_ADJUSTMENT = 10_000;

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isAddPointsModalOpen, setIsAddPointsModalOpen] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  const [isAddingPoints, setIsAddingPoints] = useState(false);

  const fetchUserDetail = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!userId) return;
      if (!opts?.silent) setLoading(true);
      try {
        const res = await api.get(`/admin/users/${userId}`);
        setUser(res.data);
      } catch (error) {
        console.error("FETCH USER DETAIL ERROR", error);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void fetchUserDetail();
  }, [fetchUserDetail]);

  useRefetchOnDocumentVisible(() => {
    void fetchUserDetail({ silent: true });
  });

  const handleSuspendSubmit = async () => {
    if (!suspensionReason || !user) return;
    setIsSuspending(true);
    try {
      await api.post(`/admin/users/${user.id}/suspend`, 
        { reason: suspensionReason }
      );
      
      Swal.fire({
        title: 'Suspended!',
        text: 'User account has been suspended.',
        icon: 'success',
        confirmButtonColor: '#1E2633',
        customClass: { popup: 'rounded-[32px]' }
      });

      // Refresh data
      const res = await api.get(`/admin/users/${userId}`);
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

  const handleDeleteSubmit = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/users/${user.id}`);
      setIsDeleteModalOpen(false);
      setDeleteConfirmText("");
      await Swal.fire({
        title: 'Deleted!',
        text: 'User account has been permanently deleted.',
        icon: 'success',
        confirmButtonColor: '#1E2633',
        customClass: { popup: 'rounded-[32px]' },
      });
      navigate('/users');
    } catch (error) {
      console.error("DELETE USER ERROR", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to delete account';
      Swal.fire('Error', message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const parsedPoints = Number(pointsToAdd);
  const isPointsValid =
    Number.isInteger(parsedPoints) &&
    parsedPoints > 0 &&
    parsedPoints <= MAX_POINTS_ADJUSTMENT;
  const isReasonValid = pointsReason.trim().length >= 3;

  const handleAddPointsSubmit = async () => {
    if (!user || !isPointsValid || !isReasonValid) return;
    setIsAddingPoints(true);
    try {
      await api.post(`/admin/users/${user.id}/points/adjust`, {
        points: parsedPoints,
        reason: pointsReason.trim(),
      });

      Swal.fire({
        title: "Points Added!",
        text: `${parsedPoints} points credited to ${displayLabel}.`,
        icon: "success",
        confirmButtonColor: "#1E2633",
        customClass: { popup: "rounded-[32px]" },
      });

      const res = await api.get(`/admin/users/${userId}`);
      setUser(res.data);
      setIsAddPointsModalOpen(false);
      setPointsToAdd("");
      setPointsReason("");
    } catch (error) {
      console.error("ADD POINTS ERROR", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to add points";
      Swal.fire("Error", Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setIsAddingPoints(false);
    }
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

  const displayLabel = user.displayName || user.fullName?.trim() || "User";
  const isActive = user.status === "ACTIVE";
  const showSuspend = canSuspendAccounts();
  const showDelete = canDeleteAccounts();

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
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayLabel)}&background=random&color=fff`}
                      alt={displayLabel}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`flex items-center gap-2 mt-4 px-4 py-1 rounded-full w-fit ${isActive ? "bg-green-50" : "bg-red-50"}`}>
                    <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                    <span className={`text-[8px] font-medium uppercase tracking-widest ${isActive ? "text-green-500" : "text-red-500"}`}>STATUS: {user.status}</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[#1E2633] mt-3 font-bricolage">{displayLabel}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-normal text-primary">{user.profession || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showSuspend ? (
                  <button
                    type="button"
                    onClick={handleSuspend}
                    className="w-14 h-14 text-primary cursor-pointer transition-all"
                    aria-label="Suspend account"
                  >
                    <MdBlock className="text-3xl" />
                  </button>
                ) : null}
                {showDelete ? (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-14 h-14 text-red-600 cursor-pointer transition-all"
                    aria-label="Delete account"
                  >
                    <MdDeleteForever className="text-3xl" />
                  </button>
                ) : null}
              </div>
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
                <div className="pt-6 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">LAST UPDATED</p>
                    <p className="text-sm font-bold text-[#1E2633] mt-1 font-bricolage">{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "N/A"}</p>
                  </div>
                  {canManagePoints() ? (
                    <button
                      type="button"
                      onClick={() => setIsAddPointsModalOpen(true)}
                      className="flex items-center gap-2 text-primary font-bold hover:opacity-80 transition-opacity"
                    >
                      <MdAddCircleOutline className="text-2xl" />
                      <span>Add Points</span>
                    </button>
                  ) : null}
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
                  <p className="text-xl font-bold text-[#1E2633] font-bricolage">{user.phone ?? "—"}</p>
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
              <div className="flex items-center gap-8">
                {showSuspend ? (
                  <button
                    type="button"
                    onClick={handleSuspend}
                    className="flex items-center gap-3 text-primary font-bold hover:opacity-80 transition-opacity"
                  >
                    <MdBlock className="text-2xl" />
                    <span>Suspend Account</span>
                  </button>
                ) : null}
                {showDelete ? (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-3 text-red-600 font-bold hover:opacity-80 transition-opacity"
                  >
                    <MdDeleteForever className="text-2xl" />
                    <span>Delete Account</span>
                  </button>
                ) : null}
              </div>

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

      {/* Custom Add Points Modal */}
      {isAddPointsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#1E2633]/40 backdrop-blur-sm"
            onClick={() => {
              setIsAddPointsModalOpen(false);
              setPointsToAdd("");
              setPointsReason("");
            }}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-[40px] p-10 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-bold text-[#1E2633] mb-2">Add Points</h2>
            <p className="text-sm text-gray-500 mb-8">
              Manually credit {displayLabel}'s wallet. Max {MAX_POINTS_ADJUSTMENT.toLocaleString()} points per action.
              This cannot be undone from here — deduct manually if you make a mistake.
            </p>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">
                  POINTS TO ADD
                </label>
                <input
                  type="number"
                  min={1}
                  max={MAX_POINTS_ADJUSTMENT}
                  placeholder="e.g. 100"
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(e.target.value)}
                  className="w-full bg-white mt-2 border-2 border-border rounded-[28px] p-6 outline-none focus:ring-2 focus:ring-[#A73A00]/10 transition-all text-lg"
                />
                {pointsToAdd && !isPointsValid ? (
                  <p className="text-xs text-red-600 ml-2">
                    Enter a whole number between 1 and {MAX_POINTS_ADJUSTMENT.toLocaleString()}.
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">
                  REASON (REQUIRED, RECORDED FOR AUDIT)
                </label>
                <textarea
                  placeholder="Why are you adding these points?"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full bg-white mt-2 border-2 border-border rounded-[28px] p-6 min-h-[120px] outline-none focus:ring-2 focus:ring-[#A73A00]/10 transition-all text-lg resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-4 mt-5">
              <button
                onClick={handleAddPointsSubmit}
                disabled={!isPointsValid || !isReasonValid || isAddingPoints}
                className="flex-1 bg-brand-orange-dark text-white py-3 rounded-full font-normal text-sm shadow-xl disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {isAddingPoints ? (
                  <div className="w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Confirm & Add Points"
                )}
              </button>
              <button
                onClick={() => {
                  setIsAddPointsModalOpen(false);
                  setPointsToAdd("");
                  setPointsReason("");
                }}
                className="flex-1 bg-white text-text-primary py-3 rounded-full font-normal text-sm border border-border shadow-sm hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#1E2633]/40 backdrop-blur-sm"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeleteConfirmText("");
            }}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-[40px] p-10 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-bold text-red-600 mb-4">Delete this Account?</h2>
            <p className="text-sm text-gray-500 mb-8">
              This permanently deletes {displayLabel}'s account and all of their wallet points and
              redemption history. This action cannot be undone.
            </p>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">
                TYPE "DELETE" TO CONFIRM
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full bg-white mt-2 border-2 border-border rounded-[28px] p-6 outline-none focus:ring-2 focus:ring-red-600/10 transition-all text-lg"
              />
            </div>

            <div className="flex gap-4 mt-5">
              <button
                onClick={handleDeleteSubmit}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="flex-1 bg-red-600 text-white py-3 rounded-full font-normal text-sm shadow-xl disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {isDeleting ? (
                  <div className="w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Permanently Delete"
                )}
              </button>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 bg-white text-text-primary py-3 rounded-full font-normal text-sm border border-border shadow-sm hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
