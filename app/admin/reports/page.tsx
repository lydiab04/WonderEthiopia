"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
  Gavel,
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
  superAdminDecision: string;
  reporterId: { name: string; email: string };
  businessId: { _id: string; name: string };
  reviewedBy: { name: string } | null;
  decidedBy: { name: string } | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "Pending Triage", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Clock className="w-3.5 h-3.5" /> },
  under_review: { label: "Under Review", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  recommended_action: { label: "Action Recommended", color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  recommended_dismiss: { label: "Dismiss Recommended", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  resolved: { label: "Resolution Complete", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  dismissed: { label: "Closed / Dismissed", color: "text-foreground/40", bg: "bg-foreground/[0.02] border-foreground/[0.05]", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function AdminReportsPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionNote, setActionNote] = useState("");
  const [superDecision, setSuperDecision] = useState("");
  const [suspendBusiness, setSuspendBusiness] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    fetchReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAction = async (id: string, status: string) => {
    try {
      setSubmitting(true);
      const payload: any = {
        status,
        adminNotes: actionNote,
      };
      if (isSuperAdmin) {
        payload.superAdminDecision = superDecision;
        payload.suspendBusiness = suspendBusiness;
      }
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setActingOn(null);
        setActionNote("");
        setSuperDecision("");
        setSuspendBusiness(false);
        fetchReports();
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="max-w-4xl mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">
                {isSuperAdmin ? "Grievance Master Terminal" : "Institutional Oversight"}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-tight">
              {isSuperAdmin ? <>Final Registry <br /> Determinations</> : <>Platform Integrity <br /> Monitoring</>}
            </h1>
            <p className="text-foreground/40 text-lg font-medium italic">
              {isSuperAdmin
                ? "Super Admin terminal for executing final resolutions on reported platform entities."
                : "Verification and initial triage of tourist-submitted grievances."}
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {["all", "escalated", "resolved", "dismissed"].map((f) => (
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
            <span className="text-[10px] font-black tracking-widest uppercase text-foreground/20">Syncing Report Registry...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-48 bg-white/50 rounded-[60px] border-4 border-dashed border-foreground/5">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary/20">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-foreground/40 mb-2">Registry Quiescent</h3>
            <p className="text-foreground/20 font-medium italic">No grievances require resolution at this time.</p>
          </div>
        ) : (
          <div className="space-y-10 px-4">
            {reports.map((report, i) => {
              const sc = statusConfig[report.status] || statusConfig.pending;
              return (
                <div
                  key={report._id}
                  className="bg-white rounded-[60px] p-10 md:p-14 shadow-2xl shadow-foreground/5 border border-foreground/[0.03] animate-slide-up group"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex flex-col lg:flex-row items-start gap-12">
                    <div className="flex-1 w-full">

                      {/* Identity Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                        <div className="flex items-center gap-8">
                          <div className="w-20 h-20 rounded-[32px] bg-red-50 text-red-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
                            <AlertOctagon className="w-10 h-10" />
                          </div>
                          <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tighter mb-1 capitalize group-hover:text-primary transition-colors leading-none">
                              {report.reason.replace(/_/g, " ")}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/50 flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" /> {report.businessId?.name}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-foreground/10" />
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 md:px-4 lg:px-5 py-2.5 rounded-full border ${sc.bg} ${sc.color} flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm shrink-0`}>
                          {sc.icon} {sc.label}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-foreground/[0.01] border border-foreground/[0.02] p-8 rounded-[40px] mb-10">
                        <p className="text-lg text-foreground/60 font-medium leading-relaxed italic">
                          &ldquo;{report.description}&rdquo;
                        </p>
                      </div>

                      {/* Admin Notes Block (visible to super admin) */}
                      {report.adminNotes && (
                        <div className="mb-10 p-10 rounded-[40px] border border-blue-100 bg-blue-50/30">
                          <div className="flex items-center gap-4 mb-6">
                            <History className="w-5 h-5 text-blue-600" />
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">
                              Tourism Admin Triage Notes
                            </span>
                          </div>
                          <p className="text-base text-foreground/60 italic font-medium leading-relaxed bg-white/60 p-6 rounded-[28px] border border-blue-200/50 mb-6">
                            &ldquo;{report.adminNotes}&rdquo;
                          </p>
                          {report.reviewedBy && (
                            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-foreground/30">
                              <div className="w-6 h-6 rounded-lg bg-blue-200 flex items-center justify-center text-blue-700 text-[10px]">
                                {report.reviewedBy.name[0]}
                              </div>
                              Reviewed by {report.reviewedBy.name}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Super Admin Decision Block */}
                      {report.superAdminDecision && (
                        <div className="mb-10 p-10 rounded-[40px] border border-emerald-100 bg-emerald-50/30">
                          <div className="flex items-center gap-4 mb-6">
                            <Gavel className="w-5 h-5 text-emerald-600" />
                            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em]">
                              Final Super Admin Decision
                            </span>
                          </div>
                          <p className="text-base text-foreground/60 italic font-medium leading-relaxed bg-white/60 p-6 rounded-[28px] border border-emerald-200/50 mb-6">
                            &ldquo;{report.superAdminDecision}&rdquo;
                          </p>
                          {report.decidedBy && (
                            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-foreground/30">
                              <div className="w-6 h-6 rounded-lg bg-emerald-200 flex items-center justify-center text-emerald-700 text-[10px]">
                                {report.decidedBy.name[0]}
                              </div>
                              Decided by {report.decidedBy.name}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reporter & Action Row */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 pt-10 border-t border-foreground/[0.03]">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/30">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20 block mb-0.5">Reporter Entity</span>
                            <span className="text-[14px] font-bold text-foreground/60">
                              {report.reporterId?.name}
                              <span className="text-[12px] font-medium italic ml-2 text-foreground/30">
                                {report.reporterId?.email}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {actingOn === report._id ? (
                          <div className="w-full lg:max-w-2xl space-y-6 animate-fade-in">
                            {/* Admin Notes textarea */}
                            <textarea
                              value={actionNote}
                              onChange={(e) => setActionNote(e.target.value)}
                              placeholder={isSuperAdmin ? "Enter final institutional determination..." : "Enter initial triage notes..."}
                              className="w-full px-8 py-5 bg-foreground/[0.02] border border-foreground/[0.05] rounded-[32px] text-foreground text-sm font-bold placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                              rows={2}
                            />

                            {/* Super Admin Only: Final Decision + Suspension */}
                            {isSuperAdmin && (
                              <>
                                <textarea
                                  value={superDecision}
                                  onChange={(e) => setSuperDecision(e.target.value)}
                                  placeholder="Write the official final decision statement..."
                                  className="w-full px-8 py-5 bg-primary/[0.02] border border-primary/10 rounded-[32px] text-foreground text-sm font-bold placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                  rows={2}
                                />
                                <label className="flex items-center gap-4 px-3 md:px-4 lg:px-5 py-4 bg-red-50 rounded-[24px] border border-red-100 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={suspendBusiness}
                                    onChange={(e) => setSuspendBusiness(e.target.checked)}
                                    className="w-5 h-5 rounded accent-red-500"
                                  />
                                  <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">
                                    Suspend Business Immediately
                                  </span>
                                </label>
                              </>
                            )}

                            <div className="flex gap-4 flex-wrap">
                              <button
                                disabled={submitting}
                                onClick={() => handleAction(report._id, "resolved")}
                                className="flex-1 px-10 py-5 bg-primary text-white text-[11px] font-black rounded-2xl hover:bg-primary-hover transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-[0.2em] disabled:opacity-50"
                              >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Gavel className="w-4 h-4" /> {isSuperAdmin ? "Execute Final Decision" : "Mark Under Review"}</>}
                              </button>
                              <button
                                disabled={submitting}
                                onClick={() => handleAction(report._id, "dismissed")}
                                className="flex-1 px-10 py-5 bg-white border border-foreground/10 text-foreground/40 text-[11px] font-black rounded-2xl hover:bg-foreground hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] disabled:opacity-50"
                              >
                                {isSuperAdmin ? "Final Dismissal" : "Dismiss Record"}
                              </button>
                              <button
                                onClick={() => { setActingOn(null); setActionNote(""); setSuperDecision(""); setSuspendBusiness(false); }}
                                className="px-3 md:px-4 lg:px-5 py-5 text-[11px] font-black text-foreground/20 hover:text-foreground uppercase tracking-widest"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActingOn(report._id)}
                            className="px-10 py-5 bg-foreground text-background text-[11px] font-black rounded-2xl hover:bg-primary transition-all active:scale-95 uppercase tracking-[0.2em] flex items-center gap-4 shadow-xl shadow-foreground/10 shrink-0"
                          >
                            {isSuperAdmin ? "Final Determination" : "Initialize Resolution"}
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
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
