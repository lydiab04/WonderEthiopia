"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

interface Business {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  permitNumber: string;
  documents: string[];
  applicantName: string;
  location: { region: string; city: string; address: string };
  ownerId: { name: string; email: string } | null;
  contactPhone: string;
  contactEmail: string;
  industryDetails?: Record<string, any>;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending Review", color: "text-yellow-400", bg: "bg-yellow-500/[0.08] border-yellow-500/20" },
  recommended_approve: { label: "Recommended ✅", color: "text-emerald-400", bg: "bg-emerald-500/[0.08] border-emerald-500/20" },
  recommended_reject: { label: "Recommended ❌", color: "text-rose-400", bg: "bg-rose-500/[0.08] border-rose-500/20" },
  approved: { label: "Approved", color: "text-green-400", bg: "bg-green-500/[0.08] border-green-500/20" },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/[0.08] border-red-500/20" },
};

export default function TourismAdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionNote, setActionNote] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const url = filter === "all" ? "/api/businesses" : `/api/businesses?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleRecommend = async (id: string, action: string) => {
    try {
      const loadingToast = toast.loading(`Submitting recommendation...`);
      const res = await fetch(`/api/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: actionNote }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.update(loadingToast, { render: data.message || "Recommendation submitted!", type: "success", isLoading: false, autoClose: 5000 });
        setActingOn(null);
        setActionNote("");
        fetchBusinesses();
      } else {
        toast.update(loadingToast, { render: data.error || "Failed", type: "error", isLoading: false, autoClose: 5000 });
      }
    } catch (error: any) {
      console.error("Recommendation failed:", error);
      toast.error(error.message || "An unexpected error occurred");
    }
  };

  const filters = ["all", "pending", "recommended_approve", "recommended_reject", "approved", "rejected"];

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="relative z-50 border-b border-white/[0.06]">
        <div className="glass">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/tourism-admin" className="text-lg font-extrabold tracking-tight gradient-text">
                WONDAR ETHIOPIA
              </Link>
              <span className="text-gray-800">|</span>
              <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">Business Review</span>
            </div>
            <Link href="/tourism-admin" className="px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Title & Filters */}
        <div className="animate-fade-in mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600">
              Tourism Admin
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-6">
            Review Business Registrations
          </h1>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-lg border whitespace-nowrap transition-all duration-300 capitalize ${
                  filter === f
                    ? "bg-amber-500/[0.1] text-amber-400 border-amber-500/30"
                    : "text-gray-600 border-white/[0.06] hover:border-white/[0.12] hover:text-gray-400"
                }`}
              >
                {f.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/[0.06]">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-gray-600 font-medium">No businesses found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map((biz, i) => {
              const sc = statusConfig[biz.status] || statusConfig.pending;
              return (
                <div
                  key={biz._id}
                  className="rounded-xl border border-white/[0.06] p-6 card-hover animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[16px] font-bold text-white mb-1">{biz.name}</h3>
                      <p className="text-[12px] text-gray-600 capitalize">
                        {biz.category.replace(/_/g, " ")} • {biz.location.city}, {biz.location.region}
                      </p>
                    </div>
                    <span className={`shrink-0 px-3 py-1 text-[11px] font-bold rounded-full border ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-gray-500 mb-4 leading-relaxed line-clamp-2">{biz.description}</p>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Applicant", value: biz.applicantName || biz.ownerId?.name || "N/A" },
                      { label: "Email", value: biz.contactEmail },
                      { label: "Permit", value: biz.permitNumber },
                      { label: "Address", value: biz.location.address },
                      ...(biz.contactPhone ? [{ label: "Phone", value: biz.contactPhone }] : []),
                    ].map((item) => (
                      <div key={item.label}>
                        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-0.5">
                          {item.label}
                        </span>
                        <span className="text-[13px] text-gray-400">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Industry Details */}
                  {biz.industryDetails && Object.keys(biz.industryDetails).length > 0 && (
                    <div className="mb-4 p-4 rounded-lg border border-white/[0.04] bg-white/[0.01]">
                      <span className="text-[11px] font-bold text-amber-500/80 uppercase tracking-widest block mb-2">
                        Industry Specific Information
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(biz.industryDetails).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-[10px] text-gray-700 font-bold uppercase block mb-0.5">{key.replace(/([A-Z])/g, ' $1')}</span>
                            {key === "documents" && Array.isArray(value) ? (
                              <div className="flex flex-col gap-1.5 mt-1">
                                {value.map((v: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={v.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[10px] bg-emerald-500/[0.08] px-2 py-1 rounded border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/[0.15] transition-all"
                                  >
                                    📄 {v.fileName || "View Document"}
                                  </a>
                                ))}
                              </div>
                            ) : Array.isArray(value) ? (
                              <div className="flex flex-wrap gap-1">
                                {value.map((v: any, idx: number) => (
                                  <span key={idx} className="text-[10px] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] text-gray-500">
                                    {v.fileName || String(v)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[12px] text-gray-500 font-medium">{String(value)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {biz.documents && biz.documents.length > 0 && (
                    <div className="mb-4 flex gap-2 flex-wrap">
                      {biz.documents.map((_, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white/[0.03] text-gray-500 text-[11px] font-medium rounded-lg border border-white/[0.06]">
                          📄 Document {idx + 1}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Panel */}
                  {actingOn === biz._id ? (
                    <div className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-3">
                      <textarea
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        placeholder="Add your recommendation notes..."
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-[13px] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                        rows={3}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleRecommend(biz._id, "recommended_approve")}
                          className="px-4 py-2 text-[13px] font-semibold bg-green-500/[0.08] text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/[0.15] transition-all"
                        >
                          ✅ Recommend Approval
                        </button>
                        <button
                          onClick={() => handleRecommend(biz._id, "recommended_reject")}
                          className="px-4 py-2 text-[13px] font-semibold bg-red-500/[0.08] text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/[0.15] transition-all"
                        >
                          ❌ Recommend Rejection
                        </button>
                        <button
                          onClick={() => { setActingOn(null); setActionNote(""); }}
                          className="px-4 py-2 text-[13px] font-medium text-gray-500 border border-white/[0.06] rounded-lg hover:border-white/[0.12] transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {biz.status === "pending" ? (
                        <button
                          onClick={() => setActingOn(biz._id)}
                          className="px-4 py-2 text-[13px] font-semibold bg-amber-500/[0.08] text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/[0.15] transition-all"
                        >
                          Review & Recommend
                        </button>
                      ) : (
                        <p className="text-[12px] text-gray-700 italic">Action already taken</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
