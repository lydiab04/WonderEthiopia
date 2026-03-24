"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Report {
  _id: string;
  reason: string;
  description: string;
  status: string;
  adminNotes: string;
  superAdminDecision: string;
  reporterId: { name: string; email: string };
  businessId: { name: string };
  reviewedBy: { name: string } | null;
  createdAt: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionNote, setActionNote] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
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

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: actionNote }),
      });
      if (res.ok) {
        setActingOn(null);
        setActionNote("");
        fetchReports();
      }
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    under_review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    action_taken: "bg-green-500/10 text-green-400 border-green-500/20",
    dismissed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              WondarEthiopia
            </Link>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400 text-sm">Report Management</span>
          </div>
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Manage Reports</h2>
          <div className="flex gap-2">
            {["all", "pending", "under_review", "action_taken", "dismissed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-300 capitalize ${
                  filter === f
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "text-gray-400 border-gray-700 hover:border-gray-600"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No reports found.</div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {report.reason.replace("_", " ")}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Against: {report.businessId?.name} • By: {report.reporterId?.name}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border capitalize ${statusColors[report.status] || ""}`}>
                    {report.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-gray-300 text-sm mb-4">{report.description}</p>

                {/* Tourism Admin Notes */}
                {report.adminNotes && (
                  <div className="bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-blue-400">Tourism Admin Notes:</span>{" "}
                      {report.adminNotes}
                    </p>
                    {report.reviewedBy && (
                      <p className="text-gray-500 text-xs mt-1">By: {report.reviewedBy.name}</p>
                    )}
                  </div>
                )}

                {/* Action Panel */}
                {actingOn === report._id ? (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 space-y-3">
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Decision notes..."
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(report._id, "action_taken")}
                        className="px-4 py-2 text-sm bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all"
                      >
                        Take Action
                      </button>
                      <button
                        onClick={() => handleAction(report._id, "dismissed")}
                        className="px-4 py-2 text-sm bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-lg hover:bg-gray-500/20 transition-all"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => { setActingOn(null); setActionNote(""); }}
                        className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:border-gray-600 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActingOn(report._id)}
                    className="px-4 py-2 text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-all"
                  >
                    Execute Decision
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
