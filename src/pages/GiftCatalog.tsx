import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import api from "../utils/api";
import { useRefetchOnDocumentVisible } from "../utils/useRefetchOnDocumentVisible";
import type { AdminRewardDto, GiftTier } from "../utils/types";
import { rewardImageSrc } from "../utils/rewardImage";

function formatPoints(n: number): string {
  return n.toLocaleString("en-IN");
}

const GiftCatalog = () => {
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<AdminRewardDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [tierFilter, setTierFilter] = useState<"all" | GiftTier>("all");
  const [editing, setEditing] = useState<AdminRewardDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsCost: 1000,
    giftTier: "WORKER" as GiftTier,
    imageUrl: "",
    sortOrder: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchGifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<AdminRewardDto[]>("/admin/rewards");
      setGifts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("FETCH GIFTS ERROR", error);
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGifts();
  }, [fetchGifts]);

  useRefetchOnDocumentVisible(() => {
    void fetchGifts();
  });

  const visibleGifts = useMemo(() => {
    if (tierFilter === "all") return gifts;
    return gifts.filter((g) => g.giftTier === tierFilter);
  }, [gifts, tierFilter]);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({
      title: "",
      description: "",
      pointsCost: 1000,
      giftTier: "WORKER",
      imageUrl: "",
      sortOrder: 0,
      isActive: true,
    });
  };

  const openEdit = (gift: AdminRewardDto) => {
    setCreating(false);
    setEditing(gift);
    setForm({
      title: gift.title,
      description: gift.description ?? "",
      pointsCost: gift.pointsCost,
      giftTier: gift.giftTier,
      imageUrl: gift.imageUrl ?? "",
      sortOrder: gift.sortOrder,
      isActive: gift.isActive,
    });
  };

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
  };

  const saveGift = async () => {
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        pointsCost: Number(form.pointsCost),
        giftTier: form.giftTier,
        imageUrl: form.imageUrl.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (creating) {
        await api.post("/admin/rewards", body);
      } else if (editing) {
        await api.patch(`/admin/rewards/${editing.id}`, body);
      }
      closeModal();
      await fetchGifts();
    } catch (error) {
      console.error("SAVE GIFT ERROR", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (gift: AdminRewardDto) => {
    try {
      await api.post(`/admin/rewards/${gift.id}/toggle-active`);
      await fetchGifts();
    } catch (error) {
      console.error("TOGGLE GIFT ERROR", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Header title="Gift Catalog" />

        <div className="p-8 max-w-6xl mx-auto w-full flex-1">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 12H5M5 12L12 19M5 12L12 5"
                    stroke="#1E2633"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-[#1E2633] font-bricolage">
                Gift Catalog
              </h1>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="bg-primary hover:bg-[#D9541E] text-white px-6 py-3 rounded-full font-bold text-sm"
            >
              Add Gift
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Slab gifts for Worker (balance &lt; 2,000,000 pts) and Contractor
            (balance ≥ 2,000,000 pts). Users see tier-specific catalogs in the
            mobile app.
          </p>

          <div className="flex gap-3 mb-6">
            {(["all", "WORKER", "CONTRACTOR"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTierFilter(t)}
                className={`px-6 py-2 rounded-full font-semibold text-sm border ${
                  tierFilter === t
                    ? "bg-text-primary text-white border-text-primary"
                    : "bg-white text-text-primary border-border"
                }`}
              >
                {t === "all" ? "All tiers" : t === "WORKER" ? "Worker" : "Contractor"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E2633]" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Points</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleGifts.map((gift) => {
                    const src = gift.imageUrl
                      ? rewardImageSrc(gift.imageUrl)
                      : null;
                    return (
                      <tr key={gift.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          {src ? (
                            <img
                              src={src}
                              alt={gift.title}
                              className="w-14 h-14 object-contain rounded-lg bg-gray-50"
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1E2633]">
                          {gift.title}
                        </td>
                        <td className="px-4 py-3">
                          {formatPoints(gift.pointsCost)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              gift.giftTier === "CONTRACTOR"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {gift.giftTier === "CONTRACTOR"
                              ? "Contractor"
                              : "Worker"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{gift.sortOrder}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              gift.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {gift.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(gift)}
                              className="text-primary font-semibold text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleActive(gift)}
                              className="text-gray-600 font-semibold text-xs"
                            >
                              {gift.isActive ? "Disable" : "Enable"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibleGifts.length === 0 && (
                <p className="text-center text-gray-500 py-12">No gifts found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {(editing || creating) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#1E2633] mb-4">
              {creating ? "Add Gift" : "Edit Gift"}
            </h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Title</span>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">
                  Description
                </span>
                <textarea
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">
                  Points cost
                </span>
                <input
                  type="number"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.pointsCost}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pointsCost: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Tier</span>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.giftTier}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      giftTier: e.target.value as GiftTier,
                    }))
                  }
                >
                  <option value="WORKER">Worker</option>
                  <option value="CONTRACTOR">Contractor</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">
                  Image URL (e.g. /gifts/iphone_15.png)
                </span>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">
                  Sort order
                </span>
                <input
                  type="number"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sortOrder: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                <span className="text-sm font-medium text-gray-600">Active</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-full border text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !form.title.trim()}
                onClick={() => void saveGift()}
                className="px-6 py-2 rounded-full bg-primary text-white text-sm font-bold disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftCatalog;
