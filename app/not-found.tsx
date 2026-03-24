import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-3">
          Page Not Found
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-[13px] font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
