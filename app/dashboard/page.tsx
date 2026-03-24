"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const roleConfig: Record<
  string,
  { title: string; subtitle: string; gradient: string; links: { label: string; href: string; icon: string; desc: string }[] }
> = {
  super_admin: {
    title: "Command Center",
    subtitle: "Full platform control and oversight",
    gradient: "from-rose-500 via-amber-500 to-orange-500",
    links: [
      { label: "Admin Dashboard", href: "/admin", icon: "⚡", desc: "System overview and analytics" },
      { label: "Manage Businesses", href: "/admin/businesses", icon: "🏢", desc: "Review and approve applications" },
      { label: "Manage Reports", href: "/admin/reports", icon: "📋", desc: "Handle platform reports" },
      { label: "Manage Users", href: "/admin/users", icon: "👥", desc: "User roles and permissions" },
    ],
  },
  tourism_admin: {
    title: "Review Center",
    subtitle: "Moderate and review platform content",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    links: [
      { label: "Admin Dashboard", href: "/tourism-admin", icon: "📊", desc: "Your review overview" },
      { label: "Review Businesses", href: "/tourism-admin/businesses", icon: "🏢", desc: "Pending business applications" },
      { label: "Review Reports", href: "/tourism-admin/reports", icon: "📋", desc: "Tourist-submitted reports" },
    ],
  },
  business_owner: {
    title: "Business Hub",
    subtitle: "Manage your business profile and services",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    links: [
      { label: "My Business", href: "/business/dashboard", icon: "🏪", desc: "Edit your business profile" },
    ],
  },
  tourist: {
    title: "Explorer Hub",
    subtitle: "Discover amazing experiences in Ethiopia",
    gradient: "from-amber-400 via-orange-500 to-red-500",
    links: [],
  },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (status === "loading" || !mounted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const role = session?.user?.role || "tourist";
  const config = roleConfig[role] || roleConfig.tourist;
  const initials = session?.user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[400px] -right-[400px] w-[800px] h-[800px] bg-amber-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute -bottom-[400px] -left-[400px] w-[800px] h-[800px] bg-orange-600/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <header className="relative z-50 border-b border-white/[0.06]">
        <div className="glass">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-extrabold tracking-tight gradient-text"
            >
              WONDAR ETHIOPIA
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[13px] font-medium text-white">
                  {session?.user?.name}
                </span>
                <span className="text-[11px] text-gray-500 capitalize">
                  {role.replace("_", " ")}
                </span>
              </div>

              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[11px] font-bold text-black">
                {initials}
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="ml-2 px-4 py-1.5 text-[13px] font-medium text-gray-400 hover:text-white border border-white/[0.08] rounded-lg hover:border-white/[0.15] hover:bg-white/[0.03] transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Banner */}
        <div className="animate-fade-in mb-10">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-8 md:p-10">
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-[0.04]`} />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient} animate-pulse`} />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-500">
                  {config.title}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                Welcome back, {session?.user?.name?.split(" ")[0]}
              </h1>
              <p className="text-gray-500 text-[15px] font-medium">
                {config.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        {config.links.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600 mb-5">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {config.links.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative overflow-hidden rounded-xl border border-white/[0.06] p-6 card-hover animate-slide-up`}
                  style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <span className="text-2xl mb-4 block">{link.icon}</span>
                    <h3 className="text-[15px] font-semibold text-white group-hover:text-amber-400 transition-colors duration-300 mb-1">
                      {link.label}
                    </h3>
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      {link.desc}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-amber-500/60 group-hover:text-amber-500 transition-colors">
                      <span className="text-[12px] font-semibold">Open</span>
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tourist empty state */}
        {role === "tourist" && (
          <div className="animate-fade-in mb-10">
            <div className="rounded-2xl border border-white/[0.06] p-10 text-center">
              <span className="text-5xl mb-4 block">🌍</span>
              <h3 className="text-xl font-bold text-white mb-2">
                Ready to explore Ethiopia?
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Browse verified hotels, tour operators, and restaurants across Ethiopia.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-sm font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
              >
                Browse Businesses
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
          <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600 mb-5">
            Account Details
          </h2>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            {[
              { label: "Full Name", value: session?.user?.name },
              { label: "Email Address", value: session?.user?.email },
              { label: "Account Type", value: role.replace("_", " "), isRole: true },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`flex items-center justify-between px-6 py-4 ${
                  i < 2 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                <span className="text-[13px] text-gray-500 font-medium">
                  {item.label}
                </span>
                <span
                  className={`text-[13px] font-medium capitalize ${
                    item.isRole
                      ? "px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[12px]"
                      : "text-white"
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
