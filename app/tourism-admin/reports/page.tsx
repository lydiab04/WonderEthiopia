"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronRight,
  MessageSquare,
  Clock,
  ShieldCheck,
  History,
  AlertOctagon,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface Report {
  _id: string;
  reason: string;
  description: string;
  status: string;
  adminNotes: string;
  reporterId: { name: string; email: string };
  businessId: { _id: string; name: string };
  reviewedBy: { name: string } | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "Awaiting Triage", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Clock className="w-3.5 h-3.5" /> },
  under_review: { label: "Under Review", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  recommended_action: { label: "Action Recommended", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  recommended_dismiss: { label: "Dismissal Recommended", color: "text-rose-600", bg: "bg-rose-50 border-rose-100", icon: <XCircle className="w-3.5 h-3.5" /> },
  resolved: { label: "Resolved by Super Admin", color: "text-primary", bg: "bg-primary/5 border-primary/10", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  dismissed: { label: "Closed / Dismissed", color: "text-foreground/40", bg: "bg-foreground/[0.02] border-foreground/[0.05]", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function TourismAdminReportsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionNote, setActionNote] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Role guard
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    } else if (sessionStatus === "authenticated" && session?.user?.role !== "tourism_admin") {
      router.push("/unauthorized");
    }
  }, [session, sessionStatus, router]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const url = filter === "all" ? "/api/reports" : `/api/reports?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.role === "tourism_admin") {
      fetchReports();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, session, sessionStatus]);

  const handleAction = async (id: string, newStatus: string) => {
    if (!actionNote.trim()) {
      setErrorMsg("Please provide triage notes before submitting.");
      return;
    }
    setErrorMsg("");
    try {
      setSubmitting(true);
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: actionNote,
        }),
      });
      if (res.ok) {
        setActingOn(null);
        setActionNote("");
        fetchReports();
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionStatus !== "authenticated" || session?.user?.role !== "tourism_admin") {
    return null;
  }

  return (
    <div className="bg-background text-foreground font-sans min-h-screen">
      <main className="relative z-10 max-w-7xl mx-auto px-3 md:px-4 lg:px-5 py-10 lg:py-20">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-foreground/40 hover:text-primary transition-all bg-white/50 backdrop-blur-xl px-5 py-2.5 rounded-full border border-foreground/5 shadow-sm font-bold text-xs mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Command Hub
        </Link>

        {/* Title & Filters */}
        <div className="animate-fade-in mb-16 px-4">
          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">
                Institutional Oversight — Stage 1
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-tight">
              Platform Integrity <br /> Monitoring
            </h1>
            <p className="text-foreground/40 text-lg font-medium italic">
              Review and triage tourist-submitted reports. Forward serious violations to Super Admin for final action.
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {["all", "pending", "under_review", "recommended_action", "recommended_dismiss"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-8 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-2xl border transition-all duration-300 whitespace-nowrap ${
                  filter === f
                    ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105"
                    : "bg-white text-foreground/30 border-foreground/5 hover:border-primary/20 hover:text-primary"
                }`}
              >
                {f.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <span className="text-[10px] font-black tracking-widest uppercase text-foreground/20">Syncing Grievance Registry...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-48 bg-white/50 rounded-[60px] border-4 border-dashed border-foreground/5">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary/20">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground/40 mb-2">Registry is Clear</h3>
            <p className="text-foreground/20 font-medium italic">No active tourist grievances found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-8 px-4">
            {reports.map((report, i) => {
              const sc = statusConfig[report.status] || statusConfig.pending;
              return (
                <div
                  key={report._id}
                  className="bg-white rounded-[50px] p-10 md:p-12 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up group"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[28px] bg-red-50 text-red-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
                        <AlertOctagon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground tracking-tight mb-1 capitalize group-hover:text-primary transition-colors">
                          {report.reason.replace(/_/g, " ")}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-black uppercase tracking-widest text-primary/40 flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> {report.businessId?.name}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-foreground/10" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-foreground/30 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-5 py-2 rounded-full border ${sc.bg} ${sc.color} flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm shrink-0`}>
                      {sc.icon} {sc.label}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-foreground/[0.01] border border-foreground/[0.02] p-8 rounded-[32px] mb-10">
                    <p className="text-lg text-foreground/60 font-medium leading-relaxed italic">
                      &ldquo;{report.description}&rdquo;
                    </p>
                  </div>

                  {/* Existing admin notes */}
                  {report.adminNotes && (
                    <div className="mb-10 p-8 rounded-[32px] border border-blue-100 bg-blue-50/30">
                      <div className="flex items-center gap-4 mb-4">
                        <History className="w-5 h-5 text-blue-600" />
                        <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">Your Triage Notes</span>
                      </div>
                      <p className="text-base text-foreground/60 italic font-medium leading-relaxed bg-white/60 p-6 rounded-[24px] border border-blue-200/50">
                        &ldquo;{report.adminNotes}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Reporter info + Actions */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pt-8 border-t border-foreground/[0.03]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/30">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20 block mb-0.5">Reporter</span>
                        <span className="text-[13px] font-bold text-foreground/60">
                          {report.reporterId?.name}
                          <span className="text-[11px] font-medium italic ml-2 text-foreground/30">{report.reporterId?.email}</span>
                        </span>
                      </div>
                    </div>

                    {actingOn === report._id ? (
                      <div className="w-full lg:max-w-xl space-y-5 animate-fade-in">
                        <textarea
                          value={actionNote}
                          onChange={(e) => { setActionNote(e.target.value); setErrorMsg(""); }}
                          placeholder="Enter your triage analysis and initial review notes..."
                          className="w-full px-8 py-5 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[32px] text-foreground text-sm font-bold placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                          rows={3}
                        />
                        {errorMsg && (
                          <p className="text-red-500 text-[11px] font-black uppercase tracking-widest px-4">{errorMsg}</p>
                        )}
                        <div className="flex gap-4 flex-wrap">
                          <button
                            disabled={submitting}
                            onClick={() => handleAction(report._id, "under_review")}
                            className="flex-1 px-8 py-4 bg-blue-500 text-white text-[10px] font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50"
                          >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Mark Under Review</>}
                          </button>
                          <button
                            disabled={submitting}
                            onClick={() => handleAction(report._id, "recommended_action")}
                            className="flex-1 px-8 py-4 bg-primary text-white text-[10px] font-black rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50"
                          >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Recommend Action</>}
                          </button>
                          <button
                            disabled={submitting}
                            onClick={() => handleAction(report._id, "recommended_dismiss")}
                            className="flex-1 px-8 py-4 bg-white border border-red-100 text-red-600 text-[10px] font-black rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50"
                          >
                            Recommend Dismissal
                          </button>
                          <button
                            onClick={() => { setActingOn(null); setActionNote(""); setErrorMsg(""); }}
                            className="px-3 md:px-4 lg:px-5 py-4 text-[10px] font-black text-foreground/20 hover:text-foreground uppercase tracking-widest"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActingOn(report._id)}
                        className="px-10 py-5 bg-foreground text-background text-[11px] font-black rounded-2xl hover:bg-primary transition-all uppercase tracking-[0.2em] flex items-center gap-4 shadow-xl shadow-foreground/10 shrink-0"
                      >
                        Triage Report <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
