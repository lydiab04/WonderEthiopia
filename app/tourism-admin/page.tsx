"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import NotificationCenter from "@/components/admin/NotificationCenter";

export default function TourismAdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    pendingBusinesses: 0,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [bizRes, reportRes] = await Promise.all([
          fetch("/api/businesses?status=pending"),
          fetch("/api/reports?status=pending"),
        ]);
        const bizData = await bizRes.json();
        const reportData = await reportRes.json();

        setStats({
          pendingBusinesses: (bizData.businesses || []).length,
          pendingReports: (reportData.reports || []).length,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Pending Businesses", value: stats.pendingBusinesses, gradient: "from-amber-500 to-orange-500", icon: "🏢", alert: true },
    { label: "Pending Reports", value: stats.pendingReports, gradient: "from-rose-500 to-red-500", icon: "📋", alert: true },
  ];

  const quickActions = [
    {
      label: "Review Businesses",
      href: "/tourism-admin/businesses",
      icon: "🏢",
      desc: "Review business registrations and recommend approval or rejection to the Super Admin.",
      badge: stats.pendingBusinesses > 0 ? `${stats.pendingBusinesses} pending` : null,
    },
    {
      label: "Review Reports",
      href: "/tourism-admin/reports",
      icon: "📋",
      desc: "Review tourist reports and make initial review decisions.",
      badge: stats.pendingReports > 0 ? `${stats.pendingReports} pending` : null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[400px] -left-[400px] w-[800px] h-[800px] bg-emerald-500/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/[0.06]">
        <div className="glass">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-lg font-extrabold tracking-tight gradient-text">
                WONDAR ETHIOPIA
              </Link>
              <span className="text-gray-800">|</span>
              <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">Tourism Admin</span>
            </div>
            <nav className="flex items-center gap-1">
              {[
                { label: "Businesses", href: "/tourism-admin/businesses" },
                { label: "Reports", href: "/tourism-admin/reports" },
                { label: "Dashboard", href: "/dashboard" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="animate-fade-in mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600">
              Review Center
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
            Tourism Admin Dashboard
          </h1>
          <p className="text-[15px] text-gray-600">
            Welcome back, {session?.user?.name}. Review and moderate platform activity.
          </p>
        </div>

        <div className="mb-10">
          <NotificationCenter />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {statCards.map((card, i) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-white/[0.06] p-6 card-hover animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{card.icon}</span>
                    {card.alert && card.value > 0 && (
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className={`text-3xl font-extrabold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent mb-1`}>
                    {card.value}
                  </div>
                  <p className="text-[13px] text-gray-600 font-medium">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600 mb-5">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, i) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group relative overflow-hidden rounded-xl border border-white/[0.06] p-6 card-hover animate-slide-up"
                    style={{ animationDelay: `${(i + 2) * 0.1}s`, opacity: 0 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <span className="text-2xl mb-3 block">{action.icon}</span>
                      <h3 className="text-[15px] font-semibold text-white group-hover:text-amber-400 transition-colors mb-1">
                        {action.label}
                      </h3>
                      <p className="text-[13px] text-gray-600 leading-relaxed">
                        {action.desc}
                      </p>
                      {action.badge && (
                        <span className="inline-block mt-3 px-2.5 py-1 bg-amber-500/[0.08] text-amber-400 text-[11px] font-bold rounded-full border border-amber-500/20">
                          {action.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
