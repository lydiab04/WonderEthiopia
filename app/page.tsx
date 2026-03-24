"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Business {
  _id: string;
  name: string;
  description: string;
  category: string;
  location: { city: string; region: string };
  contactPhone: string;
}

const categoryImages: Record<string, string> = {
  hotel: "/lalibela.png",
  tour_operator: "/lalibela.png",
  car_rental: "/restaurant.png",
  event_organizer: "/restaurant.png",
  restaurant: "/restaurant.png",
  other: "/lalibela.png",
};

export default function LandingPage() {
  const { data: session } = useSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/businesses/public?limit=6");
        const data = await res.json();
        setBusinesses(data.businesses?.slice(0, 6) || []);
      } catch (error) {
        console.error("Failed to fetch businesses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  const categories = [
    { name: "Hotels & Lodges", icon: "🏨", value: "hotel", count: "150+" },
    { name: "Tour Operators", icon: "🌍", value: "tour_operator", count: "80+" },
    { name: "Restaurants", icon: "🍲", value: "restaurant", count: "200+" },
    { name: "Car Rentals", icon: "🚗", value: "car_rental", count: "45+" },
  ];

  const stats = [
    { value: "500+", label: "Verified Businesses" },
    { value: "12K+", label: "Happy Tourists" },
    { value: "11", label: "Regions Covered" },
    { value: "4.9★", label: "Average Rating" },
  ];
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50">
        <div className="glass border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-extrabold tracking-tight gradient-text"
            >
              WONDAR ETHIOPIA
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {["Explore", "Categories", "Featured"].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-[13px] font-medium text-gray-500 hover:text-white transition-colors duration-300"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {session ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-[13px] font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-[13px] font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 bg-white text-black text-[13px] font-bold rounded-full hover:bg-gray-100 transition-all duration-300"
                  >
                    Join Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.png"
            alt="Ethiopia Landscape"
            fill
            className="object-cover opacity-50 animate-subtle-zoom"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/30 to-[#050505]" />
        </div>

        <div className="relative z-10 text-center max-w-5xl px-6 pt-16">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-[11px] font-bold tracking-[0.2em] text-amber-400 uppercase bg-amber-400/[0.08] border border-amber-400/20 rounded-full">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Land of Origins
            </span>
          </div>

          <h1 className="animate-slide-up text-5xl sm:text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9]">
            DISCOVER THE{" "}
            <span className="gradient-text">WONDERS</span>
            <br />
            OF ETHIOPIA
          </h1>

          <p className="animate-slide-up delay-1 text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed" style={{ opacity: 0 }}>
            From the rock-hewn churches of Lalibela to the majestic Simien
            Mountains. Experience 3,000 years of history, culture, and nature.
          </p>

          <div className="animate-slide-up delay-2 flex flex-col sm:flex-row items-center justify-center gap-4" style={{ opacity: 0 }}>
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-base font-extrabold rounded-full hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-[1.02]"
            >
              Start Exploring
            </Link>
            <Link
              href="#featured"
              className="w-full sm:w-auto px-8 py-4 glass text-white text-base font-bold rounded-full hover:bg-white/[0.08] transition-all duration-300"
            >
              See Businesses
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-white/40 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-white/[0.04] bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-[13px] text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600 mb-3 block">
              Browse by Category
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Find What You Need
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-amber-500 to-orange-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="group relative overflow-hidden p-8 rounded-2xl border border-white/[0.06] card-hover cursor-pointer text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform duration-500">
                    {cat.icon}
                  </span>
                  <h3 className="text-base font-bold mb-1">{cat.name}</h3>
                  <p className="text-[13px] text-gray-600">{cat.count} listed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section id="featured" className="py-24 relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-amber-500/[0.03] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-orange-600/[0.03] rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600 mb-3 block">
                Trusted Partners
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Featured Operators
              </h2>
            </div>
            <p className="text-[13px] text-gray-600 font-medium italic">
              Verified by WondarEthiopia Tourism Admin
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-[420px] rounded-2xl border border-white/[0.06] animate-shimmer"
                />
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-white/[0.06]">
              <span className="text-4xl mb-4 block">✨</span>
              <p className="text-gray-600 font-medium">
                Amazing businesses coming soon. Stay tuned!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {businesses.map((biz) => (
                <div
                  key={biz._id}
                  className="group rounded-2xl border border-white/[0.06] overflow-hidden card-hover"
                >
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={categoryImages[biz.category] || "/lalibela.png"}
                      alt={biz.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 px-3 py-1 glass rounded-full text-[10px] font-bold tracking-widest uppercase">
                      {biz.category.replace("_", " ")}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-amber-400 transition-colors duration-300 line-clamp-1">
                      {biz.name}
                    </h3>
                    <p className="text-[13px] text-gray-600 mb-5 line-clamp-2 leading-relaxed">
                      {biz.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                      <span className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-amber-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {biz.location.city}, {biz.location.region}
                      </span>
                      <span className="text-amber-500 font-semibold text-[12px] flex items-center gap-1 group-hover:gap-2 transition-all">
                        Details
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[80px] -mr-40 -mt-40" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/10 rounded-full blur-[60px] -ml-20 -mb-20" />

          <div className="relative z-10 p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-10 text-black">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                GROW YOUR BUSINESS
                <br />
                WITH US
              </h2>
              <p className="text-lg font-medium opacity-80 max-w-lg">
                Partner with WondarEthiopia and reach thousands of tourists. Secure, transparent, and authentic.
              </p>
            </div>
            <Link
              href="/business"
              className="shrink-0 px-10 py-4 bg-black text-white text-base font-extrabold rounded-full hover:bg-gray-900 transition-all duration-300 shadow-xl shadow-black/20 hover:scale-[1.02]"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-[#030303]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <span className="text-lg font-extrabold tracking-tight gradient-text block mb-3">
                WONDAR ETHIOPIA
              </span>
              <p className="text-[13px] text-gray-600 leading-relaxed max-w-sm">
                Your trusted gateway to exploring Ethiopia&apos;s breathtaking
                landscapes, ancient heritage, and vibrant culture since 2024.
              </p>
            </div>
            <div>
              <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600 mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5">
                {["Explore", "Register", "Business Portal"].map((item) => (
                  <li key={item}>
                    <Link
                      href={
                        item === "Explore"
                          ? "/"
                          : item === "Register"
                            ? "/register"
                            : "/business"
                      }
                      className="text-[13px] text-gray-500 hover:text-white transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600 mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "Contact"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-[13px] text-gray-500 hover:text-white transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-gray-700">
              © {new Date().getFullYear()} WondarEthiopia. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-[12px] text-gray-700">
              <span>Made with</span>
              <span className="text-amber-500">♥</span>
              <span>in Ethiopia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
